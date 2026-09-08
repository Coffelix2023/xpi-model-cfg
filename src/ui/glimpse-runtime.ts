import { chmodSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

interface GlimpseEventMap {
  closed: [];
  error: [
    error: Error,
  ];
  message: [
    message: unknown,
  ];
  ready: [
    info: unknown,
  ];
}

export interface GlimpseWindow {
  close(): void;
  on<Event extends keyof GlimpseEventMap>(
    event: Event,
    listener: (...args: GlimpseEventMap[Event]) => void,
  ): void;
  send(source: string): void;
}

export interface GlimpseModule {
  open(html: string, options?: Record<string, unknown>): GlimpseWindow;
}

type ImportModule = (specifier: string) => Promise<unknown>;

const importModule: ImportModule = (specifier) => import(specifier);

const FALLBACK_DIR = join(homedir(), ".pi/agent/npm/node_modules/glimpseui/src");
const FALLBACK_MODULE_URL = pathToFileURL(join(FALLBACK_DIR, "glimpse.mjs")).href;
const FALLBACK_BINARY = join(FALLBACK_DIR, "glimpse");

// glimpseui spawns the native binary with stderr inherited, so macOS
// InputMethodKit noise (e.g. "error messaging the mach port for IMKC...")
// leaks into the Pi editor. Route the binary through a wrapper that
// redirects stderr to a log file instead.
export function buildWrapperScript(realBinary: string, logPath: string): string {
  return `#!/bin/sh\nexec "${realBinary}" "$@" 2>>"${logPath}"\n`;
}

function quietGlimpseStderr(): string | null {
  if (process.platform !== "darwin") return null;
  if (process.env.GLIMPSE_BINARY_PATH || process.env.GLIMPSE_HOST_PATH) return null;
  if (!existsSync(FALLBACK_BINARY)) return null;
  const dir = join(tmpdir(), "xpi-model-cfg");
  const wrapper = join(dir, "glimpse-quiet.sh");
  mkdirSync(dir, {
    recursive: true,
  });
  writeFileSync(
    wrapper,
    buildWrapperScript(FALLBACK_BINARY, join(dir, "glimpse-stderr.log")),
  );
  chmodSync(wrapper, 0o755);
  return wrapper;
}

export function wrapGlimpse(
  module: GlimpseModule,
  wrapper: string | null,
): GlimpseModule {
  if (!wrapper) return module;
  return {
    ...module,
    open(html, options) {
      const previous = process.env.GLIMPSE_BINARY_PATH;
      process.env.GLIMPSE_BINARY_PATH = wrapper;
      try {
        return module.open(html, options);
      } finally {
        if (previous === undefined) delete process.env.GLIMPSE_BINARY_PATH;
        else process.env.GLIMPSE_BINARY_PATH = previous;
      }
    },
  };
}

export async function loadGlimpse(
  importer: ImportModule = importModule,
): Promise<GlimpseModule | null> {
  const wrapper = quietGlimpseStderr();
  try {
    const module = await importer("glimpseui");
    if (isGlimpseModule(module)) return wrapGlimpse(module, wrapper);
  } catch {
    // Fall back to the user-level Pi package.
  }

  try {
    const module = await importer(FALLBACK_MODULE_URL);
    return isGlimpseModule(module) ? wrapGlimpse(module, wrapper) : null;
  } catch {
    return null;
  }
}

function isGlimpseModule(value: unknown): value is GlimpseModule {
  return (
    typeof value === "object" &&
    value !== null &&
    "open" in value &&
    typeof value.open === "function"
  );
}
