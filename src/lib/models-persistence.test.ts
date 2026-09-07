import { mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { parseModelsConfig } from "./models-config.ts";
import { writeModelsJsonAtomically } from "./models-persistence.ts";

const _INVALID_PROVIDERS_ERROR = /providers/i;
describe("models config persistence", () => {
  it("backs up the old file, writes mode 0600 temp content, and leaves parseable JSON", async () => {
    const dir = await mkdtemp(join(tmpdir(), "xpi-model-cfg-"));
    const file = join(dir, "models.json");
    await writeFile(file, '{"providers":{"old":{"models":[{"id":"old-model"}]}}}\n', {
      mode: 0o600,
    });

    const result = await writeModelsJsonAtomically(
      file,
      parseModelsConfig(
        '{"providers":{"new":{"models":[{"id":"new-model"}]}}}',
        "json",
      ),
      new Date("2026-09-08T00:00:00.000Z"),
    );

    expect(result.backupPath).toBe(`${file}.bak.20260908T000000000Z`);
    expect(result.backupPath).toBeDefined();
    expect(
      parseModelsConfig(await readFile(file, "utf8"), "json").providers.new?.models?.[0]
        ?.id,
    ).toBe("new-model");
    expect(
      parseModelsConfig(await readFile(String(result.backupPath), "utf8"), "json")
        .providers.old?.models?.[0]?.id,
    ).toBe("old-model");

    if (process.platform !== "win32") {
      expect((await stat(file)).mode & 0o777).toBe(0o600);
    }
  });

  it("keeps the original file when validation fails", async () => {
    const dir = await mkdtemp(join(tmpdir(), "xpi-model-cfg-"));
    const file = join(dir, "models.json");
    const original = '{"providers":{"old":{"models":[{"id":"old-model"}]}}}\n';
    await writeFile(file, original, {
      mode: 0o600,
    });

    await expect(
      writeModelsJsonAtomically(file, {
        providers: [],
      } as never),
    ).rejects.toThrow(_INVALID_PROVIDERS_ERROR);

    expect(await readFile(file, "utf8")).toBe(original);
  });
});
