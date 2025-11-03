/**
 * Electron main process
 */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { IpcMainInvokeEvent } from "electron";
import { BrowserWindow, app, ipcMain } from "electron";
import { getConfig, setConfig } from "../../src/core/kscreen.js";
import { getProfile, readProfiles, saveProfile } from "../../src/core/profiles.js";
import { destroyTray, setupTray, updateTrayMenu } from "./tray.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  // Ensure preload path is absolute and exists
  const preloadPath = join(__dirname, "preload.js");

  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    show: false, // Don't show until ready
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  // In development, load from Vite dev server
  const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

  if (isDev) {
    const VITE_DEV_SERVER_PORT = 5173;
    const VITE_DEV_SERVER_URL = `http://localhost:${VITE_DEV_SERVER_PORT}`;
    const VITE_STARTUP_DELAY_MS = 1000;

    // Wait a bit for Vite to start, then load
    setTimeout(() => {
      mainWindow?.loadURL(VITE_DEV_SERVER_URL).catch((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("[Electron] Failed to load Vite dev server:", errorMessage);
        // Fallback to built files if dev server not available
        const indexPath = join(__dirname, "../../dist/ui/index.html");
        mainWindow?.loadFile(indexPath).catch((err: unknown) => {
          const errMessage = err instanceof Error ? err.message : String(err);
          console.error("[Electron] Failed to load built files:", errMessage);
        });
      });
    }, VITE_STARTUP_DELAY_MS);
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from built files
    const indexPath = join(__dirname, "../../dist/ui/index.html");
    mainWindow.loadFile(indexPath);
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  createWindow();
  await setupTray(mainWindow);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  destroyTray();
});

// IPC Handlers

ipcMain.handle("profiles:list", async (_evt: IpcMainInvokeEvent) => {
  const data = await readProfiles();
  return data.profiles;
});

ipcMain.handle("profiles:apply", async (_evt: IpcMainInvokeEvent, name: string) => {
  if (typeof name !== "string" || name.trim().length === 0) {
    throw new Error("Profile name must be a non-empty string");
  }

  const profile = await getProfile(name);
  if (!profile) {
    throw new Error(`Profile '${name}' not found`);
  }
  await setConfig({ outputs: profile.outputs });
  return true;
});

ipcMain.handle("profiles:save", async (_evt: IpcMainInvokeEvent, name: string) => {
  if (typeof name !== "string" || name.trim().length === 0) {
    throw new Error("Profile name must be a non-empty string");
  }

  const currentConfig = await getConfig();
  await saveProfile(name, { outputs: currentConfig.outputs });
  await updateTrayMenu(); // Update tray menu after saving
  return true;
});

ipcMain.handle(
  "profiles:update",
  async (
    _evt: IpcMainInvokeEvent,
    payload: {
      name: string;
      profile: {
        outputs: Array<{
          name: string;
          enabled: boolean;
          primary?: boolean;
          rotation?: "normal" | "left" | "right" | "inverted";
          mode?: string;
          position?: [number, number];
        }>;
      };
    }
  ) => {
    if (typeof payload?.name !== "string" || payload.name.trim().length === 0) {
      throw new Error("Profile name must be a non-empty string");
    }
    if (!payload?.profile || !Array.isArray(payload.profile.outputs)) {
      throw new Error("Invalid profile data: outputs array is required");
    }

    await saveProfile(payload.name, payload.profile);
    await updateTrayMenu(); // Update tray menu after updating
    return true;
  }
);

ipcMain.handle("profiles:getCurrent", async (_evt: IpcMainInvokeEvent) => {
  const config = await getConfig();
  return config;
});
