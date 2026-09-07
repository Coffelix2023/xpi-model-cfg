import { createHash } from "node:crypto";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

const SENSITIVE_KEY_PATTERN = /(^apiKey$|authorization|secret|token|key$)/i;

export const MODEL_CONFIG_FIELD_GROUPS = {
  samplingParams: [],
  compat: [
    "allowEmptySignature",
    "cacheControlFormat",
    "chatTemplateArgs",
    "chatTemplateKwargs",
    "deferredToolsMode",
    "forceAdaptiveThinking",
    "maxTokensField",
    "openRouterRouting",
    "requiresAssistantAfterToolResult",
    "requiresReasoningContentOnAssistantMessages",
    "requiresThinkingAsText",
    "requiresToolResultName",
    "sendSessionAffinityHeaders",
    "sessionAffinityFormat",
    "supportsCacheControlOnTools",
    "supportsDeveloperRole",
    "supportsEagerToolInputStreaming",
    "supportsFinishReason",
    "supportsLongCacheRetention",
    "supportsMidConvoEffort",
    "supportsOpenAIGrammarTools",
    "supportsReasoningEffort",
    "supportsStore",
    "supportsStrictMode",
    "supportsStrictTools",
    "supportsThinkingTokenBudget",
    "supportsUsageInStreaming",
    "thinkingFormat",
    "thinkingTokenBudgetField",
    "vercelGatewayRouting",
  ],
  cost: [
    "input",
    "output",
    "cacheRead",
    "cacheWrite",
    "tiers",
  ],
  model: [
    "id",
    "name",
    "api",
    "reasoning",
    "thinkingLevelMap",
    "input",
    "contextWindow",
    "maxTokens",
    "samplingParams",
    "cost",
    "compat",
  ],
  modelOverride: [
    "name",
    "reasoning",
    "thinkingLevelMap",
    "input",
    "cost",
    "contextWindow",
    "maxTokens",
    "samplingParams",
    "headers",
    "compat",
  ],
  provider: [
    "baseUrl",
    "api",
    "apiKey",
    "oauth",
    "headers",
    "authHeader",
    "models",
    "modelOverrides",
    "compat",
  ],
} as const;

export type JsonPrimitive = boolean | null | number | string;

export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | {
      [key: string]: JsonValue;
    };

export interface JsonObject {
  [key: string]: unknown;
}

export type ApiType =
  | "anthropic-messages"
  | "azure-openai-responses"
  | "google-generative-ai"
  | "openai-completions"
  | "openai-responses"
  | (string & {});

export type ModelInput = "image" | "text" | (string & {});

export type ThinkingLevel =
  | "high"
  | "low"
  | "max"
  | "medium"
  | "minimal"
  | "off"
  | "xhigh";

export type SecretReference = string;

export type Headers = Record<string, string>;

export type SamplingParams = JsonObject;

export interface ThinkingLevelMap extends JsonObject {
  high?: string | null;
  low?: string | null;
  max?: string | null;
  medium?: string | null;
  minimal?: string | null;
  off?: string | null;
  xhigh?: string | null;
}

export interface CostTier extends JsonObject {
  cacheRead: number;
  cacheWrite: number;
  input: number;
  inputTokensAbove: number;
  output: number;
}

export interface CostConfig extends JsonObject {
  cacheRead: number;
  cacheWrite: number;
  input: number;
  output: number;
  tiers?: CostTier[];
}

export interface CostOverride extends JsonObject {
  cacheRead?: number;
  cacheWrite?: number;
  input?: number;
  output?: number;
  tiers?: CostTier[];
}

export type ThinkingFormat =
  | "baseten"
  | "chat-template"
  | "deepseek"
  | "openrouter"
  | "qwen"
  | "qwen-chat-template"
  | "together"
  | (string & {});

export type SessionAffinityFormat =
  | "openai"
  | "openai-nosession"
  | "openrouter"
  | (string & {});

export interface CompatibilityConfig extends JsonObject {
  allowEmptySignature?: boolean;
  cacheControlFormat?: "anthropic" | (string & {});
  chatTemplateArgs?: JsonObject;
  chatTemplateKwargs?: JsonObject;
  deferredToolsMode?: "kimi" | (string & {});
  forceAdaptiveThinking?: boolean;
  maxTokensField?: "max_completion_tokens" | "max_tokens" | (string & {});
  openRouterRouting?: JsonObject;
  requiresAssistantAfterToolResult?: boolean;
  requiresReasoningContentOnAssistantMessages?: boolean;
  requiresThinkingAsText?: boolean;
  requiresToolResultName?: boolean;
  sendSessionAffinityHeaders?: boolean;
  sessionAffinityFormat?: SessionAffinityFormat;
  supportsCacheControlOnTools?: boolean;
  supportsDeveloperRole?: boolean;
  supportsEagerToolInputStreaming?: boolean;
  supportsFinishReason?: boolean;
  supportsLongCacheRetention?: boolean;
  supportsMidConvoEffort?: boolean;
  supportsOpenAIGrammarTools?: boolean;
  supportsReasoningEffort?: boolean;
  supportsStore?: boolean;
  supportsStrictMode?: boolean;
  supportsStrictTools?: boolean;
  supportsThinkingTokenBudget?: boolean;
  supportsUsageInStreaming?: boolean;
  thinkingFormat?: ThinkingFormat;
  thinkingTokenBudgetField?: string;
  vercelGatewayRouting?: JsonObject;
}

