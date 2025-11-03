/**
 * KScreen DBus integration
 * Communicates with KDE's KScreen service via DBus
 */

import { type Interface, MessageBus } from "dbus-next";

const KSCREEN_SERVICE = "org.kde.KScreen";
const KSCREEN_PATH = "/backend";
const KSCREEN_INTERFACE = "org.kde.KScreen.Backend";

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

/**
 * KScreen DBus interface structure (based on typical KScreen output)
 */
interface KScreenOutput {
  id?: number;
  name: string;
  enabled: boolean;
  modes?: Array<{
    id?: number;
    name?: string;
    size?: { width: number; height: number };
    refresh?: number;
  }>;
  currentMode?: {
    id?: number;
    name?: string;
    size?: { width: number; height: number };
    refresh?: number;
  };
  position?: { x: number; y: number };
  scale?: number;
  rotation?: number; // 0=normal, 1=90° right, 2=180°, 3=270° right (inverted)
  primary?: boolean;
  priority?: number;
}

interface KScreenRawConfig {
  outputs?: KScreenOutput[];
  [key: string]: unknown;
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
 */
function parseMode(output: KScreenOutput): string | undefined {
  const current = output.currentMode;
  if (!current || !current.size) return undefined;

  const width = current.size.width;
  const height = current.size.height;
  const refresh = current.refresh || 60;

  return `${width}x${height}@${refresh}`;
}

/**
 * Get current display configuration from KScreen
 */
export async function getConfig(): Promise<KScreenConfig> {
  const bus = MessageBus.sessionBus();
  await bus.connect();

  try {
    const proxy = await bus.getProxyObject(KSCREEN_SERVICE, KSCREEN_PATH);
    const backend = proxy.getInterface(KSCREEN_INTERFACE) as Interface;
    const result = await backend.getConfig();

    await bus.disconnect();
    return normalizeConfig(result as KScreenRawConfig);
  } catch (error) {
    await bus.disconnect();
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get KScreen config: ${errorMessage}`);
  }
}

/**
 * Apply a display configuration to KScreen
 */
export async function setConfig(config: KScreenConfig): Promise<void> {
  const bus = MessageBus.sessionBus();
  await bus.connect();

  try {
    const proxy = await bus.getProxyObject(KSCREEN_SERVICE, KSCREEN_PATH);
    const backend = proxy.getInterface(KSCREEN_INTERFACE) as Interface;
    const kscreenConfig = denormalizeConfig(config);

    await backend.setConfig(kscreenConfig);

    await bus.disconnect();
  } catch (error) {
    await bus.disconnect();
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

  for (const output of kscreenConfig.outputs) {
    if (!output.name) continue;

    const normalized: DisplayOutput = {
      name: output.name,
      enabled: output.enabled ?? false,
    };

    if (output.primary !== undefined) {
      normalized.primary = output.primary;
    }

    if (output.rotation !== undefined) {
      normalized.rotation = numberToRotation(output.rotation);
    }

    const mode = parseMode(output);
    if (mode) {
      normalized.mode = mode;
    }

    if (output.position) {
      normalized.position = [output.position.x, output.position.y];
    }

    outputs.push(normalized);
  }

  return { outputs };
}

/**
 * Convert our internal format to KScreen config format
 * Exported for testing purposes
 */
export function denormalizeConfig(config: KScreenConfig): KScreenRawConfig {
  const outputs: KScreenOutput[] = config.outputs.map((out) => {
    const kscreenOut: KScreenOutput = {
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
