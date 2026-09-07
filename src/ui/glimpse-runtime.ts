import { homedir } from "node:os";
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

export async function loadGlimpse(
  importer: ImportModule = importModule,
): Promise<GlimpseModule | null> {
  try {
    const module = await importer("glimpseui");
    if (isGlimpseModule(module)) return module;
  } catch {
    // Fall back to the user-level Pi package.
  }

  const fallback = pathToFileURL(
    join(homedir(), ".pi/agent/npm/node_modules/glimpseui/src/glimpse.mjs"),
  ).href;
  try {
    const module = await importer(fallback);
    return isGlimpseModule(module) ? module : null;
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
