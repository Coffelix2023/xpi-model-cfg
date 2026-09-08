import { describe, expect, it } from "vitest";
import { parseModelsConfig } from "../lib/models-config.ts";
import {
  buildModelConfigPanelHtml,
  redactPanelConfig,
  restoreRedactedValues,
} from "./model-config-panel.ts";

describe("model config panel", () => {
  it("shows environment references but masks literal and command API keys", () => {
    const envReference = "prefix-$API_KEY-" + "${" + "OTHER}";
    const config = parseModelsConfig(
      JSON.stringify({
        providers: {
          command: {
            apiKey: "!security-cli token",
            models: [],
          },
          env: {
            apiKey: envReference,
            models: [],
          },
          literal: {
            apiKey: "plain-secret",
            models: [],
          },
        },
      }),
      "json",
    );

    expect(redactPanelConfig(config).providers).toMatchObject({
      command: {
        apiKey: "[REDACTED]",
      },
      env: {
        apiKey: envReference,
      },
      literal: {
        apiKey: "[REDACTED]",
      },
    });
    const html = buildModelConfigPanelHtml(config);
    expect(html).toContain('id="provider-api-key" autocomplete="off" type="password"');
    expect(html).not.toContain("plain-secret");
    expect(html).toContain(envReference);
  });

  it("restores an existing API key when the panel omits or leaves it redacted", () => {
    const original = parseModelsConfig(
      '{"providers":{"keep":{"apiKey":"secret","models":[]},"replace":{"apiKey":"old","models":[]}}}',
      "json",
    );
    const edited = parseModelsConfig(
      '{"providers":{"keep":{"models":[]},"replace":{"apiKey":"new","models":[]}}}',
      "json",
    );

    expect(restoreRedactedValues(original, edited).providers).toMatchObject({
      keep: {
        apiKey: "secret",
      },
      replace: {
        apiKey: "new",
      },
    });
  });

  it("uses fixed thinking-level checkbox order and removes the advanced JSON editor", () => {
    const config = parseModelsConfig(
      '{"providers":{"p":{"models":[{"id":"m","thinkingLevelMap":{"custom":"keep","medium":"medium"},"compat":{"x":true}}]}}}',
      "json",
    );
    const html = buildModelConfigPanelHtml(config);

    expect(html.indexOf('id="thinking-medium"')).toBeLessThan(
      html.indexOf('id="thinking-high"'),
    );
    expect(html.indexOf('id="thinking-high"')).toBeLessThan(
      html.indexOf('id="thinking-xhigh"'),
    );
    expect(html).not.toContain('id="model-advanced-json"');
    expect(html).toContain('class="field thinking-levels"');
    expect(html).toContain("var thinking=Object.assign({},m.thinkingLevelMap)");
    expect(html).toContain('thinking[level]=el("thinking-"+level).checked');
    expect(html).toContain('"custom":"keep"');
    expect(html).toContain('"compat":{"x":true}');
    expect(html).not.toContain("modelAdvanced");
  });

  it("adds provider and model management controls with reorder and delete confirmation", () => {
    const html = buildModelConfigPanelHtml(
      parseModelsConfig(
        '{"providers":{"a":{"models":[{"id":"m"}]},"b":{"models":[]}}}',
        "json",
      ),
    );

    expect(html).toContain('id="provider-up"');
    expect(html).toContain('id="provider-down"');
    expect(html).toContain('id="provider-add"');
    expect(html).toContain('id="provider-delete"');
    expect(html).toContain('id="model-add"');
    expect(html).toContain('id="model-delete"');
    expect(html).toContain("row.draggable=true");
    expect(html).toContain("showConfirmation(action)");
    expect(html).toContain('"delete-provider"');
    expect(html).toContain('"delete-model"');
    expect(html).toContain('el("model-add").disabled=providerCount===0');
  });
});
