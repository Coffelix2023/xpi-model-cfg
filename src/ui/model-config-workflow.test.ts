import { EventEmitter } from "node:events";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

const EXTERNAL_CHANGE_ERROR = /external change/i;
const DISABLED_STORE_ERROR = /disabled store/i;

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

async function fixture(
  source = '{"providers":{"local":{"models":[{"id":"old"}]}}}\n',
  disabled?: string,
) {
  const dir = await mkdtemp(join(tmpdir(), "xpi-model-panel-"));
  const jsonPath = join(dir, "models.json");
  const yamlPath = join(dir, "models.yml");
  await writeFile(jsonPath, source, {
    mode: 0o600,
  });
  if (disabled !== undefined) {
    await writeFile(`${jsonPath}.disabled`, disabled, {
      mode: 0o600,
    });
  }
  const window = new FakeWindow();
  const glimpse: GlimpseModule = {
    open: vi.fn(() => window),
  };
  const notify = vi.fn();

  await runModelConfigPanel({
    disabledPath: `${jsonPath}.disabled`,
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
      minWidth: 820,
      title: "xpi-model-cfg",
      width: 980,
    });
  });

  it("shows disabled entries from the sidecar with their secrets masked", async () => {
    const state = await fixture(
      '{"providers":{"on":{"apiKey":"on-secret","models":[{"id":"on-1"}]}}}\n',
      JSON.stringify({
        models: {
          on: [
            {
              id: "on-2",
            },
          ],
        },
        providers: {
          off: {
            apiKey: "off-secret",
            models: [
              {
                id: "off-1",
              },
            ],
          },
        },
      }),
    );
    const html = vi.mocked(state.glimpse.open).mock.calls[0]?.[0];

    expect(html).toContain('"disabled":true');
    expect(html).toContain('"off"');
    expect(html).not.toContain("off-secret");
    expect(html).not.toContain("on-secret");
  });

  it("leaves the panel unchanged when the sidecar is absent", async () => {
    const state = await fixture();
    const html = vi.mocked(state.glimpse.open).mock.calls[0]?.[0];

    expect(html).not.toContain('"disabled":true');
  });

  it("fails closed when the disabled store is unreadable", async () => {
    const dir = await mkdtemp(join(tmpdir(), "xpi-model-panel-"));
    const jsonPath = join(dir, "models.json");
    const disabledPath = `${jsonPath}.disabled`;
    await writeFile(jsonPath, '{"providers":{"local":{"models":[{"id":"old"}]}}}\n', {
      mode: 0o600,
    });
    await writeFile(disabledPath, "{not json", {
      mode: 0o600,
    });
    const glimpse: GlimpseModule = {
      open: vi.fn(() => new FakeWindow()),
    };

    const opened = runModelConfigPanel({
      disabledPath,
      glimpse,
      jsonPath,
      notify: vi.fn(),
      yamlPath: join(dir, "models.yml"),
    });

    await expect(opened).rejects.toThrow(DISABLED_STORE_ERROR);
    await expect(opened).rejects.toThrow(disabledPath);
    expect(glimpse.open).not.toHaveBeenCalled();
  });

  it("moves a disabled model into the sidecar and restores it on re-enable", async () => {
    const state = await fixture(
      '{"providers":{"local":{"apiKey":"secret","models":[{"id":"keep"},{"id":"off"}]}}}\n',
    );
    const disabledPath = `${state.jsonPath}.disabled`;

    state.window.emit("message", {
      action: "apply",
      config: {
        providers: {
          local: {
            apiKey: "secret",
            models: [
              {
                id: "keep",
              },
              {
                disabled: true,
                id: "off",
              },
            ],
          },
        },
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(
      parseModelsConfig(await readFile(state.jsonPath, "utf8"), "json").providers.local
        ?.models,
    ).toEqual([
      {
        id: "keep",
      },
    ]);
    expect(JSON.parse(await readFile(disabledPath, "utf8"))).toEqual({
      providers: {},
      models: {
        local: [
          {
            id: "off",
          },
        ],
      },
    });

    state.window.emit("message", {
      action: "apply",
      config: {
        providers: {
          local: {
            apiKey: "secret",
            models: [
              {
                id: "keep",
              },
              {
                id: "off",
              },
            ],
          },
        },
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(
      parseModelsConfig(await readFile(state.jsonPath, "utf8"), "json").providers.local
        ?.models,
    ).toEqual([
      {
        id: "keep",
      },
      {
        id: "off",
      },
    ]);
    await expect(readFile(disabledPath, "utf8")).rejects.toThrow();
    expect(state.window.sent.join("\n")).toContain("1 项已移入停用存储");
  });

  it("keeps a disabled provider's secrets in the sidecar", async () => {
    const state = await fixture(
      '{"providers":{"drop":{"apiKey":"secret","baseUrl":"https://drop.example.com","models":[{"id":"m"}]}}}\n',
    );

    state.window.emit("message", {
      action: "apply",
      config: {
        providers: {
          drop: {
            apiKey: "secret",
            baseUrl: "https://drop.example.com",
            disabled: true,
            models: [
              {
                id: "m",
              },
            ],
          },
        },
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(
      parseModelsConfig(await readFile(state.jsonPath, "utf8"), "json").providers.drop,
    ).toBeUndefined();
    expect(JSON.parse(await readFile(`${state.jsonPath}.disabled`, "utf8"))).toEqual({
      models: {},
      providers: {
        drop: {
          apiKey: "secret",
          baseUrl: "https://drop.example.com",
          models: [
            {
              id: "m",
            },
          ],
        },
      },
    });
  });

  it("blocks apply after an external disabled store change", async () => {
    const state = await fixture(
      '{"providers":{"local":{"models":[{"id":"old"}]}}}\n',
      '{"providers":{},"models":{}}',
    );
    const disabledPath = `${state.jsonPath}.disabled`;
    const external = '{"providers":{},"models":{"local":[{"id":"gone"}]}}';
    await writeFile(disabledPath, external);

    state.window.emit("message", {
      action: "apply",
      config: nextConfig,
    });
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(state.window.sent.join("\n")).toMatch(EXTERNAL_CHANGE_ERROR);
    expect(await readFile(disabledPath, "utf8")).toBe(external);
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
    expect(state.window.sent.join("\n")).not.toContain("备份");
    expect(state.window.sent.join("\n")).toContain("YAML");
  });
  it("persists provider order in a sidecar and reloads it", async () => {
    const state = await fixture(
      '{"providers":{"10":{"models":[]},"2":{"models":[]}}}\n',
    );
    const config = parseModelsConfig(
      '{"providers":{"10":{"models":[]},"2":{"models":[]}}}',
      "json",
    );
    state.window.emit("message", {
      action: "apply",
      config,
      providerOrder: [
        "10",
        "2",
      ],
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(JSON.parse(await readFile(`${state.jsonPath}.order`, "utf8"))).toEqual([
      "10",
      "2",
    ]);
    await runModelConfigPanel({
      disabledPath: `${state.jsonPath}.disabled`,
      glimpse: state.glimpse,
      jsonPath: state.jsonPath,
      notify: state.notify,
      yamlPath: state.yamlPath,
    });
    const reopenedHtml = vi.mocked(state.glimpse.open).mock.calls[1]?.[0];
    expect(reopenedHtml).toContain('providerOrder=["10","2"]');
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
  it("keeps the panel state after apply instead of sending a reset config", async () => {
    const state = await fixture(
      '{"providers":{"first":{"models":[{"id":"first-model"}]},"second":{"models":[{"id":"second-model"}]}}}\n',
    );
    state.window.emit("message", {
      action: "apply",
      config: parseModelsConfig(
        '{"providers":{"first":{"models":[{"id":"first-model"}]},"second":{"models":[{"id":"second-model"}]}}}',
        "json",
      ),
    });
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(state.window.sent.join("\n")).not.toContain('"type":"config"');
  });
});
