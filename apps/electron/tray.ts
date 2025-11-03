/**
 * System tray implementation
 */

import { type BrowserWindow, Menu, type Tray, app } from "electron";
import { setConfig } from "../../src/core/kscreen.js";
import { listProfileNames, getProfile } from "../../src/core/profiles.js";

const tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;

export async function setupTray(window: BrowserWindow | null) {
  mainWindow = window;
  // TODO: Implement tray icon once assets are available
  // tray = new Tray(join(__dirname, "../assets/icon.png"));
  // await updateTrayMenu();

  // Reference to avoid unused function warning
  void updateTrayMenu;
}

async function updateTrayMenu(): Promise<void> {
  if (!tray) return;

  const profileNames = await listProfileNames();

  const menuItems = [
    ...profileNames.map((name) => ({
      label: `Apply: ${name}`,
      click: async () => {
        try {
          const profile = await getProfile(name as string);
          if (profile) {
            await setConfig({ outputs: profile.outputs });
          }
        } catch (error) {
          console.error(`Failed to apply profile ${name}:`, error);
        }
      },
    })),
    { type: "separator" as const },
    {
      label: "Open Monitor Profiles...",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      },
    },
    {
      label: "Reload displays",
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

  const menu = Menu.buildFromTemplate(menuItems);
  tray.setContextMenu(menu);
}
