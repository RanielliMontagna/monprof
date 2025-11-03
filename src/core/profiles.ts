/**
 * Profile management (read/write/validate JSON)
 */

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { DisplayOutput } from "./kscreen.js";

export interface Profile {
  outputs: DisplayOutput[];
}

export interface ProfilesData {
  profiles: Record<string, Profile>;
}

/**
 * Get the path to profiles.json
 */
function getProfilesPath(): string {
  return join(process.cwd(), "data", "profiles.json");
}

/**
 * Read all profiles from profiles.json
 */
export async function readProfiles(): Promise<ProfilesData> {
  try {
    const path = getProfilesPath();
    const content = await readFile(path, "utf-8");
    const data = JSON.parse(content) as ProfilesData;
    return validateProfiles(data);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      // File doesn't exist, return empty profiles
      return { profiles: {} };
    }
    throw new Error(`Failed to read profiles: ${error}`);
  }
}

/**
 * Write profiles to profiles.json
 */
export async function writeProfiles(data: ProfilesData): Promise<void> {
  try {
    const validated = validateProfiles(data);
    const path = getProfilesPath();
    await writeFile(path, JSON.stringify(validated, null, 2), "utf-8");
  } catch (error) {
    throw new Error(`Failed to write profiles: ${error}`);
  }
}

/**
 * Get a specific profile by name
 */
export async function getProfile(name: string): Promise<Profile | null> {
  const data = await readProfiles();
  return data.profiles[name] || null;
}

/**
 * Save a profile
 */
export async function saveProfile(name: string, profile: Profile): Promise<void> {
  const data = await readProfiles();
  data.profiles[name] = profile;
  await writeProfiles(data);
}

/**
 * Delete a profile
 */
export async function deleteProfile(name: string): Promise<boolean> {
  const data = await readProfiles();
  if (!(name in data.profiles)) {
    return false;
  }
  delete data.profiles[name];
  await writeProfiles(data);
  return true;
}

/**
 * List all profile names
 */
export async function listProfileNames(): Promise<string[]> {
  const data = await readProfiles();
  return Object.keys(data.profiles);
}

/**
 * Validate profiles data structure
 */
function validateProfiles(data: unknown): ProfilesData {
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid profiles data: must be an object");
  }

  const obj = data as Record<string, unknown>;

  if (!("profiles" in obj)) {
    throw new Error("Invalid profiles data: missing 'profiles' key");
  }

  if (typeof obj.profiles !== "object" || obj.profiles === null) {
    throw new Error("Invalid profiles data: 'profiles' must be an object");
  }

  const profiles = obj.profiles as Record<string, unknown>;

  for (const [name, profile] of Object.entries(profiles)) {
    if (typeof profile !== "object" || profile === null) {
      throw new Error(`Invalid profile '${name}': must be an object`);
    }

    const prof = profile as Record<string, unknown>;
    if (!Array.isArray(prof.outputs)) {
      throw new Error(`Invalid profile '${name}': missing or invalid 'outputs' array`);
    }

    for (const output of prof.outputs) {
      if (typeof output !== "object" || output === null) {
        throw new Error(`Invalid output in profile '${name}': must be an object`);
      }

      const out = output as Record<string, unknown>;
      if (typeof out.name !== "string") {
        throw new Error(`Invalid output in profile '${name}': missing or invalid 'name'`);
      }
      if (typeof out.enabled !== "boolean") {
        throw new Error(`Invalid output in profile '${name}': missing or invalid 'enabled'`);
      }
    }
  }

  return data as ProfilesData;
}
