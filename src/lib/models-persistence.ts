import { randomUUID } from "node:crypto";
import { chmod, mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import {
  exportModelsConfigMirror,
  hashText,
  type ModelsConfig,
  validateModelsConfig,
} from "./models-config.ts";

export interface WriteModelsJsonResult {
  hash: string;
  path: string;
}

export async function writeModelsJsonAtomically(
  path: string,
  config: ModelsConfig,
): Promise<WriteModelsJsonResult> {
  validateModelsConfig(config);

  const source = exportModelsConfigMirror(config, "json");
  const dir = dirname(path);
  const tempPath = `${path}.tmp.${process.pid}.${randomUUID()}`;

  try {
    await mkdir(dir, {
      recursive: true,
    });
    await writeFile(tempPath, source, {
      mode: 0o600,
    });
    await chmod(tempPath, 0o600);
    await rename(tempPath, path);
    await chmod(path, 0o600);
  } catch (error) {
    await rm(tempPath, {
      force: true,
    });
    throw error;
  }

  return {
    hash: hashText(source),
    path,
  };
}
