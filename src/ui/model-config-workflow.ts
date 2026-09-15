import { readFile, rm, writeFile } from "node:fs/promises";
import {
  type DisabledStore,
  exportDisabledStore,
  isEmptyDisabledStore,
  mergePanelConfig,
  type PanelConfig,
  parseDisabledStore,
  splitPanelConfig,
} from "../lib/disabled-store.ts";
import {
  buildApplyPreview,
  exportModelsConfigMirror,
  hashText,
  type ModelsConfig,
  parseModelsConfig,
} from "../lib/models-config.ts";
import {
  writeModelsJsonAtomically,
  writeTextAtomically,
} from "../lib/models-persistence.ts";
import type { GlimpseModule, GlimpseWindow } from "./glimpse-runtime.ts";
import {
  buildModelConfigPanelHtml,
  MODEL_CONFIG_PANEL_MIN_WIDTH,
  parsePanelConfig,
} from "./model-config-panel.ts";

const MODEL_CONFIG_WINDOW_WIDTH = 980;

const EMPTY_DISABLED_STORE: DisabledStore = {
  models: {},
  providers: {},
};
const EXTERNAL_DISABLED_CHANGE_ERROR =
  "Refusing to apply models config: external change detected in the disabled store";

interface RunModelConfigPanelOptions {
  disabledPath: string;
  glimpse: GlimpseModule;
  jsonPath: string;
  notify(message: string, level?: "info" | "warning" | "error"): void;
  yamlPath: string;
}

interface PanelMessage {
  action:
    | "apply"
    | "cancel"
    | "confirm"
    | "prepare-apply"
    | "prepare-confirm"
    | "preview"
    | "validate";
  config?: ModelsConfig;
  providerOrder?: string[];
}

export async function runModelConfigPanel(
  options: RunModelConfigPanelOptions,
): Promise<GlimpseWindow> {
  const baselineSource = await readFile(options.jsonPath, "utf8");
  let baselineHash = hashText(baselineSource);
  const diskConfig = parseModelsConfig(baselineSource, "json");
  const disabledSnapshot = await readDisabledStore(options.disabledPath);
  let disabledHash = disabledSnapshot.hash;
  let sourceConfig: PanelConfig = mergePanelConfig(diskConfig, disabledSnapshot.store);
  let sourceProviderOrder = await readProviderOrder(
    `${options.jsonPath}.order`,
    sourceConfig,
  );
  await writeFile(options.yamlPath, exportModelsConfigMirror(diskConfig, "yaml"), {
    mode: 0o600,
  });

  const window = options.glimpse.open(
    buildModelConfigPanelHtml(sourceConfig, sourceProviderOrder),
    {
      frameless: false,
      height: 680,
      minWidth: MODEL_CONFIG_PANEL_MIN_WIDTH,
      title: "xpi-model-cfg",
      width: MODEL_CONFIG_WINDOW_WIDTH,
    },
  );
  let applying = false;

  window.on("ready", (info) => injectAppearance(window, info));
  window.on("message", (value) => {
    void handleMessage(value).catch((error: unknown) => {
      sendResult(window, false, errorMessage(error));
    });
  });
  window.on("error", (error) => {
    options.notify(`xpi-model-cfg: ${error.message}`, "error");
  });

  return window;

  async function handleMessage(value: unknown): Promise<void> {
    const message = decodePanelMessage(value);
    if (message.action === "cancel") {
      window.close();
      return;
    }

    const nextConfig = parsePanelConfig(sourceConfig, message.config);
    const nextProviderOrder = normalizeProviderOrder(
      message.providerOrder ?? sourceProviderOrder,
      nextConfig,
    );
    if (message.action === "validate") {
      sendResult(window, true, "配置有效");
      return;
    }

    const currentSource = await readFile(options.jsonPath, "utf8");
    if ((await readDisabledHash(options.disabledPath)) !== disabledHash) {
      throw new Error(EXTERNAL_DISABLED_CHANGE_ERROR);
    }
    const preview = buildApplyPreview({
      baselineHash,
      currentConfig: parseModelsConfig(currentSource, "json"),
      currentSource,
      nextConfig,
    });
    if (message.action === "preview") {
      sendResult(window, true, preview.redactedDiff || "无变更");
      return;
    }
    if (message.action === "prepare-apply" || message.action === "prepare-confirm") {
      sendConfirmation(
        window,
        message.action === "prepare-confirm" ? "confirm" : "apply",
        (preview.redactedDiff || "无变更").slice(0, 6_000),
      );
      return;
    }

    if (applying) return;
    applying = true;
    try {
      const { disabled, enabled } = splitPanelConfig(nextConfig);
      const disabledCount =
        Object.keys(disabled.providers).length +
        Object.values(disabled.models).reduce(
          (total, models) => total + models.length,
          0,
        );
      // Sidecar first: if the process dies before models.json is replaced, every
      // entry is still in models.json and the store is simply ignored on load.
      disabledHash = await writeDisabledStore(options.disabledPath, disabled);
      await writeModelsJsonAtomically(options.jsonPath, enabled);
      await writeFile(options.yamlPath, exportModelsConfigMirror(enabled, "yaml"), {
        mode: 0o600,
      });
      await writeFile(
        `${options.jsonPath}.order`,
        `${JSON.stringify(nextProviderOrder)}\n`,
        {
          mode: 0o600,
        },
      );
      sourceProviderOrder = nextProviderOrder;
      sourceConfig = nextConfig;
      baselineHash = hashText(await readFile(options.jsonPath, "utf8"));
      sendResult(
        window,
        true,
        disabledCount > 0
          ? `已应用；已更新 YAML 镜像；${disabledCount} 项已移入停用存储`
          : "已应用；已更新 YAML 镜像",
      );
      options.notify("模型配置已写入，请重载 Pi 模型列表", "info");
      if (message.action === "confirm") window.close();
    } finally {
      applying = false;
    }
  }
}

