import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildWrapperScript, loadGlimpse, wrapGlimpse } from "./glimpse-runtime.ts";

const GLIMPSE = {
  open: vi.fn(),
};

describe("loadGlimpse", () => {
  beforeEach(() => {
    vi.stubEnv("GLIMPSE_BINARY_PATH", "/tmp/test-glimpse");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });
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

describe("buildWrapperScript", () => {
  it("execs the real binary with stderr redirected to a log file", () => {
    expect(buildWrapperScript("/usr/local/bin/glimpse", "/tmp/g.log")).toBe(
      '#!/bin/sh\nexec "/usr/local/bin/glimpse" "$@" 2>>"/tmp/g.log"\n',
    );
  });
});

describe("wrapGlimpse", () => {
  it("restores GLIMPSE_BINARY_PATH after starting the window", () => {
    const previous = process.env.GLIMPSE_BINARY_PATH;
    delete process.env.GLIMPSE_BINARY_PATH;
    const window = {
      close: vi.fn(),
      on: vi.fn(),
      send: vi.fn(),
    };
    const module = {
      open: vi.fn(() => {
        expect(process.env.GLIMPSE_BINARY_PATH).toBe("/tmp/glimpse-quiet.sh");
        return window;
      }),
    };

    try {
      expect(wrapGlimpse(module, "/tmp/glimpse-quiet.sh").open("<p />")).toBe(window);
      expect(process.env.GLIMPSE_BINARY_PATH).toBeUndefined();
    } finally {
      if (previous === undefined) delete process.env.GLIMPSE_BINARY_PATH;
      else process.env.GLIMPSE_BINARY_PATH = previous;
    }
  });
});
