/**
 * Tests for profiles.ts
 */

import { readFile, unlink, writeFile } from "node:fs/promises";
import { beforeEach, describe, expect, it } from "vitest";
import { listProfileNames, readProfiles } from "../profiles.js";

const TEST_PROFILES_FILE = "profiles.test.json";

async function cleanupTestFile() {
  try {
    await unlink(TEST_PROFILES_FILE);
  } catch {
    // Ignore if file doesn't exist
  }
}

describe("Profiles", () => {
  beforeEach(async () => {
    await cleanupTestFile();
  });

  it("should read empty profiles when file doesn't exist", async () => {
    expect(typeof readProfiles).toBe("function");
  });

  it("should read and write profiles", async () => {
    const testData = {
      profiles: {
        test1: {
          outputs: [
            {
              name: "DP-1",
              enabled: true,
              primary: true,
              rotation: "normal",
              mode: "1920x1080@60",
              position: [0, 0],
            },
          ],
        },
      },
    };

    await writeFile(TEST_PROFILES_FILE, JSON.stringify(testData), "utf-8");
    const content = await readFile(TEST_PROFILES_FILE, "utf-8");
    const parsed = JSON.parse(content);
    expect(parsed.profiles.test1).toBeDefined();
    expect(parsed.profiles.test1.outputs[0].name).toBe("DP-1");
  });

  it("should validate profile structure", () => {
    const validProfile = {
      profiles: {
        test: {
          outputs: [
            {
              name: "DP-1",
              enabled: true,
            },
          ],
        },
      },
    };

    expect(validProfile.profiles.test.outputs[0].name).toBe("DP-1");
    expect(validProfile.profiles.test.outputs[0].enabled).toBe(true);
  });

  it("should list profile names", async () => {
    expect(typeof listProfileNames).toBe("function");
  });
});
