/**
 * System tray implementation
 */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { type BrowserWindow, Menu, nativeImage, Tray, app } from "electron";
import { setConfig } from "../../src/core/kscreen.js";
import { getProfile, listProfileNames } from "../../src/core/profiles.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;

/**
 * Create a simple icon from a base64 string (monitor icon representation)
 */
function createTrayIcon(): Electron.NativeImage {
  // Create a simple 16x16 icon with a monitor representation
  // Using nativeImage.createEmpty() and then drawing would be complex,
  // so we'll use a template icon approach or fallback to system icon
  const iconPath = join(__dirname, "../../../assets/icon.png");
  
  try {
    // Try to load icon from assets
    return nativeImage.createFromPath(iconPath);
  } catch {
    // Electron will use a system default if no icon is set
    // We'll rely on system default for now
    return nativeImage.createEmpty();
  }
}

/**
 * Setup system tray
 */
export async function setupTray(window: BrowserWindow | null): Promise<void> {
  mainWindow = window;

  if (tray) {
    tray.destroy();
  }

  // Create tray icon (will use system default if no icon available)
  const icon = createTrayIcon();
  
  // If icon is empty, Electron will use system default or app icon
  if (icon.isEmpty()) {
    // Use empty icon - system will provide default
    const defaultIcon = nativeImage.createEmpty();
    tray = new Tray(defaultIcon);
    tray.setToolTip("Monprof - Monitor Profiles");
  } else {
    tray = new Tray(icon);
    tray.setToolTip("Monprof - Monitor Profiles");
  }

  // Initial menu update
  await updateTrayMenu();

  // Update menu when window state changes
  if (mainWindow) {
    mainWindow.on("close", (event) => {
      // Hide instead of closing (tray keeps app running)
      event.preventDefault();
      mainWindow?.hide();
    });

    // Update tray menu when profiles might have changed
    // This will be called externally when profiles are saved/updated
  }
}

/**
 * Update tray menu with current profiles
 */
export async function updateTrayMenu(): Promise<void> {
  if (!tray) return;

  try {
    const profileNames = await listProfileNames();

    const menuItems = [
      ...profileNames.map((name) => ({
        label: `Apply: ${name}`,
        click: async () => {
          try {
            const profile = await getProfile(name);
            if (profile) {
              await setConfig({ outputs: profile.outputs });
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[Tray] Failed to apply profile ${name}:`, errorMessage);
          }
        },
      })),
      { type: "separator" as const },
      {
        label: mainWindow?.isVisible() ? "Hide Window" : "Show Window",
        click: () => {
          if (mainWindow) {
            if (mainWindow.isVisible()) {
              mainWindow.hide();
            } else {
              mainWindow.show();
              mainWindow.focus();
            }
          }
        },
      },
      {
        label: "Reload Profiles",
        click: async () => {
          await updateTrayMenu();
        },
      },
      { type: "separator" as const },
      {
        label: "Quit",
        click: () => {
          app.quit();
        },
      },
    ];

    // If no profiles, show message
    if (profileNames.length === 0) {
      menuItems.unshift({
        label: "No profiles available",
        click: () => {
          // No-op, just informational
        },
      });
    }

    const menu = Menu.buildFromTemplate(menuItems);
    tray.setContextMenu(menu);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Tray] Failed to update menu:", errorMessage);
  }
}

/**
 * Cleanup tray on app quit
 */
export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}
