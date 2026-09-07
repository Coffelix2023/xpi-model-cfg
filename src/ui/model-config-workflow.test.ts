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

async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), "xpi-model-panel-"));
  const jsonPath = join(dir, "models.json");
  const yamlPath = join(dir, "models.yml");
  const source = '{"providers":{"local":{"models":[{"id":"old"}]}}}\n';
  await writeFile(jsonPath, source, {
    mode: 0o600,
  });
  const window = new FakeWindow();
  const glimpse: GlimpseModule = {
    open: vi.fn(() => window),
  };
  const confirm = vi.fn(async () => true);
  const notify = vi.fn();

  await runModelConfigPanel({
    confirm,
    glimpse,
    jsonPath,
    notify,
    yamlPath,
  });
  return {
    confirm,
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
    expect(state.confirm).not.toHaveBeenCalled();
  });

  it("writes only after explicit confirmation", async () => {
    const state = await fixture();
    state.confirm.mockResolvedValueOnce(false);
    state.window.emit("message", {
      action: "apply",
      config: nextConfig,
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(await readFile(state.jsonPath, "utf8")).toBe(state.source);

    state.window.emit("message", {
      action: "apply",
      config: nextConfig,
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(parseModelsConfig(await readFile(state.jsonPath, "utf8"), "json")).toEqual(
      nextConfig,
    );
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

    expect(state.confirm).not.toHaveBeenCalled();
    expect(state.window.sent.join("\n")).toMatch(EXTERNAL_CHANGE_ERROR);
  });

  it("cancels without writing", async () => {
    const state = await fixture();
    state.window.emit("message", {
      action: "cancel",
    });
    await new Promise((resolve) => setImmediate(resolve));

    expect(state.window.closed).toBe(true);
    expect(await readFile(state.jsonPath, "utf8")).toBe(state.source);
  });
});
