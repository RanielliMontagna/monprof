/**
 * Tests for kscreen.ts
 */

import { describe, expect, it } from "vitest";
import {
  type DisplayOutput,
  denormalizeConfig as denormalize,
  normalizeConfig as normalize,
} from "../kscreen.js";

describe("KScreen Config Normalization", () => {
  describe("normalizeConfig", () => {
    it("should normalize empty config", () => {
      const result = normalize({ outputs: [] });
      expect(result.outputs).toEqual([]);
    });

    it("should normalize config with single output", () => {
      const kscreenConfig = {
        outputs: [
          {
            name: "DP-1",
            enabled: true,
            primary: true,
            rotation: 0,
            position: { x: 0, y: 0 },
            currentMode: {
              size: { width: 2560, height: 1440 },
              refresh: 60,
            },
          },
        ],
      };

      const result = normalize(kscreenConfig);
      expect(result.outputs).toHaveLength(1);
      if (result.outputs[0]) {
        expect(result.outputs[0]).toMatchObject({
          name: "DP-1",
          enabled: true,
          primary: true,
          rotation: "normal",
          mode: "2560x1440@60",
          position: [0, 0],
        });
      }
    });

    it("should normalize rotation values", () => {
      const rotations = [
        { input: 0, expected: "normal" },
        { input: 1, expected: "right" },
        { input: 2, expected: "inverted" },
        { input: 3, expected: "left" },
      ];

      for (const { input, expected } of rotations) {
        const kscreenConfig = {
          outputs: [
            {
              name: "DP-1",
              enabled: true,
              rotation: input,
            },
          ],
        };

        const result = normalize(kscreenConfig);
        if (result.outputs[0]) {
          expect(result.outputs[0].rotation).toBe(expected);
        }
      }
    });

    it("should handle missing optional fields", () => {
      const kscreenConfig = {
        outputs: [
          {
            name: "HDMI-1",
            enabled: false,
          },
        ],
      };

      const result = normalize(kscreenConfig);
      if (result.outputs[0]) {
        expect(result.outputs[0]).toMatchObject({
          name: "HDMI-1",
          enabled: false,
        });
        expect(result.outputs[0].primary).toBeUndefined();
        expect(result.outputs[0].rotation).toBeUndefined();
      }
    });

    it("should handle missing outputs array", () => {
      const result = normalize({});
      expect(result.outputs).toEqual([]);
    });
  });

  describe("denormalizeConfig", () => {
    it("should denormalize config with single output", () => {
      const config: { outputs: DisplayOutput[] } = {
        outputs: [
          {
            name: "DP-1",
            enabled: true,
            primary: true,
            rotation: "normal" as const,
            mode: "2560x1440@60",
            position: [0, 0] as [number, number],
          },
        ],
      };

      const result = denormalize(config);
      expect(result.outputs).toBeDefined();
      if (result.outputs && result.outputs.length > 0 && result.outputs[0]) {
        expect(result.outputs[0]).toMatchObject({
          name: "DP-1",
          enabled: true,
          primary: true,
          rotation: 0,
          position: { x: 0, y: 0 },
        });
        expect(result.outputs[0].currentMode?.size).toEqual({ width: 2560, height: 1440 });
        expect(result.outputs[0].currentMode?.refresh).toBe(60);
      }
    });

    it("should denormalize rotation values", () => {
      const rotations = [
        { input: "normal", expected: 0 },
        { input: "right", expected: 1 },
        { input: "inverted", expected: 2 },
        { input: "left", expected: 3 },
      ];

      for (const { input, expected } of rotations) {
        const config: { outputs: DisplayOutput[] } = {
          outputs: [
            {
              name: "DP-1",
              enabled: true,
              rotation: input as "normal" | "left" | "right" | "inverted",
            },
          ],
        };

        const result = denormalize(config);
        if (result.outputs && result.outputs.length > 0 && result.outputs[0]) {
          expect(result.outputs[0].rotation).toBe(expected);
        }
      }
    });

    it("should parse mode string correctly", () => {
      const config = {
        outputs: [
          {
            name: "DP-1",
            enabled: true,
            mode: "1920x1080@120",
          },
        ],
      };

      const result = denormalize(config as { outputs: DisplayOutput[] });
      if (result.outputs && result.outputs.length > 0 && result.outputs[0]) {
        expect(result.outputs[0].currentMode?.size).toEqual({ width: 1920, height: 1080 });
        expect(result.outputs[0].currentMode?.refresh).toBe(120);
      }
    });

    it("should handle missing optional fields", () => {
      const config = {
        outputs: [
          {
            name: "HDMI-1",
            enabled: false,
          },
        ],
      };

      const result = denormalize(config as { outputs: DisplayOutput[] });
      if (result.outputs && result.outputs.length > 0 && result.outputs[0]) {
        expect(result.outputs[0]).toMatchObject({
          name: "HDMI-1",
          enabled: false,
        });
      }
    });
  });

  describe("round-trip conversion", () => {
    it("should preserve data through normalize -> denormalize cycle", () => {
      const original: { outputs: DisplayOutput[] } = {
        outputs: [
          {
            name: "DP-1",
            enabled: true,
            primary: true,
            rotation: "right" as const,
            mode: "2560x1440@60",
            position: [0, 0] as [number, number],
          },
          {
            name: "HDMI-1",
            enabled: false,
          },
        ],
      };

      const denormalized = denormalize(original);
      const normalized = normalize(denormalized);

      expect(normalized.outputs).toHaveLength(2);
      expect(normalized.outputs[0]).toMatchObject({
        name: "DP-1",
        enabled: true,
        primary: true,
        rotation: "right",
        mode: "2560x1440@60",
        position: [0, 0],
      });
      expect(normalized.outputs[1]).toMatchObject({
        name: "HDMI-1",
        enabled: false,
      });
    });
  });
});
