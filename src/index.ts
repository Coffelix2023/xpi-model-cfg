import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const VERSION = "0.1.0";

export default function xpiModelCfg(pi: ExtensionAPI): void {
  pi.registerCommand("xpi-model-cfg", {
    description: "Show xpi-model-cfg status",
    handler: async (_args, ctx) => {
      ctx.ui.notify(`xpi-model-cfg ${VERSION} loaded`);
    },
  });
}