export interface ModelConfig extends JsonObject {
  api?: ApiType;
  compat?: CompatibilityConfig;
  contextWindow?: number;
  cost?: CostConfig;
  id: string;
  input?: ModelInput[];
  maxTokens?: number;
  name?: string;
  reasoning?: boolean;
  samplingParams?: SamplingParams;
  thinkingLevelMap?: ThinkingLevelMap;
}

export interface ModelOverrideConfig extends JsonObject {
  compat?: CompatibilityConfig;
  contextWindow?: number;
  cost?: CostOverride;
  headers?: Headers;
  input?: ModelInput[];
  maxTokens?: number;
  name?: string;
  reasoning?: boolean;
  samplingParams?: SamplingParams;
  thinkingLevelMap?: ThinkingLevelMap;
}

export interface ProviderConfig extends JsonObject {
  api?: ApiType;
  apiKey?: SecretReference;
  authHeader?: boolean;
  baseUrl?: string;
  compat?: CompatibilityConfig;
  headers?: Headers;
  modelOverrides?: Record<string, ModelOverrideConfig>;
  models?: ModelConfig[];
  oauth?: string;
}

export interface ModelsConfig extends JsonObject {
  providers: Record<string, ProviderConfig>;
}

export type ModelsJsonConfig = ModelsConfig;
export type ModelsYamlConfig = ModelsConfig;

type RedactedConfigValue = JsonValue | undefined;

export type ModelsConfigFormat = "json" | "yaml" | "yml";

export interface ApplyPreview {
  canApply: true;
  currentHash: string;
  nextHash: string;
  redactedDiff: string;
}

export interface ApplyPreviewInput {
  baselineHash: string;
  currentConfig: ModelsConfig;
  currentSource: string;
  nextConfig: ModelsConfig;
}

export function hashText(source: string): string {
  return createHash("sha256").update(source).digest("hex");
}

export function parseModelsConfig(
  source: string,
  format: ModelsConfigFormat,
): ModelsConfig {
  let value: unknown;

  try {
    value = format === "json" ? JSON.parse(source) : parseYaml(source);
  } catch (error) {
    throw new Error(`Failed to parse models config: ${errorMessage(error)}`);
  }

  return validateModelsConfig(value);
}

export function exportModelsConfigMirror(
  config: ModelsConfig,
  format: ModelsConfigFormat,
): string {
  validateModelsConfig(config);

  if (format === "json") {
    return `${JSON.stringify(config, null, 2)}\n`;
  }

  return stringifyYaml(config);
}

export function redactModelsConfig(config: ModelsConfig): ModelsConfig {
  return redactValue(config) as ModelsConfig;
}

export function buildApplyPreview(input: ApplyPreviewInput): ApplyPreview {
  const currentHash = hashText(input.currentSource);

  if (currentHash !== input.baselineHash) {
    throw new Error("Refusing to apply models config: external change detected");
  }

  validateModelsConfig(input.currentConfig);
  validateModelsConfig(input.nextConfig);

  const currentRedacted = exportModelsConfigMirror(
    redactModelsConfig(input.currentConfig),
    "json",
  );
  const nextRedacted = exportModelsConfigMirror(
    redactModelsConfig(input.nextConfig),
    "json",
  );

  return {
    canApply: true,
    currentHash,
    nextHash: hashText(exportModelsConfigMirror(input.nextConfig, "json")),
    redactedDiff: renderLineDiff(currentRedacted, nextRedacted),
  };
}

export function validateModelsConfig(value: unknown): ModelsConfig {
  assertRecord(value, "models config");
  assertRecord(value.providers, "providers");

  for (const [providerId, provider] of Object.entries(value.providers)) {
    assertRecord(provider, `providers.${providerId}`);
    validateOptionalString(provider, "api", `providers.${providerId}.api`);
    validateOptionalString(provider, "apiKey", `providers.${providerId}.apiKey`);
    validateOptionalString(provider, "baseUrl", `providers.${providerId}.baseUrl`);
    validateOptionalString(provider, "oauth", `providers.${providerId}.oauth`);
    validateOptionalBoolean(
      provider,
      "authHeader",
      `providers.${providerId}.authHeader`,
    );
    validateHeaders(provider.headers, `providers.${providerId}.headers`);
    validateOptionalRecord(provider.compat, `providers.${providerId}.compat`);

    if (provider.models !== undefined) {
      if (!Array.isArray(provider.models)) {
        throw new Error(`Expected providers.${providerId}.models to be an array`);
      }

      for (const [index, model] of provider.models.entries()) {
        validateModel(model, `providers.${providerId}.models.${index}`);
      }
    }

    if (provider.modelOverrides !== undefined) {
      assertRecord(provider.modelOverrides, `providers.${providerId}.modelOverrides`);

      for (const [modelId, override] of Object.entries(provider.modelOverrides)) {
        validateModelOverride(
          override,
          `providers.${providerId}.modelOverrides.${modelId}`,
        );
      }
    }
  }

  return value as ModelsConfig;
}

