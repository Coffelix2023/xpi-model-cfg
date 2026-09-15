import { describe, expect, it } from "vitest";

import {
  exportDisabledStore,
  isEmptyDisabledStore,
  mergePanelConfig,
  type PanelConfig,
  parseDisabledStore,
  splitPanelConfig,
} from "./disabled-store.ts";

const PARSE_ERROR = /Failed to parse disabled store/;
const PROVIDERS_SHAPE_ERROR = /providers to be an object/;
const MODELS_SHAPE_ERROR = /providers\.p\.models to be an array/;

function panelConfig(value: unknown): PanelConfig {
  return JSON.parse(JSON.stringify(value)) as PanelConfig;
}

describe("disabled store", () => {
  it("moves a disabled provider out of models.json with its full config", () => {
    const full = panelConfig({
      providers: {
        keep: {
          api: "openai-completions",
          apiKey: "$KEEP_KEY",
          models: [
            {
              id: "keep-1",
            },
          ],
        },
        off: {
          api: "anthropic-messages",
          apiKey: "plain-secret",
          baseUrl: "https://off.example.com",
          disabled: true,
          models: [
            {
              id: "off-1",
              name: "Off One",
            },
          ],
        },
      },
    });

    const { disabled, enabled } = splitPanelConfig(full);

    expect(Object.keys(enabled.providers)).toEqual([
      "keep",
    ]);
    expect(disabled.providers.off).toMatchObject({
      apiKey: "plain-secret",
      baseUrl: "https://off.example.com",
      models: [
        {
          id: "off-1",
          name: "Off One",
        },
      ],
    });
    expect(disabled.providers.off).not.toHaveProperty("disabled");
    expect(disabled.models).toEqual({});
  });

  it("moves a disabled model out and strips the panel-only flag", () => {
    const full = panelConfig({
      providers: {
        p: {
          apiKey: "secret",
          models: [
            {
              disabled: false,
              id: "on",
            },
            {
              disabled: true,
              id: "off",
            },
          ],
        },
      },
    });

    const { disabled, enabled } = splitPanelConfig(full);

    expect(enabled.providers.p.models).toEqual([
      {
        id: "on",
      },
    ]);
    expect(JSON.stringify(enabled)).not.toContain("disabled");
    expect(disabled.models.p).toEqual([
      {
        id: "off",
      },
    ]);
  });

  it("keeps per-model flags of a provider-level disabled provider", () => {
    const full = panelConfig({
      providers: {
        off: {
          disabled: true,
          models: [
            {
              id: "on",
            },
            {
              disabled: true,
              id: "off",
            },
          ],
        },
      },
    });

    const { disabled, enabled } = splitPanelConfig(full);
    const merged = mergePanelConfig(enabled, disabled);
    const roundTripped = splitPanelConfig(merged);

    expect(disabled.providers.off.models).toEqual([
      {
        id: "on",
      },
      {
        disabled: true,
        id: "off",
      },
    ]);
    expect(roundTripped.enabled.providers).toEqual({});
    expect(roundTripped.disabled.providers.off.models).toEqual([
      {
        id: "on",
      },
      {
        disabled: true,
        id: "off",
      },
    ]);
  });

  it("round-trips provider-level, model-level, mixed and empty configs", () => {
    const full = panelConfig({
      providers: {
        a: {
          apiKey: "a",
          disabled: true,
          models: [
            {
              id: "a-1",
            },
          ],
        },
        b: {
          apiKey: "b",
          models: [
            {
              id: "b-1",
            },
            {
              disabled: true,
              id: "b-2",
            },
          ],
        },
        c: {
          apiKey: "c",
          models: [
            {
              id: "c-1",
            },
          ],
        },
        d: {
          apiKey: "d",
        },
      },
    });

    const { disabled, enabled } = splitPanelConfig(full);
    const merged = mergePanelConfig(enabled, disabled);

    // Enabled providers keep models.json order; disabled ones are appended.
    // The workflow restores display order through the models.json.order sidecar.
    expect(Object.keys(merged.providers)).toEqual([
      "b",
      "c",
      "d",
      "a",
    ]);
    expect(merged.providers.a).toMatchObject({
      apiKey: "a",
      disabled: true,
    });
    expect(merged.providers.a.models).toEqual([
      {
        id: "a-1",
      },
    ]);
    expect(merged.providers.b.models).toEqual([
      {
        id: "b-1",
      },
      {
        disabled: true,
        id: "b-2",
      },
    ]);
    expect(merged.providers.c.models).toEqual([
      {
        id: "c-1",
      },
    ]);
    expect(merged.providers.d).not.toHaveProperty("models");

    // Re-enabling puts the model back through the same split without drift.
    const again = splitPanelConfig(merged);
    expect(again.enabled.providers.b.models).toEqual([
      {
        id: "b-1",
      },
    ]);
    expect(again.disabled.models.b).toEqual([
      {
        id: "b-2",
      },
    ]);
  });

  it("copies models so editing the merged panel config cannot reach the inputs", () => {
    const source = {
      providers: {
        p: {
          models: [
            {
              id: "on",
            },
          ],
        },
      },
    };
    const store = {
      providers: {},
      models: {
        p: [
          {
            id: "off",
          },
        ],
      },
    };

    const merged = mergePanelConfig(source, store);
    const model = merged.providers.p.models?.[0];
    if (!model) throw new Error("merged model missing");
    model.disabled = true;
    (merged.providers.p.models ?? []).push({
      disabled: true,
      id: "added",
    });

    expect(source.providers.p.models).toEqual([
      {
        id: "on",
      },
    ]);
    expect(store.models.p).toEqual([
      {
        id: "off",
      },
    ]);
  });
  it("appends a re-enabled model after the models still in models.json", () => {
    const enabled = {
      providers: {
        p: {
          models: [
            {
              id: "first",
            },
            {
              id: "second",
            },
          ],
        },
      },
    };
    const merged = mergePanelConfig(enabled, {
      providers: {},
      models: {
        p: [
          {
            id: "restored",
          },
        ],
      },
    });

    expect(merged.providers.p.models?.map((model) => model.id)).toEqual([
      "first",
      "second",
      "restored",
    ]);
  });

  it("lets models.json win over a stale store entry", () => {
    const merged = mergePanelConfig(
      {
        providers: {
          p: {
            models: [
              {
                id: "same",
              },
            ],
          },
          q: {
            apiKey: "back",
          },
        },
      },
      {
        models: {
          p: [
            {
              id: "same",
            },
            {
              id: "gone",
            },
          ],
        },
        providers: {
          q: {
            apiKey: "stale",
          },
        },
      },
    );

    expect(merged.providers.q).toMatchObject({
      apiKey: "back",
    });
    expect(merged.providers.q).not.toHaveProperty("disabled");
    expect(merged.providers.p.models).toEqual([
      {
        id: "same",
      },
      {
        disabled: true,
        id: "gone",
      },
    ]);
  });

  it("parses and exports a store, and fails closed on invalid input", () => {
    const source =
      '{"providers":{"off":{"apiKey":"secret","models":[{"id":"m"}]}},"models":{"p":[{"id":"m"}]}}';
    const store = parseDisabledStore(source);

    expect(isEmptyDisabledStore(store)).toBe(false);
    expect(
      isEmptyDisabledStore({
        providers: {},
        models: {
          p: [],
        },
      }),
    ).toBe(true);
    expect(parseDisabledStore(exportDisabledStore(store))).toEqual(store);
    expect(exportDisabledStore(store)).toContain('"apiKey": "secret"');
    expect(() => parseDisabledStore("{")).toThrow(PARSE_ERROR);
    expect(() => parseDisabledStore('{"providers":[]}')).toThrow(PROVIDERS_SHAPE_ERROR);
    expect(() => parseDisabledStore('{"models":{"p":{"id":"m"}}}')).toThrow(
      MODELS_SHAPE_ERROR,
    );
  });
});
