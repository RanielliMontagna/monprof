/**
 * KScreen DBus integration
 * Communicates with KDE's KScreen service via DBus
 */

// dbus-next is CommonJS, exports sessionBus/systemBus directly (not MessageBus class)
// We need to handle this properly in ESM context using createRequire
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
// biome-ignore lint/suspicious/noExplicitAny: dbus-next doesn't export proper types
let sessionBusFn: ((...args: unknown[]) => any) | null = null;

async function getSessionBus() {
  if (!sessionBusFn) {
    // Import dbus-next - it exports sessionBus as a function directly
    const dbusNext = require("dbus-next");
    sessionBusFn = dbusNext.sessionBus;
    if (!sessionBusFn || typeof sessionBusFn !== "function") {
      throw new Error("dbus-next: sessionBus not found or is not a function");
    }
  }
  return sessionBusFn();
}

// Type definition for Interface (dbus-next doesn't export types properly)
// biome-ignore lint/suspicious/noExplicitAny: dbus-next doesn't export proper types
type Interface = any;

const KSCREEN_SERVICE = "org.kde.KScreen";
const KSCREEN_INTERFACE_MAIN = "org.kde.KScreen";
const KSCREEN_INTERFACE_BACKEND = "org.kde.kscreen.Backend"; // Note: lowercase 'kscreen'
const KSCREEN_BACKEND_PATH = "/backend";

export interface DisplayOutput {
  name: string;
  enabled: boolean;
  primary?: boolean;
  rotation?: "normal" | "left" | "right" | "inverted";
  mode?: string;
  position?: [number, number];
}

export interface KScreenConfig {
  outputs: DisplayOutput[];
}

// KScreen returns a map (a{sv}) - dbus-next converts to object
interface KScreenRawConfig {
  outputs?: Array<Record<string, unknown>>; // Array of variant maps from DBus
  features?: number;
  screen?: unknown;
  [key: string]: unknown;
}

/**
 * Ensure backend is available and return the backend path
 */
