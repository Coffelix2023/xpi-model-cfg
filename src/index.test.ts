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

  it("opens the global models paths", async () => {
    const open = vi.fn(() => ({
      close: vi.fn(),
      on: vi.fn(),
      send: vi.fn(),
    }));
    xpiModelCfg(
      {
        registerCommand,
      } as never,
      {
        loadGlimpse: async () => ({
          open,
        }),
      },
    );
    const command = registerCommand.mock.calls.at(-1)?.[1];
    const notify = vi.fn();

    await command.handler("", {
      ui: {
        confirm: vi.fn(),
        notify,
      },
    });

    expect(open).toHaveBeenCalledOnce();
    expect(join(homedir(), ".pi/agent/models.json")).toContain("models.json");
  });
});
