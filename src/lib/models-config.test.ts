import { describe, expect, it } from "vitest";

import {
  buildApplyPreview,
  exportModelsConfigMirror,
  hashText,
  parseModelsConfig,
  redactModelsConfig,
} from "./models-config.ts";

const EXTERNAL_CHANGE_ERROR = /external/i;
const INVALID_MODEL_ID_ERROR = /id/i;
const INVALID_PROVIDERS_ERROR = /providers/i;
const PARSE_ERROR = /parse/i;

describe("models config import/export", () => {
  it("imports JSON and preserves references plus unknown fields", () => {
    const config = parseModelsConfig(
      JSON.stringify({
        providers: {
          local: {
            api: "openai-completions",
            apiKey: "$LOCAL_API_KEY",
            providerExtra: "kept",
            compat: {
              supportsDeveloperRole: false,
            },
            modelOverrides: {
              "builtin-model": {
                customOverride: {
                  keep: true,
                },
                samplingParams: {
                  temperature: 0.2,
                },
              },
            },
            models: [
              {
                id: "llama3.1:8b",
                vendorExtra: "kept",
                compat: {
                  supportsReasoningEffort: false,
                },
                cost: {
                  cacheRead: 0,
                  cacheWrite: 0,
                  input: 0,
                  output: 0,
                },
                input: [
                  "text",
                ],
                samplingParams: {
                  min_p: 0.1,
                },
              },
            ],
          },
        },
      }),
      "json",
    );

    expect(config.providers.local?.apiKey).toBe("$LOCAL_API_KEY");
    expect(config.providers.local?.providerExtra).toBe("kept");
    expect(config.providers.local?.models?.[0]?.vendorExtra).toBe("kept");
    expect(
      config.providers.local?.modelOverrides?.["builtin-model"]?.customOverride,
    ).toEqual({
      keep: true,
    });
  });

  it("imports YAML and exports a JSON mirror", () => {
    const config = parseModelsConfig(
      `providers:\n  google:\n    baseUrl: https://generativelanguage.googleapis.com/v1beta\n    api: google-generative-ai\n    apiKey: $GEMINI_API_KEY\n    models:\n      - id: gemma-4-31b-it\n        name: Gemma 4\n        reasoning: true\n`,
      "yaml",
    );

    expect(config.providers.google?.models?.[0]?.id).toBe("gemma-4-31b-it");
    expect(exportModelsConfigMirror(config, "json")).toContain('"providers"');
  });

  it("rejects malformed or invalid configs", () => {
    expect(() => parseModelsConfig("{", "json")).toThrow(PARSE_ERROR);
    expect(() => parseModelsConfig("providers: []", "yaml")).toThrow(
      INVALID_PROVIDERS_ERROR,
    );
    expect(() =>
      parseModelsConfig(
        "providers:\n  x:\n    models:\n      - name: missing-id\n",
        "yaml",
      ),
    ).toThrow(INVALID_MODEL_ID_ERROR);
  });
});

describe("models config redaction and preview", () => {
  it("redacts secrets without mutating references in the source config", () => {
    const config = parseModelsConfig(
      JSON.stringify({
        providers: {
          proxy: {
            apiKey: "!op read secret",
            headers: {
              Authorization: "Bearer secret",
              "x-api-key": "$HEADER_KEY",
            },
            models: [
              {
                id: "model-a",
              },
            ],
          },
        },
      }),
      "json",
    );

    const redacted = redactModelsConfig(config);

    expect(config.providers.proxy?.apiKey).toBe("!op read secret");
    expect(redacted).toMatchObject({
      providers: {
        proxy: {
          apiKey: "[REDACTED]",
          headers: {
            Authorization: "[REDACTED]",
            "x-api-key": "[REDACTED]",
          },
        },
      },
    });
  });

  it("computes stable hashes and blocks preview after external changes", () => {
    const currentSource = '{"providers":{"local":{"models":[{"id":"a"}]}}}\n';
    const currentConfig = parseModelsConfig(currentSource, "json");
    const nextConfig = parseModelsConfig(
      '{"providers":{"local":{"models":[{"id":"b"}]}}}',
      "json",
    );

    const preview = buildApplyPreview({
      baselineHash: hashText(currentSource),
      currentConfig,
      currentSource,
      nextConfig,
    });

    expect(preview.canApply).toBe(true);
    expect(preview.redactedDiff).toContain('"id": "a"');
    expect(preview.redactedDiff).toContain('"id": "b"');

    expect(() =>
      buildApplyPreview({
        baselineHash: hashText("stale"),
        currentConfig,
        currentSource,
        nextConfig,
      }),
    ).toThrow(EXTERNAL_CHANGE_ERROR);
  });
});
