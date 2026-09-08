import { describe, expect, it } from "vitest";

import type { ModelsConfig } from "../lib/models-config.ts";
import {
  buildModelConfigPanelHtml,
  restoreRedactedValues,
} from "./model-config-panel.ts";

const config: ModelsConfig = {
  providers: {
    local: {
      api: "openai-completions",
      apiKey: "super-secret",
      providerExtra: "kept",
      models: [
        {
          contextWindow: 128_000,
          id: "model-a",
          maxTokens: 8_192,
          name: "Model A",
          modelExtra: {
            keep: true,
          },
        },
      ],
    },
  },
};

describe("model config panel", () => {
  it("renders structured provider/model controls without embedding secrets", () => {
    const html = buildModelConfigPanelHtml(config);

    expect(html).toContain('id="provider-list"');
    expect(html).toContain('id="model-list"');
    expect(html).toContain('id="provider-base-url"');
    expect(html).toContain('id="model-context-window"');
    expect(html).toContain('id="model-max-tokens"');
    expect(html).not.toContain('id="tab-json"');
    expect(html).not.toContain('id="advanced-json"');
    expect(html).toContain("providerExtra");
    expect(html).toContain("modelExtra");
    expect(html).toContain('"maxTokens":8192');
    expect(html).toContain('id="gd-lang"');
    expect(html).toContain('id="gd-zoom-reset"');
    expect(html).not.toContain('id="b-import"');
    expect(html).toContain('id="b-validate"');
    expect(html).toContain('id="b-preview"');
    expect(html).toContain('id="b-apply"');
    expect(html).toContain('id="b-cancel"');
    expect(html).toContain('id="b-confirm"');
    expect(html).toContain('id="confirm-dialog"');
    expect(html).toContain("function status(message,ok)");
    expect(html).toContain("requestAction(action)");
    expect(html).toContain('send("prepare-"+action)');
    expect(html).not.toContain("cancel Esc");
    expect(html).not.toContain("Import YAML");
    expect(html).not.toContain('send("cancel")');
    expect(html).not.toContain('send("apply")');
    expect(html).not.toContain('send("preview")');
    expect(html).toContain('e.key==="ArrowDown"');
    expect(html).toContain('e.key==="ArrowUp"');
    expect(html).not.toContain("backdrop-filter");
    expect(html).not.toContain("rgba(");
    expect(html).not.toContain("background:transparent");
  });

  it("restores unchanged redacted values while accepting edits", () => {
    const edited = structuredClone(config);
    if (!edited.providers.local) throw new Error("fixture provider missing");
    edited.providers.local.apiKey = "[REDACTED]";
    edited.providers.local.api = "openai-responses";

    expect(restoreRedactedValues(config, edited)).toMatchObject({
      providers: {
        local: {
          api: "openai-responses",
          apiKey: "super-secret",
          providerExtra: "kept",
        },
      },
    });
  });
});
