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
    expect(html).toContain('id="advanced-json"');
    expect(html).toContain("providerExtra");
    expect(html).toContain("modelExtra");
    expect(html).toContain("[REDACTED]");
    expect(html).not.toContain("super-secret");
  });

  it("includes keyboard, bilingual, zoom, validation, preview and explicit apply actions", () => {
    const html = buildModelConfigPanelHtml(config);

    expect(html).toContain('id="gd-lang"');
    expect(html).toContain('id="gd-zoom-reset"');
    expect(html).toContain('id="b-import"');
    expect(html).toContain('id="b-validate"');
    expect(html).toContain('id="b-preview"');
    expect(html).toContain('id="b-apply"');
    expect(html).toContain('id="b-cancel"');
    expect(html).toContain('e.key==="Escape"');
    expect(html).toContain('e.key==="Enter"');
    expect(html).toContain('e.key==="ArrowDown"');
    expect(html).toContain('e.key==="ArrowUp"');
    expect(html).toContain('send("apply")');
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
