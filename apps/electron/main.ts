/**
 * Electron main process
 */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BrowserWindow, app, ipcMain } from "electron";
import { getConfig, setConfig } from "../../src/core/kscreen.js";
import { getProfile, readProfiles, saveProfile } from "../../src/core/profiles.js";
import { setupTray } from "./tray.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // In development, load from Vite dev server
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from built files
    mainWindow.loadFile(join(__dirname, "../../dist/ui/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  setupTray(mainWindow);

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

// IPC Handlers

ipcMain.handle("profiles:list", async () => {
  const data = await readProfiles();
  return data.profiles;
});

ipcMain.handle("profiles:apply", async (_evt, name: string) => {
  const profile = await getProfile(name);
  if (!profile) {
    throw new Error(`Profile '${name}' not found`);
  }
  await setConfig({ outputs: profile.outputs });
  return true;
});

ipcMain.handle("profiles:save", async (_evt, name: string) => {
  const currentConfig = await getConfig();
  await saveProfile(name, { outputs: currentConfig.outputs });
  return true;
});

ipcMain.handle(
  "profiles:update",
  async (
    _evt,
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
    await saveProfile(payload.name, payload.profile);
    return true;
  }
);

ipcMain.handle("profiles:getCurrent", async () => {
  const config = await getConfig();
  return config;
});
