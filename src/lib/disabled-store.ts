import {
  type JsonObject,
  type ModelConfig,
  type ModelsConfig,
  type ProviderConfig,
  validateModelsConfig,
} from "./models-config.ts";

/**
 * Panel-only marker for entries the user switched off. It is never written into
 * models.json; the split below moves those entries into the disabled store.
 */
export interface PanelModelConfig extends ModelConfig {
  disabled?: boolean;
}

export interface PanelProviderConfig extends ProviderConfig {
  disabled?: boolean;
  models?: PanelModelConfig[];
}

/**
 * What the panel edits: models.json plus the disabled entries merged back in.
 * Extends JsonObject so it is assignable wherever a ModelsConfig is expected.
 */
export interface PanelConfig extends JsonObject {
  providers: Record<string, PanelProviderConfig>;
}

/**
 * Entries moved out of models.json, persisted as `<models.json>.disabled`.
 *
 * - `providers` holds whole provider snapshots (models keep their own disabled
 *   flags so per-model intent survives a provider-level off/on cycle).
 * - `models` holds the off models of providers that stay enabled; membership in
 *   this bucket is the flag, so those entries carry no `disabled` key.
 */
export interface DisabledStore {
  models: Record<string, ModelConfig[]>;
  providers: Record<string, ProviderConfig>;
}

export interface SplitPanelConfigResult {
  disabled: DisabledStore;
  enabled: ModelsConfig;
}

export function splitPanelConfig(full: PanelConfig): SplitPanelConfigResult {
  const enabled: ModelsConfig = {
    providers: {},
  };
  const disabled: DisabledStore = {
    models: {},
    providers: {},
  };

  for (const [providerId, provider] of Object.entries(full.providers)) {
    const { disabled: providerDisabled, models, ...providerRest } = provider;

    if (providerDisabled === true) {
      // Snapshot the whole provider, models included: re-enabling it later must
      // restore both its config and the per-model flags inside it.
      const { disabled: _providerDisabled, ...snapshot } = provider;
      disabled.providers[providerId] = snapshot as ProviderConfig;
      continue;
    }

    const onModels: ModelConfig[] = [];
    const offModels: ModelConfig[] = [];

    for (const model of models ?? []) {
      if (model.disabled === true) {
        offModels.push(cleanModel(model));
      } else {
        onModels.push(cleanModel(model));
      }
    }

    if (offModels.length > 0) {
      disabled.models[providerId] = offModels;
    }

    enabled.providers[providerId] =
      models === undefined
        ? (providerRest as ProviderConfig)
        : ({
            ...providerRest,
            models: onModels,
          } as ProviderConfig);
  }

  return {
    disabled,
    enabled,
  };
}

/**
 * Merges the off entries back in so the panel can render one editable shape.
 * Model objects are copied; provider objects are copied too, so a caller may edit
 * the result without touching the config or the store it came from.
 */
export function mergePanelConfig(
  enabled: ModelsConfig,
  disabled: DisabledStore,
): PanelConfig {
  const providers: Record<string, PanelProviderConfig> = {};

  for (const [providerId, provider] of Object.entries(enabled.providers)) {
    const onModels = provider.models;
    const offModels = disabled.models[providerId] ?? [];
    // models.json wins: a stale store entry loses to the model still in the file.
    const kept = offModels.filter(
      (off) => !(onModels ?? []).some((on) => on.id === off.id),
    );
    const nextProvider: PanelProviderConfig = {
      ...provider,
    };

    if (onModels !== undefined || kept.length > 0) {
      // Models are copied, not referenced: the panel's whole job is to edit this
      // result in place, and callers hand in their parsed models.json here.
      nextProvider.models = [
        ...(onModels ?? []).map((model) => ({
          ...model,
        })),
        ...kept.map((model) => ({
          ...model,
          disabled: true,
        })),
      ];
    }

    providers[providerId] = nextProvider;
  }

  for (const [providerId, provider] of Object.entries(disabled.providers)) {
    if (providers[providerId]) continue;
    providers[providerId] = {
      ...provider,
      disabled: true,
    };
  }

  return {
    providers,
  };
}

export function parseDisabledStore(source: string): DisabledStore {
  let value: unknown;

  try {
    value = JSON.parse(source);
  } catch (error) {
    throw new Error(`Failed to parse disabled store: ${errorMessage(error)}`);
  }

  if (!isRecord(value)) {
    throw new Error("Expected disabled store to be an object");
  }

  const providers = value.providers ?? {};
  const models = value.models ?? {};

  if (!isRecord(providers)) {
    throw new Error("Expected disabled store providers to be an object");
  }

  if (!isRecord(models)) {
    throw new Error("Expected disabled store models to be an object");
  }

  for (const [providerId, provider] of Object.entries(providers)) {
    validateModelsConfig({
      providers: {
        [providerId]: provider,
      },
    });
  }

  for (const [providerId, list] of Object.entries(models)) {
    validateModelsConfig({
      providers: {
        [providerId]: {
          models: list,
        },
      },
    });
  }

  return {
    models: models as Record<string, ModelConfig[]>,
    providers: providers as Record<string, ProviderConfig>,
  };
}

export function exportDisabledStore(store: DisabledStore): string {
  return `${JSON.stringify(
    {
      models: store.models,
      providers: store.providers,
    },
    null,
    2,
  )}\n`;
}

export function isEmptyDisabledStore(store: DisabledStore): boolean {
  return (
    Object.keys(store.providers).length === 0 &&
    Object.values(store.models).every((models) => models.length === 0)
  );
}

function cleanModel(model: PanelModelConfig): ModelConfig {
  const { disabled: _disabled, ...rest } = model;
  return rest as ModelConfig;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