// biome-ignore lint/suspicious/noExplicitAny: dbus-next MessageBus type not properly exported
async function ensureBackend(bus: any): Promise<string> {
  try {
    // First, try to ensure backend is requested
    const mainProxy = await bus.getProxyObject(KSCREEN_SERVICE, "/");
    const mainInterface = mainProxy.getInterface(KSCREEN_INTERFACE_MAIN) as Interface;

    // Request backend if needed (this might be necessary on first use)
    try {
      await mainInterface.requestBackend("", {});
    } catch {
      // Backend might already be available, continue
    }

    // The backend path is always /backend (verified via busctl tree)
    return KSCREEN_BACKEND_PATH;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to ensure KScreen backend: ${errorMessage}`);
  }
}

/**
 * Map rotation enum to KScreen rotation number
 */
function rotationToNumber(rotation: string | undefined): number {
  switch (rotation) {
    case "left":
      return 3; // 270° (left)
    case "right":
      return 1; // 90° (right)
    case "inverted":
      return 2; // 180°
    default:
      return 0;
  }
}

/**
 * Unwrap DBus Variant recursively
 * dbus-next wraps variant values in objects with 'signature' and 'value' properties
 */
function unwrapVariant(value: unknown): unknown {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    // Check if it's a Variant (has 'value' property, might have 'signature')
    if ("value" in obj) {
      // Recursively unwrap the value
      return unwrapVariant(obj.value);
    }
  }
  return value;
}

/**
 * Map KScreen rotation number to rotation enum
 */
function numberToRotation(rotation: number): "normal" | "left" | "right" | "inverted" {
  switch (rotation) {
    case 1:
      return "right";
    case 2:
      return "inverted";
    case 3:
      return "left";
    default:
      return "normal";
  }
}

/**
 * Parse mode from KScreen format
 * KScreen stores modes in an array, and currentModeId points to the active mode
 */
function parseMode(output: Record<string, unknown>): string | undefined {
  // Unwrap variants first
  const currentMode = unwrapVariant(output.currentMode);
  if (currentMode && typeof currentMode === "object" && !Array.isArray(currentMode)) {
    const mode = currentMode as Record<string, unknown>;
    // Mode might have a 'name' field already formatted (e.g., "1920x1080@60")
    const modeName = unwrapVariant(mode.name);
    if (modeName && typeof modeName === "string") {
      return modeName;
    }
    // Or try to construct from size
    const modeSize = unwrapVariant(mode.size);
    if (modeSize && typeof modeSize === "object" && !Array.isArray(modeSize)) {
      const size = modeSize as { width?: unknown; height?: unknown };
      const width = unwrapVariant(size.width);
      const height = unwrapVariant(size.height);
      if (typeof width === "number" && typeof height === "number") {
        const refreshRaw = unwrapVariant(mode.refreshRate || mode.refresh);
        const refresh = typeof refreshRaw === "number" ? refreshRaw : typeof refreshRaw === "bigint" ? Number(refreshRaw) : 60;
        return `${width}x${height}@${refresh}`;
      }
    }
  }

  // Try currentModeId - find the mode in modes array
  const currentModeId = unwrapVariant(output.currentModeId);
  const modesRaw = unwrapVariant(output.modes);
  if (currentModeId !== undefined && currentModeId !== null && modesRaw) {
    const modes = (Array.isArray(modesRaw) ? modesRaw : Object.values(modesRaw)) as Array<Record<string, unknown>>;
    // currentModeId might be a string or number, normalize for comparison
    const currentModeIdStr = String(currentModeId);
    const currentModeIdNum = typeof currentModeId === "number" ? currentModeId : typeof currentModeId === "bigint" ? Number(currentModeId) : null;
    
    const mode = modes.find((m) => {
      // Unwrap the entire mode object first, then get id
      const unwrappedMode = typeof m === "object" && m !== null && !Array.isArray(m) && "value" in m 
        ? (m as Record<string, unknown>).value 
        : m;
      const modeObj = unwrappedMode as Record<string, unknown>;
      const modeId = unwrapVariant(modeObj.id);
      // Try both string and number comparison
      if (String(modeId) === currentModeIdStr) return true;
      if (currentModeIdNum !== null) {
        const modeIdNum = typeof modeId === "number" ? modeId : typeof modeId === "bigint" ? Number(modeId) : typeof modeId === "string" ? Number.parseInt(modeId, 10) : null;
        if (modeIdNum !== null && !Number.isNaN(modeIdNum) && modeIdNum === currentModeIdNum) return true;
      }
      return false;
    });
    if (mode) {
      // Unwrap the mode object if it's wrapped
      let unwrappedModeObj = mode;
      if (typeof mode === "object" && mode !== null && !Array.isArray(mode) && "value" in mode) {
        unwrappedModeObj = (mode as Record<string, unknown>).value as Record<string, unknown>;
      }
      const modeObj = unwrappedModeObj as Record<string, unknown>;
      
      // Unwrap mode properties
      const modeName = unwrapVariant(modeObj.name);
      if (modeName && typeof modeName === "string") {
        return modeName;
      }
      // Or try to construct from size
      const modeSize = unwrapVariant(modeObj.size);
      if (modeSize && typeof modeSize === "object" && !Array.isArray(modeSize)) {
        const size = modeSize as { width?: unknown; height?: unknown };
        const width = unwrapVariant(size.width);
        const height = unwrapVariant(size.height);
        if (typeof width === "number" && typeof height === "number") {
          const refreshRaw = unwrapVariant(modeObj.refreshRate || modeObj.refresh);
          const refresh = typeof refreshRaw === "number" ? refreshRaw : typeof refreshRaw === "bigint" ? Number(refreshRaw) : 60;
          return `${width}x${height}@${refresh}`;
        }
      }
    }
  }

  return undefined;
}

/**
 * Get current display configuration from KScreen
 */
export async function getConfig(): Promise<KScreenConfig> {
  const bus = await getSessionBus();
  // sessionBus() returns an already connected bus, no need to call connect()

  try {
    // Ensure backend is available
    const backendPath = await ensureBackend(bus);

    const proxy = await bus.getProxyObject(KSCREEN_SERVICE, backendPath);
    const backend = proxy.getInterface(KSCREEN_INTERFACE_BACKEND) as Interface;
    const result = await backend.getConfig();

    // dbus-next wraps DBus variants in objects with 'signature' and 'value' properties
    // Extract the actual value from variant wrappers
    if (typeof result === "object" && result !== null) {
      const resultObj = result as Record<string, unknown>;
      // Unwrap variant if present (has 'value' and 'signature' properties)
      if (resultObj.outputs && typeof resultObj.outputs === "object" && !Array.isArray(resultObj.outputs)) {
        const outputsVariant = resultObj.outputs as Record<string, unknown>;
        if ("value" in outputsVariant) {
          resultObj.outputs = outputsVariant.value;
        }
      }
    }

    return normalizeConfig(result as KScreenRawConfig);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get KScreen config: ${errorMessage}`);
  }
}

/**
 * Apply a display configuration to KScreen
 */
