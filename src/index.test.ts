import { homedir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import xpiModelCfg from "./index.ts";

const GLIMPSE_UNAVAILABLE_ERROR = /Glimpse.*unavailable/;
const registerCommand = vi.fn();

describe("xpi-model-cfg extension", () => {
  it("registers the command", () => {
    xpiModelCfg({
      registerCommand,
    } as never);

    expect(registerCommand).toHaveBeenCalledWith(
      "xpi-model-cfg",
      expect.objectContaining({
        handler: expect.any(Function),
      }),
    );
  });

  it("reports unavailable Glimpse without throwing", async () => {
    xpiModelCfg(
      {
        registerCommand,
      } as never,
      {
        runPanel: vi.fn(),
        loadGlimpse: async () => null,
      },
    );
    const command = registerCommand.mock.calls.at(-1)?.[1];
    const notify = vi.fn();

    await expect(
      command.handler("", {
        ui: {
          notify,
        },
      }),
    ).resolves.toBeUndefined();
    expect(notify).toHaveBeenCalledWith(
      expect.stringMatching(GLIMPSE_UNAVAILABLE_ERROR),
      "error",
    );
  });

  it("opens the global models paths with the disabled store beside them", async () => {
    const glimpse = {
      open: vi.fn(),
    };
    const runPanel = vi.fn(async () => ({
      close: vi.fn(),
      on: vi.fn(),
      send: vi.fn(),
    }));
    xpiModelCfg(
      {
        registerCommand,
      } as never,
      {
        runPanel: runPanel as never,
        loadGlimpse: async () => glimpse,
      },
    );
    const command = registerCommand.mock.calls.at(-1)?.[1];

    await command.handler("", {
      ui: {
        notify: vi.fn(),
      },
    });

    expect(runPanel).toHaveBeenCalledWith({
      disabledPath: join(homedir(), ".pi/agent/models.json.disabled"),
      glimpse,
      jsonPath: join(homedir(), ".pi/agent/models.json"),
      notify: expect.any(Function),
      yamlPath: join(homedir(), ".pi/agent/models.yml"),
    });
  });
});
