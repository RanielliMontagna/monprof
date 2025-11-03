#!/usr/bin/env node
/**
 * Post-install script to ensure Electron binary is downloaded
 * Runs automatically after npm/pnpm install if path.txt is missing
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const electronPath = join(__dirname, "../node_modules/electron/path.txt");
const installScript = join(__dirname, "../node_modules/electron/install.js");

function ensureElectronInstalled() {
  // Check if path.txt exists (indicates Electron binary is downloaded)
  if (existsSync(electronPath)) {
    console.log("[postinstall] Electron binary already installed");
    return;
  }

  // Check if install script exists
  if (!existsSync(installScript)) {
    console.warn("[postinstall] Electron install script not found, skipping");
    return;
  }

  console.log("[postinstall] Electron binary not found, downloading...");
  console.log("[postinstall] This may take a few minutes...");

  try {
    execSync(`node "${installScript}"`, {
      stdio: "inherit",
      timeout: 300000, // 5 minutes timeout
    });
    console.log("[postinstall] ✅ Electron binary installed successfully");
  } catch (error) {
    console.error("[postinstall] ❌ Failed to install Electron binary");
    console.error("[postinstall] You can run manually: node node_modules/electron/install.js");
    process.exit(1);
  }
}

ensureElectronInstalled();
