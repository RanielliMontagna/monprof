#!/usr/bin/env node
/**
 * CLI entry point for monprof
 */

import { getConfig, setConfig } from "./core/kscreen.js";
import { getProfile, listProfileNames, saveProfile } from "./core/profiles.js";

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.error("Usage: monprof <command> [options]");
    console.error("\nCommands:");
    console.error("  list                        List all profiles");
    console.error("  save <profile-name>         Save current layout as profile");
    console.error("  apply <profile-name>        Apply a profile");
    console.error("  show <profile-name>         Show profile details");
    console.error("  edit <profile-name> [opts]  Edit a profile");
    process.exit(1);
  }

  try {
    switch (command) {
      case "list": {
        const names = await listProfileNames();
        if (names.length === 0) {
          console.log("No profiles found.");
        } else {
          console.log("Profiles:");
          for (const name of names) {
            console.log(`  - ${name}`);
          }
        }
        break;
      }

      case "save": {
        const profileName = args[1];
        if (!profileName) {
          console.error("Error: profile name required");
          process.exit(1);
        }
        const currentConfig = await getConfig();
        await saveProfile(profileName, { outputs: currentConfig.outputs });
        console.log(`Profile '${profileName}' saved successfully.`);
        break;
      }

      case "apply": {
        const profileName = args[1];
        if (!profileName) {
          console.error("Error: profile name required");
          process.exit(1);
        }
        const profile = await getProfile(profileName);
        if (!profile) {
          console.error(`Error: profile '${profileName}' not found`);
          process.exit(1);
        }
        await setConfig({ outputs: profile.outputs });
        console.log(`Profile '${profileName}' applied successfully.`);
        break;
      }

      case "show": {
        const profileName = args[1];
        if (!profileName) {
          console.error("Error: profile name required");
          process.exit(1);
        }
        const profile = await getProfile(profileName);
        if (!profile) {
          console.error(`Error: profile '${profileName}' not found`);
          process.exit(1);
        }
        console.log(JSON.stringify(profile, null, 2));
        break;
      }

      case "edit": {
        // TODO: Implement edit command
        console.error("Edit command not yet implemented");
        process.exit(1);
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main();
