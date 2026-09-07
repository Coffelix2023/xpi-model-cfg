import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it, vi } from "vitest";

import { loadGlimpse } from "./glimpse-runtime.ts";

const GLIMPSE = {
  open: vi.fn(),
};

describe("loadGlimpse", () => {
  it("prefers the package export", async () => {
    const importModule = vi.fn(async (specifier: string) => {
      if (specifier === "glimpseui") return GLIMPSE;
      throw new Error("unexpected fallback");
    });

    await expect(loadGlimpse(importModule)).resolves.toBe(GLIMPSE);
    expect(importModule).toHaveBeenCalledOnce();
    expect(importModule).toHaveBeenCalledWith("glimpseui");
  });

  it("falls back to the user-level Pi package without a developer path", async () => {
    const fallback = pathToFileURL(
      join(homedir(), ".pi/agent/npm/node_modules/glimpseui/src/glimpse.mjs"),
    ).href;
    const importModule = vi.fn(async (specifier: string) => {
      if (specifier === fallback) return GLIMPSE;
      throw new Error("not found");
    });

    await expect(loadGlimpse(importModule)).resolves.toBe(GLIMPSE);
    expect(importModule).toHaveBeenNthCalledWith(1, "glimpseui");
    expect(importModule).toHaveBeenNthCalledWith(2, fallback);
  });

  it("returns null when Glimpse is unavailable", async () => {
    const importModule = vi.fn(async () => {
      throw new Error("not found");
    });

    await expect(loadGlimpse(importModule)).resolves.toBeNull();
  });
});
