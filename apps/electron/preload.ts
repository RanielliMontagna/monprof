/**
 * Electron preload script
 * Safe bridge between renderer and main process
 */

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("monprof", {
  list: () => ipcRenderer.invoke("profiles:list"),
  apply: (name: string) => ipcRenderer.invoke("profiles:apply", name),
  save: (name: string) => ipcRenderer.invoke("profiles:save", name),
  update: (payload: { name: string; profile: { outputs: unknown[] } }) =>
    ipcRenderer.invoke("profiles:update", payload),
  getCurrent: () => ipcRenderer.invoke("profiles:getCurrent"),
  delete: (name: string) => ipcRenderer.invoke("profiles:delete", name),
});

// Type declarations for TypeScript
declare global {
  interface Window {
    monprof: {
      list: () => Promise<Record<string, { outputs: unknown[] }>>;
      apply: (name: string) => Promise<boolean>;
      save: (name: string) => Promise<boolean>;
      update: (payload: { name: string; profile: { outputs: unknown[] } }) => Promise<boolean>;
      getCurrent: () => Promise<{ outputs: unknown[] }>;
      delete: (name: string) => Promise<boolean>;
    };
  }
}
