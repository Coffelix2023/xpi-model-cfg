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
  await writeTextAtomically(path, source);

  return {
    hash: hashText(source),
    path,
  };
}

/**
 * Replaces `path` with `source` in one rename, so a crash never leaves a
 * half-written file. Mode 0600 because sidecars can carry provider secrets.
 */
export async function writeTextAtomically(path: string, source: string): Promise<void> {
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
}
