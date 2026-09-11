import { describe, expect, it } from "vitest";
import { parseModelsConfig } from "../lib/models-config.ts";
import {
  buildModelConfigPanelHtml,
  redactPanelConfig,
  restoreRedactedValues,
} from "./model-config-panel.ts";

const PANEL_SCRIPT_PATTERN = /<script>([\s\S]*)<\/script>/;
const COMPAT_FIELD_LIST_PATTERN = /\["supportsUsageInStreaming".*?\]/;
const COMPAT_FIELD_NAME_PATTERN = /"([a-z][A-Za-z]*)"/g;

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
    expect(html).toContain(
      "var thinking=Object.assign({medium:null,high:null,off:null,minimal:null,low:null,xhigh:null,max:null},m.thinkingLevelMap)",
    );
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
  it("loads and sends provider order separately from the Pi config", () => {
    const html = buildModelConfigPanelHtml(
      parseModelsConfig(
        '{"providers":{"alpha":{"models":[]},"beta":{"models":[]}}}',
        "json",
      ),
      [
        "beta",
        "alpha",
      ],
    );
    expect(html).toContain('providerOrder=["beta","alpha"]');
    expect(html).toContain("providerOrder:providerOrder.slice()");
    expect(html).not.toContain("xpiProviderOrder");
  });

  it("blocks deleting a provider that still has models", () => {
    const html = buildModelConfigPanelHtml(
      parseModelsConfig('{"providers":{"p":{"models":[{"id":"m"}]}}}', "json"),
    );

    expect(html).toContain("请先清空供应商中的模型");
    expect(html).toContain("models.length");
  });
  it("sizes the provider and model panes to their content", () => {
    const html = buildModelConfigPanelHtml(
      parseModelsConfig(
        '{"providers":{"a-very-long-provider-name":{"models":[{"id":"a-very-long-model-name"}]}}}',
        "json",
      ),
    );

    expect(html).toContain(
      "grid-template-columns:max-content max-content minmax(320px,1fr)",
    );
    expect(html).toContain("white-space:nowrap");
    expect(html).toContain("text-overflow:clip");
  });
  it("hides model fields without a model and defaults new model parameters", () => {
    const html = buildModelConfigPanelHtml(
      parseModelsConfig('{"providers":{"p":{"models":[]}}}', "json"),
    );

    expect(html).toContain('el("model-view").classList.toggle("hidden",!m)');
    expect(html).toContain(
      "models.concat([{id:id,contextWindow:300000,maxTokens:24000}])",
    );
    expect(html).toContain('el("model-context-window").value=model.contextWindow||""');
    expect(html).toContain('el("model-max-tokens").value=model.maxTokens||""');
  });

  it("defaults thinking levels and writes unchecked levels as null", () => {
    const html = buildModelConfigPanelHtml(
      parseModelsConfig(
        '{"providers":{"p":{"models":[{"id":"m","thinkingLevelMap":{"custom":"keep"}}]}}}',
        "json",
      ),
    );

    expect(html).toContain('value===undefined?level!=="xhigh"');
    expect(html).toContain(
      "Object.keys(thinking).forEach(function(level){thinking[level]=null})",
    );
    expect(html).toContain('thinking[level]=el("thinking-"+level).checked');
  });

  it("uses text and image checkboxes with all inputs selected by default", () => {
    const html = buildModelConfigPanelHtml(
      parseModelsConfig('{"providers":{"p":{"models":[{"id":"m"}]}}}', "json"),
    );

    expect(html).toContain('id="model-input-text" type="checkbox"');
    expect(html).toContain('id="model-input-image" type="checkbox"');
    expect(html).not.toContain('id="model-input" placeholder="text,image"');
    expect(html).toContain(
      "!Array.isArray(model.input)||inputTypes.indexOf(type)!==-1",
    );
    expect(html).toContain('var inputs=["text","image"].filter');
  });

  it("checks reasoning models by default unless explicitly disabled", () => {
    const html = buildModelConfigPanelHtml(
      parseModelsConfig('{"providers":{"p":{"models":[{"id":"m"}]}}}', "json"),
    );
    expect(html).toContain("model.reasoning!==false");
  });

  it("uses CNY as the stored cost basis and converts only explicit USD display", () => {
    const html = buildModelConfigPanelHtml(
      parseModelsConfig(
        '{"providers":{"p":{"models":[{"id":"m","cost":{"input":7}}]}}}',
        "json",
      ),
    );

    expect(html).toContain('activeCurrency==="CNY"?number:number/7');
    expect(html).toContain('activeCurrency==="CNY"?value:value*7');
  });

  it("renders api-specific compat controls with unset-capable tri-state defaults", () => {
    const html = buildModelConfigPanelHtml(
      parseModelsConfig('{"providers":{"p":{"models":[]}}}', "json"),
    );

    expect(html).toContain('<div class="form-grid hidden" id="compat-openai">');
    expect(html).toContain('<div class="form-grid hidden" id="compat-anthropic">');
    for (const id of [
      "compat-max-tokens-field",
      "compat-supports-usage-in-streaming",
      "compat-supports-eager-tool-input-streaming",
      "compat-supports-long-cache-retention",
      "compat-force-adaptive-thinking",
      "compat-allow-empty-signature",
    ]) {
      expect(html).toContain(`id="${id}"`);
    }
    expect(html).toContain('data-i18n="optDefaultTrue"');
    expect(html).toContain('data-i18n="optDefaultFalse"');
    expect(html).toContain('data-i18n="optDefaultAuto"');
  });

  it("labels every compat control and option in both languages", () => {
    const html = buildModelConfigPanelHtml(
      parseModelsConfig('{"providers":{"p":{"models":[]}}}', "json"),
    );

    for (const key of [
      "compatMaxTokensField",
      "compatSupportsUsageInStreaming",
      "compatSupportsEagerToolInputStreaming",
      "compatSupportsLongCacheRetention",
      "compatForceAdaptiveThinking",
      "compatAllowEmptySignature",
      "optDefaultAuto",
      "optDefaultTrue",
      "optDefaultFalse",
    ]) {
      expect(html.split(`${key}:`).length - 1).toBe(2);
    }
    expect(html).toContain("默认 (true)");
    expect(html).toContain("默认 (false)");
    expect(html).toContain("Default (true)");
    expect(html).toContain("Default (false)");
  });

  it("refills compat values and shows only the group matching the provider api", () => {
    const html = buildModelConfigPanelHtml(
      parseModelsConfig(
        '{"providers":{"p":{"api":"anthropic-messages","models":[]}}}',
        "json",
      ),
    );

    expect(html).toContain("var compat=provider.compat||{}");
    expect(html).toContain(
      'el("compat-openai").classList.toggle("hidden",api!=="openai-completions")',
    );
    expect(html).toContain(
      'el("compat-anthropic").classList.toggle("hidden",api!=="anthropic-messages")',
    );
    expect(html).toContain('maxTokensNode.value=compat.maxTokensField||""');
    expect(html).toContain('Array.from(maxTokensNode.querySelectorAll("option")).some');
    expect(html).toContain('typeof compat[key]==="boolean"?String(compat[key]):""');
  });

  it("merges compat edits back without dropping unrelated keys", () => {
    const html = buildModelConfigPanelHtml(
      parseModelsConfig(
        '{"providers":{"p":{"compat":{"openRouterRouting":{"only":["a"]},"unknownKey":true},"models":[]}}}',
        "json",
      ),
    );

    expect(html).toContain("var compat=Object.assign({},p.compat)");
    expect(html).toContain('if(maxTokensValue==="")delete compat.maxTokensField');
    expect(html).toContain('if(value==="")delete compat[key]');
    expect(html).toContain('compat[key]=value==="true"');
    expect(html).toContain(
      "if(Object.keys(compat).length)p.compat=compat;else delete p.compat",
    );
  });

  it("refreshes the compat groups when the provider api changes", () => {
    const html = buildModelConfigPanelHtml(
      parseModelsConfig('{"providers":{"p":{"models":[]}}}', "json"),
    );

    expect(html).toContain(
      'el("provider-api").addEventListener("change",function(){saveForm();renderForm()})',
    );
  });

  it("compiles the panel script and derives every compat control id from its field list", () => {
    const html = buildModelConfigPanelHtml(
      parseModelsConfig('{"providers":{"p":{"models":[]}}}', "json"),
    );
    const script = html.match(PANEL_SCRIPT_PATTERN)?.[1] ?? "";

    expect(script.length).toBeGreaterThan(0);
    expect(() => new Function(script)).not.toThrow();

    const fields = html.match(COMPAT_FIELD_LIST_PATTERN)?.[0] ?? "";
    const names = [
      ...fields.matchAll(COMPAT_FIELD_NAME_PATTERN),
    ].map((match) => match[1]);
    expect(names).toEqual([
      "supportsUsageInStreaming",
      "supportsEagerToolInputStreaming",
      "supportsLongCacheRetention",
      "forceAdaptiveThinking",
      "allowEmptySignature",
    ]);
    for (const name of names) {
      const id = `compat-${name.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`)}`;
      expect(html).toContain(`id="${id}"`);
    }
  });
});
