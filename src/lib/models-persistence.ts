import { randomUUID } from "node:crypto";
import {
  chmod,
  copyFile,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname } from "node:path";

import {
  exportModelsConfigMirror,
  hashText,
  type ModelsConfig,
  validateModelsConfig,
} from "./models-config.ts";

export interface WriteModelsJsonResult {
  backupPath?: string;
  hash: string;
  path: string;
}

export async function writeModelsJsonAtomically(
  path: string,
  config: ModelsConfig,
  now = new Date(),
): Promise<WriteModelsJsonResult> {
  validateModelsConfig(config);

  const source = exportModelsConfigMirror(config, "json");
  const dir = dirname(path);
  const tempPath = `${path}.tmp.${process.pid}.${randomUUID()}`;
  const backupPath = await backupExistingFile(path, now);

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
    backupPath,
    hash: hashText(source),
    path,
  };
}

async function backupExistingFile(
  path: string,
  now: Date,
): Promise<string | undefined> {
  try {
    await readFile(path);
  } catch (error) {
    if (isNotFound(error)) {
      return undefined;
    }

    throw error;
  }

  const backupPath = `${path}.bak.${formatBackupTimestamp(now)}`;
  await copyFile(path, backupPath);
  await chmod(backupPath, 0o600);
  return backupPath;
}

function formatBackupTimestamp(value: Date): string {
  return value.toISOString().replace(/[-:.]/g, "");
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
