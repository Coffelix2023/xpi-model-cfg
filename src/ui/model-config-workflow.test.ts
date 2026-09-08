import { EventEmitter } from "node:events";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

const EXTERNAL_CHANGE_ERROR = /external change/i;

import { parseModelsConfig } from "../lib/models-config.ts";
import type { GlimpseModule, GlimpseWindow } from "./glimpse-runtime.ts";
import { runModelConfigPanel } from "./model-config-workflow.ts";

class FakeWindow extends EventEmitter implements GlimpseWindow {
  closed = false;
  sent: string[] = [];

  close(): void {
    this.closed = true;
  }

  send(source: string): void {
    this.sent.push(source);
  }
}

async function fixture(source = '{"providers":{"local":{"models":[{"id":"old"}]}}}\n') {
  const dir = await mkdtemp(join(tmpdir(), "xpi-model-panel-"));
  const jsonPath = join(dir, "models.json");
  const yamlPath = join(dir, "models.yml");
  await writeFile(jsonPath, source, {
    mode: 0o600,
  });
  const window = new FakeWindow();
  const glimpse: GlimpseModule = {
    open: vi.fn(() => window),
  };
  const notify = vi.fn();

  await runModelConfigPanel({
    glimpse,
    jsonPath,
    notify,
    yamlPath,
  });
  return {
    glimpse,
    jsonPath,
    notify,
    source,
    window,
    yamlPath,
  };
}

const nextConfig = parseModelsConfig(
  '{"providers":{"local":{"models":[{"id":"new"}]}}}',
  "json",
);

describe("model config panel workflow", () => {
  it("opens an opaque window with the native title bar", async () => {
    const state = await fixture();
    expect(state.glimpse.open).toHaveBeenCalledWith(expect.any(String), {
      frameless: false,
      height: 680,
      title: "xpi-model-cfg",
      width: 980,
    });
  });

  it("creates a YAML draft and validates without writing JSON", async () => {
    const state = await fixture();
    expect(await readFile(state.yamlPath, "utf8")).toContain("providers:");

    state.window.emit("message", {
      action: "validate",
      config: nextConfig,
    });
    await new Promise((resolve) => setImmediate(resolve));

    expect(await readFile(state.jsonPath, "utf8")).toBe(state.source);
    expect(state.window.sent.join("\n")).toContain("配置有效");
  });

  it("previews a redacted diff without writing JSON", async () => {
    const state = await fixture();
    state.window.emit("message", {
      action: "preview",
      config: nextConfig,
    });
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(await readFile(state.jsonPath, "utf8")).toBe(state.source);
    expect(state.window.sent.join("\n")).toContain('\\"id\\": \\"old\\"');
  });

  it("prepares an in-panel confirmation with the redacted diff", async () => {
    const state = await fixture();
    state.window.emit("message", {
      action: "prepare-apply",
      config: nextConfig,
    });
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(await readFile(state.jsonPath, "utf8")).toBe(state.source);
    expect(state.window.sent.join("\n")).toContain('"type":"confirmation"');
    expect(state.window.sent.join("\n")).toContain('\\"id\\": \\"old\\"');
  });

  it("applies an action already confirmed by the panel", async () => {
    const state = await fixture();
    state.window.emit("message", {
      action: "apply",
      config: nextConfig,
    });
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(parseModelsConfig(await readFile(state.jsonPath, "utf8"), "json")).toEqual(
      nextConfig,
    );
  });

  it("keeps an existing API key when another provider field changes", async () => {
    const state = await fixture(
      '{"providers":{"local":{"apiKey":"secret","baseUrl":"old","models":[{"id":"old"}]}}}\n',
    );
    state.window.emit("message", {
      action: "apply",
      config: {
        providers: {
          local: {
            baseUrl: "new",
            models: [
              {
                id: "old",
              },
            ],
          },
        },
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 20));

    const saved = parseModelsConfig(await readFile(state.jsonPath, "utf8"), "json");
    expect(saved.providers.local).toMatchObject({
      apiKey: "secret",
      baseUrl: "new",
    });
  });

  it("replaces an existing API key with a new value", async () => {
    const state = await fixture(
      '{"providers":{"local":{"apiKey":"old","models":[{"id":"old"}]}}}\n',
    );
    state.window.emit("message", {
      action: "apply",
      config: {
        providers: {
          local: {
            apiKey: "new",
            models: [
              {
                id: "old",
              },
            ],
          },
        },
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 20));

    const saved = parseModelsConfig(await readFile(state.jsonPath, "utf8"), "json");
    expect(saved.providers.local?.apiKey).toBe("new");
  });
  it("keeps apply open and closes after confirm", async () => {
    const state = await fixture();
    state.window.emit("message", {
      action: "apply",
      config: nextConfig,
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(state.window.closed).toBe(false);
    state.window.emit("message", {
      action: "confirm",
      config: nextConfig,
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(state.window.closed).toBe(true);
  });

  it("blocks apply after an external change", async () => {
    const state = await fixture();
    await writeFile(
      state.jsonPath,
      '{"providers":{"external":{"models":[{"id":"changed"}]}}}\n',
    );

    state.window.emit("message", {
      action: "apply",
      config: nextConfig,
    });
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(state.window.sent.join("\n")).toMatch(EXTERNAL_CHANGE_ERROR);
  });

  it("closes a cancellation already confirmed by the panel without writing", async () => {
    const state = await fixture();
    state.window.emit("message", {
      action: "cancel",
    });
    await new Promise((resolve) => setImmediate(resolve));

    expect(state.window.closed).toBe(true);
    expect(await readFile(state.jsonPath, "utf8")).toBe(state.source);
  });
});