export async function setConfig(config: KScreenConfig): Promise<void> {
  const bus = await getSessionBus();
  // sessionBus() returns an already connected bus, no need to call connect()

  try {
    // Ensure backend is available
    const backendPath = await ensureBackend(bus);

    const proxy = await bus.getProxyObject(KSCREEN_SERVICE, backendPath);
    const backend = proxy.getInterface(KSCREEN_INTERFACE_BACKEND) as Interface;
    const kscreenConfig = denormalizeConfig(config);

    await backend.setConfig(kscreenConfig);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to set KScreen config: ${errorMessage}`);
  }
}

/**
 * Normalize KScreen config format to our internal format
 * Exported for testing purposes
 */
export function normalizeConfig(kscreenConfig: KScreenRawConfig): KScreenConfig {
  const outputs: DisplayOutput[] = [];

  if (!kscreenConfig.outputs) {
    return { outputs: [] };
  }

  // dbus-next may wrap outputs in a variant or return as object/dict
  // Handle all cases
  let outputsArray: Array<Record<string, unknown>>;
  
  // First, unwrap variant if present
  let unwrappedOutputs: unknown = kscreenConfig.outputs;
  if (typeof unwrappedOutputs === "object" && unwrappedOutputs !== null && !Array.isArray(unwrappedOutputs)) {
    const outputsObj = unwrappedOutputs as Record<string, unknown>;
    if ("value" in outputsObj) {
      unwrappedOutputs = outputsObj.value;
    }
  }
  
  if (Array.isArray(unwrappedOutputs)) {
    outputsArray = unwrappedOutputs as Array<Record<string, unknown>>;
  } else if (typeof unwrappedOutputs === "object" && unwrappedOutputs !== null) {
    // Convert object/dict to array (e.g., {0: {...}, 1: {...}} -> [{...}, {...}])
    const outputsObj = unwrappedOutputs as Record<string, unknown>;
    outputsArray = Object.values(outputsObj) as Array<Record<string, unknown>>;
  } else {
    return { outputs: [] };
  }

  // Find the primary display based on priority (lowest priority = primary)
  // Also check for explicit primary flag (for test compatibility)
  // Only consider enabled outputs
  let primaryOutputIndex = -1;
  let lowestPriority: number | null = null;
  let hasExplicitPrimary = false;
  
  for (let i = 0; i < outputsArray.length; i++) {
    let outputRaw = outputsArray[i];
    
    // Unwrap variant if needed
    let unwrapped: unknown = outputRaw;
    while (typeof unwrapped === "object" && unwrapped !== null && !Array.isArray(unwrapped)) {
      const outputObj = unwrapped as Record<string, unknown>;
      if ("value" in outputObj && !("name" in outputObj)) {
        unwrapped = outputObj.value;
      } else {
        break;
      }
    }
    const output = unwrapped as Record<string, unknown>;
    
    // Unwrap all variant values
    const unwrappedOutput: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(output)) {
      unwrappedOutput[key] = unwrapVariant(val);
    }
    
    // Check if enabled
    let enabled = unwrappedOutput.enabled ?? unwrappedOutput.connected ?? false;
    if (typeof enabled === "number") {
      enabled = enabled === 1;
    } else if (typeof enabled === "bigint") {
      enabled = enabled === BigInt(1);
    }
    
    // Check for explicit primary flag (for test data compatibility)
    const explicitPrimary = unwrappedOutput.primary;
    if (enabled && explicitPrimary === true) {
      hasExplicitPrimary = true;
      primaryOutputIndex = i;
    } else if (enabled && unwrappedOutput.priority !== undefined && !hasExplicitPrimary) {
      // Only use priority if no explicit primary was found
      const priority = unwrappedOutput.priority;
      const priorityNum = typeof priority === "number" ? priority : typeof priority === "bigint" ? Number(priority) : typeof priority === "string" ? Number.parseInt(priority, 10) : null;
      if (priorityNum !== null && !Number.isNaN(priorityNum)) {
        if (lowestPriority === null || priorityNum < lowestPriority) {
          lowestPriority = priorityNum;
          primaryOutputIndex = i;
        }
      }
    }
  }
  

  for (let i = 0; i < outputsArray.length; i++) {
    let outputRaw = outputsArray[i];
    
    // Each output might also be wrapped in a variant - unwrap recursively
    let unwrapped: unknown = outputRaw;
    while (typeof unwrapped === "object" && unwrapped !== null && !Array.isArray(unwrapped)) {
      const outputObj = unwrapped as Record<string, unknown>;
      // Check if it's a variant (has 'value' and possibly 'signature')
      if ("value" in outputObj && !("name" in outputObj)) {
        unwrapped = outputObj.value;
      } else {
        // Not a variant, use as-is
        break;
      }
    }
    const output = unwrapped as Record<string, unknown>;
    
    // Unwrap all variant values in the output object
    const unwrappedOutput: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(output)) {
      unwrappedOutput[key] = unwrapVariant(val);
    }
    
    // Get name - required field
    const outputName = unwrappedOutput.name;
    if (!outputName || typeof outputName !== "string") {
      // Fallback to id if name not available
      const outputId = unwrappedOutput.id;
      if (outputId === undefined) {
        continue; // Skip outputs without name or id
      }
      // Use id as name fallback
      continue; // For now, skip outputs without explicit name (they're not usable)
    }

    // DBus returns boolean as numbers (1/0) or boolean, handle both
    let enabled = unwrappedOutput.enabled ?? unwrappedOutput.connected ?? false;
    if (typeof enabled === "number") {
      enabled = enabled === 1;
    } else if (typeof enabled === "bigint") {
      // Handle BigInt (e.g., from DBus int64)
      enabled = enabled === BigInt(1);
    }
    if (typeof enabled !== "boolean") {
      continue;
    }

    const normalized: DisplayOutput = {
      name: outputName,
      enabled,
    };

    // Primary display - determined by lowest priority among enabled outputs
    // Mark as primary if this is the output with lowest priority
    if (enabled && i === primaryOutputIndex) {
      normalized.primary = true;
    }

    // Rotation
    const rotation = unwrappedOutput.rotation;
    if (rotation !== undefined) {
      const rotationNum = typeof rotation === "bigint" ? Number(rotation) : rotation;
      if (typeof rotationNum === "number") {
        normalized.rotation = numberToRotation(rotationNum);
      }
    }

    // Mode
    const mode = parseMode(unwrappedOutput);
    if (mode) {
      normalized.mode = mode;
    }

    // Position - KScreen uses 'pos' key, not 'position'
    const position = unwrapVariant(unwrappedOutput.pos || unwrappedOutput.position);
    if (position && typeof position === "object" && !Array.isArray(position)) {
      const pos = position as { x?: unknown; y?: unknown };
      const x = unwrapVariant(pos.x);
      const y = unwrapVariant(pos.y);
      if (typeof x === "number" && typeof y === "number") {
        normalized.position = [x, y];
      } else if (typeof x === "bigint" && typeof y === "bigint") {
        normalized.position = [Number(x), Number(y)];
      }
    }

    outputs.push(normalized);
  }

  return { outputs };
}

/**
 * Convert our internal format to KScreen config format
 * Exported for testing purposes
 */
export function denormalizeConfig(config: KScreenConfig): Record<string, unknown> {
  // KScreen expects a{sv} (map), with 'outputs' key containing array of variant maps
  // First, determine priorities based on primary flag
  // Primary display gets priority 1, others get incrementing priorities (2, 3, ...)
  const outputs: Array<Record<string, unknown>> = config.outputs.map((out, index) => {
    const kscreenOut: Record<string, unknown> = {
      name: out.name,
      enabled: out.enabled,
    };

    // KScreen uses priority (lower = primary), not a boolean primary field
    // Primary display gets priority 1, others get incrementing priorities starting from 2
    if (out.primary === true) {
      kscreenOut.priority = 1; // Primary gets lowest priority (1)
    } else {
      // Non-primary outputs get priorities 2, 3, 4, etc.
      // Count how many non-primary enabled outputs come before this one
      let priority = 2;
      for (let i = 0; i < index; i++) {
        if (config.outputs[i].enabled && config.outputs[i].primary !== true) {
          priority++;
        }
      }
      kscreenOut.priority = priority;
    }

    if (out.rotation !== undefined) {
      kscreenOut.rotation = rotationToNumber(out.rotation);
    }

    if (out.position) {
      kscreenOut.position = { x: out.position[0], y: out.position[1] };
    }

    if (out.mode) {
      const modeMatch = out.mode.match(/^(\d+)x(\d+)@(\d+)$/);
      if (modeMatch?.[1] && modeMatch[2] && modeMatch[3]) {
        // KScreen may need currentModeId instead of full currentMode object
        // Try to construct a mode ID or use the mode string directly
        kscreenOut.currentModeId = modeMatch[1] + modeMatch[2] + modeMatch[3]; // Simple ID
        // Also include the mode object for compatibility
        kscreenOut.currentMode = {
          size: {
            width: Number.parseInt(modeMatch[1], 10),
            height: Number.parseInt(modeMatch[2], 10),
          },
          refresh: Number.parseInt(modeMatch[3], 10),
        };
      }
    }

    return kscreenOut;
  });

  return { outputs };
}
