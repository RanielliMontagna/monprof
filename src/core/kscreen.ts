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
  // Try currentMode object first (if present as object)
  const currentMode = output.currentMode;
  if (currentMode && typeof currentMode === "object" && !Array.isArray(currentMode)) {
    const mode = currentMode as Record<string, unknown>;
    // Mode might have a 'name' field already formatted (e.g., "1920x1080@60")
    if (mode.name && typeof mode.name === "string") {
      return mode.name;
    }
    // Or try to construct from size
    if (mode.size && typeof mode.size === "object" && !Array.isArray(mode.size)) {
      const size = mode.size as { width?: number; height?: number };
      if (typeof size.width === "number" && typeof size.height === "number") {
        const refresh = (mode.refreshRate as number) || (mode.refresh as number) || 60;
        return `${size.width}x${size.height}@${refresh}`;
      }
    }
  }

  // Try currentModeId - find the mode in modes array
  const currentModeId = output.currentModeId;
  if (currentModeId !== undefined && output.modes) {
    const modes = output.modes as Array<Record<string, unknown>>;
    const mode = modes.find((m) => String(m.id) === String(currentModeId));
    if (mode) {
      // Mode might have a 'name' field already formatted
      if (mode.name && typeof mode.name === "string") {
        return mode.name;
      }
      // Or try to construct from size
      if (mode.size && typeof mode.size === "object") {
        const size = mode.size as { width?: number; height?: number };
        if (typeof size.width === "number" && typeof size.height === "number") {
          const refresh = (mode.refreshRate as number) || (mode.refresh as number) || 60;
          return `${size.width}x${size.height}@${refresh}`;
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

  if (!kscreenConfig.outputs || !Array.isArray(kscreenConfig.outputs)) {
    return { outputs: [] };
  }

  for (const outputRaw of kscreenConfig.outputs) {
    // outputRaw is a Record<string, unknown> from DBus variant map

    // Get name - required field
    const outputName = outputRaw.name;
    if (!outputName || typeof outputName !== "string") {
      // Fallback to id if name not available
      const outputId = outputRaw.id;
      if (outputId === undefined) {
        continue; // Skip outputs without name or id
      }
      // Use id as name fallback
      continue; // For now, skip outputs without explicit name (they're not usable)
    }

    const enabled = outputRaw.enabled ?? outputRaw.connected ?? false;
    if (typeof enabled !== "boolean") {
      continue;
    }

    const normalized: DisplayOutput = {
      name: outputName,
      enabled,
    };

    // Primary display
    if (outputRaw.primary !== undefined && typeof outputRaw.primary === "boolean") {
      normalized.primary = outputRaw.primary;
    }

    // Rotation
    if (outputRaw.rotation !== undefined && typeof outputRaw.rotation === "number") {
      normalized.rotation = numberToRotation(outputRaw.rotation);
    }

    // Mode
    const mode = parseMode(outputRaw);
    if (mode) {
      normalized.mode = mode;
    }

    // Position
    if (outputRaw.position && typeof outputRaw.position === "object") {
      const pos = outputRaw.position as { x?: number; y?: number };
      if (typeof pos.x === "number" && typeof pos.y === "number") {
        normalized.position = [pos.x, pos.y];
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
  const outputs: Array<Record<string, unknown>> = config.outputs.map((out) => {
    const kscreenOut: Record<string, unknown> = {
      name: out.name,
      enabled: out.enabled,
    };

    if (out.primary !== undefined) {
      kscreenOut.primary = out.primary;
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