function validateModel(value: unknown, path: string): void {
  assertRecord(value, path);

  if (typeof value.id !== "string" || value.id.length === 0) {
    throw new Error(`Expected ${path}.id to be a non-empty string`);
  }

  validateOptionalString(value, "api", `${path}.api`);
  validateOptionalString(value, "name", `${path}.name`);
  validateOptionalBoolean(value, "reasoning", `${path}.reasoning`);
  validateOptionalNumber(value, "contextWindow", `${path}.contextWindow`);
  validateOptionalNumber(value, "maxTokens", `${path}.maxTokens`);
  validateOptionalRecord(value.compat, `${path}.compat`);
  validateOptionalRecord(value.cost, `${path}.cost`);
  validateOptionalRecord(value.samplingParams, `${path}.samplingParams`);
  validateOptionalRecord(value.thinkingLevelMap, `${path}.thinkingLevelMap`);

  if (
    value.input !== undefined &&
    (!Array.isArray(value.input) ||
      !value.input.every((item) => typeof item === "string"))
  ) {
    throw new Error(`Expected ${path}.input to be an array of strings`);
  }
}

function validateModelOverride(value: unknown, path: string): void {
  assertRecord(value, path);
  validateHeaders(value.headers, `${path}.headers`);
  validateOptionalString(value, "name", `${path}.name`);
  validateOptionalBoolean(value, "reasoning", `${path}.reasoning`);
  validateOptionalNumber(value, "contextWindow", `${path}.contextWindow`);
  validateOptionalNumber(value, "maxTokens", `${path}.maxTokens`);
  validateOptionalRecord(value.compat, `${path}.compat`);
  validateOptionalRecord(value.cost, `${path}.cost`);
  validateOptionalRecord(value.samplingParams, `${path}.samplingParams`);
  validateOptionalRecord(value.thinkingLevelMap, `${path}.thinkingLevelMap`);

  if (
    value.input !== undefined &&
    (!Array.isArray(value.input) ||
      !value.input.every((item) => typeof item === "string"))
  ) {
    throw new Error(`Expected ${path}.input to be an array of strings`);
  }
}

function validateHeaders(value: unknown, path: string): void {
  if (value === undefined) {
    return;
  }

  assertRecord(value, path);

  for (const [key, headerValue] of Object.entries(value)) {
    if (typeof headerValue !== "string") {
      throw new Error(`Expected ${path}.${key} to be a string`);
    }
  }
}

function validateOptionalBoolean(record: JsonObject, key: string, path: string): void {
  if (record[key] !== undefined && typeof record[key] !== "boolean") {
    throw new Error(`Expected ${path} to be a boolean`);
  }
}

function validateOptionalNumber(record: JsonObject, key: string, path: string): void {
  if (record[key] !== undefined && typeof record[key] !== "number") {
    throw new Error(`Expected ${path} to be a number`);
  }
}

function validateOptionalRecord(value: unknown, path: string): void {
  if (value !== undefined) {
    assertRecord(value, path);
  }
}

function validateOptionalString(record: JsonObject, key: string, path: string): void {
  if (record[key] !== undefined && typeof record[key] !== "string") {
    throw new Error(`Expected ${path} to be a string`);
  }
}

function assertRecord(value: unknown, path: string): asserts value is JsonObject {
  if (!isRecord(value)) {
    throw new Error(`Expected ${path} to be an object`);
  }
}

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function redactValue(value: unknown, key = ""): RedactedConfigValue {
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item)) as JsonValue[];
  }

  if (!isRecord(value)) {
    return (
      isSensitiveKey(key) && value !== undefined ? "[REDACTED]" : value
    ) as RedactedConfigValue;
  }

  return Object.fromEntries(
    Object.entries(value).map(([childKey, childValue]) => [
      childKey,
      redactValue(childValue, childKey),
    ]),
  ) as RedactedConfigValue;
}

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERN.test(key);
}

function renderLineDiff(currentSource: string, nextSource: string): string {
  const currentLines = currentSource.trimEnd().split("\n");
  const nextLines = nextSource.trimEnd().split("\n");
  const maxLength = Math.max(currentLines.length, nextLines.length);
  const output = [
    "--- current",
    "+++ next",
  ];

  for (let index = 0; index < maxLength; index += 1) {
    if (currentLines[index] === nextLines[index]) {
      continue;
    }

    if (currentLines[index] !== undefined) {
      output.push(`- ${currentLines[index]}`);
    }

    if (nextLines[index] !== undefined) {
      output.push(`+ ${nextLines[index]}`);
    }
  }

  return `${output.join("\n")}\n`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