function decodePanelMessage(value: unknown): PanelMessage {
  if (!isRecord(value) || typeof value.action !== "string") {
    throw new Error("Invalid panel message");
  }

  switch (value.action) {
    case "cancel":
      return {
        action: value.action,
      };
    case "apply":
    case "confirm":
    case "preview":
    case "prepare-apply":
    case "prepare-confirm":
    case "validate":
      return {
        action: value.action,
        config: validateConfigInput(value.config),
        providerOrder: validateProviderOrder(value.providerOrder),
      };
    default:
      throw new Error("Unknown panel action");
  }
}

function validateConfigInput(value: unknown): ModelsConfig {
  if (!isRecord(value)) throw new Error("Panel message is missing config");
  return parseModelsConfig(JSON.stringify(value), "json");
}

function validateProviderOrder(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || !value.every((id) => typeof id === "string")) {
    throw new Error("Panel message has an invalid provider order");
  }
  return value;
}

function normalizeProviderOrder(value: unknown, config: ModelsConfig): string[] {
  const providerIds = Object.keys(config.providers);
  const available = new Set(providerIds);
  const order: string[] = [];
  if (Array.isArray(value)) {
    for (const providerId of value) {
      if (
        typeof providerId === "string" &&
        available.has(providerId) &&
        !order.includes(providerId)
      ) {
        order.push(providerId);
      }
    }
  }
  for (const providerId of providerIds) {
    if (!order.includes(providerId)) order.push(providerId);
  }
  return order;
}

async function readProviderOrder(
  path: string,
  config: ModelsConfig,
): Promise<string[]> {
  try {
    return normalizeProviderOrder(JSON.parse(await readFile(path, "utf8")), config);
  } catch {
    return Object.keys(config.providers);
  }
}

interface DisabledSnapshot {
  hash: string;
  store: DisabledStore;
}

/**
 * Reads `<models.json>.disabled`. A missing sidecar means nothing is disabled; any
 * other unreadable content (including an empty file, which would silently drop
 * entries already moved out of models.json) is a hard failure naming the file.
 */
async function readDisabledStore(path: string): Promise<DisabledSnapshot> {
  const source = await readDisabledSource(path);
  if (source === undefined) {
    return {
      hash: hashText(""),
      store: EMPTY_DISABLED_STORE,
    };
  }

  try {
    return {
      hash: hashText(source),
      store: parseDisabledStore(source),
    };
  } catch (error) {
    throw new Error(
      `Failed to read the disabled store ${path}: ${errorMessage(error)}`,
    );
  }
}

async function readDisabledHash(path: string): Promise<string> {
  return hashText((await readDisabledSource(path)) ?? "");
}

/** Writes the sidecar, or removes it when nothing is disabled. Returns its hash. */
async function writeDisabledStore(path: string, store: DisabledStore): Promise<string> {
  if (isEmptyDisabledStore(store)) {
    await rm(path, {
      force: true,
    });
    return hashText("");
  }

  const source = exportDisabledStore(store);
  await writeTextAtomically(path, source);

  return hashText(source);
}

async function readDisabledSource(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (isMissingFile(error)) return undefined;

    throw error;
  }
}

function isMissingFile(error: unknown): boolean {
  return isRecord(error) && error.code === "ENOENT";
}

function sendConfirmation(
  window: GlimpseWindow,
  action: "apply" | "confirm",
  message: string,
): void {
  postMessage(window, {
    action,
    message,
    type: "confirmation",
  });
}

function sendResult(window: GlimpseWindow, ok: boolean, message: string): void {
  postMessage(window, {
    type: "result",
    ok,
    message,
  });
}

function postMessage(window: GlimpseWindow, value: Record<string, unknown>): void {
  window.send(`window.postMessage(${JSON.stringify(value)}, "*")`);
}

function injectAppearance(window: GlimpseWindow, value: unknown): void {
  if (!isRecord(value) || !isRecord(value.appearance)) return;
  const appearance = value.appearance;
  window.send(
    `document.documentElement.style.setProperty("--primary", ${JSON.stringify(
      typeof appearance.accentColor === "string" ? appearance.accentColor : "#3B82F6",
    )});document.documentElement.dataset.theme=${JSON.stringify(
      appearance.darkMode ? "dark" : "light",
    )};document.documentElement.dataset.reduceMotion=${JSON.stringify(
      String(Boolean(appearance.reduceMotion)),
    )};document.documentElement.dataset.contrast=${JSON.stringify(
      String(Boolean(appearance.increaseContrast)),
    )};`,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}
