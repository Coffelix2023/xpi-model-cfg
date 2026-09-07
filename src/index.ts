import { homedir } from "node:os";
import { join } from "node:path";

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { loadGlimpse } from "./ui/glimpse-runtime.ts";
import { runModelConfigPanel } from "./ui/model-config-workflow.ts";

interface Dependencies {
  loadGlimpse: typeof loadGlimpse;
}

const DEFAULT_DEPENDENCIES: Dependencies = {
  loadGlimpse,
};

export default function xpiModelCfg(
  pi: ExtensionAPI,
  dependencies: Dependencies = DEFAULT_DEPENDENCIES,
): void {
  pi.registerCommand("xpi-model-cfg", {
    description: "Edit the global Pi models configuration",
    handler: async (_args, ctx) => {
      try {
        const glimpse = await dependencies.loadGlimpse();
        if (!glimpse) {
          ctx.ui.notify("Glimpse unavailable; model config was not opened", "error");
          return;
        }

        const dir = join(homedir(), ".pi", "agent");
        await runModelConfigPanel({
          confirm: (title, message) => ctx.ui.confirm(title, message),
          glimpse,
          jsonPath: join(dir, "models.json"),
          yamlPath: join(dir, "models.yml"),
          notify: (message, level) => ctx.ui.notify(message, level),
        });
      } catch (error) {
        ctx.ui.notify(`xpi-model-cfg: ${errorMessage(error)}`, "error");
      }
    },
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}
