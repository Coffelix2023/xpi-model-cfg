import { readFile, writeFile } from "node:fs/promises";

import {
  buildApplyPreview,
  exportModelsConfigMirror,
  hashText,
  type ModelsConfig,
  parseModelsConfig,
  redactModelsConfig,
} from "../lib/models-config.ts";
import { writeModelsJsonAtomically } from "../lib/models-persistence.ts";
import type { GlimpseModule, GlimpseWindow } from "./glimpse-runtime.ts";
import { buildModelConfigPanelHtml, parsePanelConfig } from "./model-config-panel.ts";

interface RunModelConfigPanelOptions {
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
}

export async function runModelConfigPanel(
  options: RunModelConfigPanelOptions,
): Promise<GlimpseWindow> {
  const baselineSource = await readFile(options.jsonPath, "utf8");
  let baselineHash = hashText(baselineSource);
  let sourceConfig = parseModelsConfig(baselineSource, "json");
  await writeFile(options.yamlPath, exportModelsConfigMirror(sourceConfig, "yaml"), {
    mode: 0o600,
  });

  const window = options.glimpse.open(buildModelConfigPanelHtml(sourceConfig), {
    frameless: false,
    height: 680,
    title: "xpi-model-cfg",
    width: 980,
  });
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
    if (message.action === "validate") {
      sendResult(window, true, "配置有效");
      return;
    }

    const currentSource = await readFile(options.jsonPath, "utf8");
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
      const result = await writeModelsJsonAtomically(options.jsonPath, nextConfig);
      await writeFile(options.yamlPath, exportModelsConfigMirror(nextConfig, "yaml"), {
        mode: 0o600,
      });
      sourceConfig = nextConfig;
      baselineHash = hashText(await readFile(options.jsonPath, "utf8"));
      sendConfig(window, sourceConfig);
      sendResult(window, true, `已应用；备份：${result.backupPath ?? "无"}`);
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
      };
    default:
      throw new Error("Unknown panel action");
  }
}

function validateConfigInput(value: unknown): ModelsConfig {
  if (!isRecord(value)) throw new Error("Panel message is missing config");
  return parseModelsConfig(JSON.stringify(value), "json");
}

function sendConfig(window: GlimpseWindow, config: ModelsConfig): void {
  postMessage(window, {
    config: redactModelsConfig(config),
    type: "config",
  });
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
