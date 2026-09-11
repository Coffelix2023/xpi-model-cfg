# xpi-model-cfg

**English** · [简体中文](./README.zh-CN.md)

**A Pi Coding Agent extension that turns Pi's `models.json` into a clickable panel — it shows only the `compat` switches that matter for the selected `api`, and preserves unknown keys on write-back.**

**一个把 Pi 的 `models.json` 变成可点可改面板的 Pi Coding Agent 扩展 —— 按当前 `api` 类型只显示相关的 `compat` 开关,写回时逐字保留你手写的未知键。**

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)

```text
> /xpi-model-cfg
```

## Why

`~/.pi/agent/models.json` is hand-written: one bad indent, one misremembered `compat` key, or one confused `cost` unit silently changes how a model behaves — and Pi's `/model` can only read it, never edit it.

This extension replaces hand-editing with a native window. The panel groups fields by the provider's `api`, and shows only what that API actually reads — so wiring up an Anthropic Messages-compatible proxy no longer means memorising `supportsEagerToolInputStreaming`, `forceAdaptiveThinking`, and `allowEmptySignature` first. Boolean switches are tri-state: picking `Default` deletes the key and hands the decision back to Pi's auto-detection and built-in defaults instead of hard-coding an override.

Every extension in this repository starts from the same four rules:

- **No build step.** Pi loads `./src/index.ts` directly. No `dist/`, no bundler, no committed artifacts.
- **Host-native UI.** Feedback that belongs in the terminal goes through `ctx.ui.*`; the config panel is a native Glimpse window. It never hijacks the terminal or pulls in a competing terminal framework.
- **No heavy runtime dependencies.** The only runtime dependency is `yaml`; everything else is host-provided APIs plus strict types.
- **Strict gates, no exceptions.** TypeScript strict, Biome, and Vitest must all pass before any commit.

It also stays inside its lane: an extension is a plugin loaded into the Pi main process, not a separate service. The one process boundary it opens is the native window Glimpse spawns, managed in a single place by `src/ui/glimpse-runtime.ts`.

## Tech stack

- [Node.js](https://nodejs.org/) + [pnpm](https://pnpm.io/), versions pinned in [`mise.toml`](./mise.toml)
- [Pi Coding Agent](https://github.com/earendil-works/pi) — the host, its extension API, and the package manifest format
- [Glimpse](https://github.com/hazat/glimpse) (`glimpseui`) — native rendering for the panel window
- [yaml](https://eemeli.org/yaml/) — the only runtime dependency, used for the `models.yml` mirror
- TypeScript strict (`target: ES2024`, `module: NodeNext`)
- [Biome](https://biomejs.dev/) for lint and format
- [Vitest](https://vitest.dev/) as the test runner

`@earendil-works/pi-tui` and `typebox` are declared as optional peer dependencies in `package.json`, but nothing in `src/` imports them: this extension registers no tools, and its rendering does not go through pi-tui.

## Install

Requires a working Pi installation, plus Glimpse available to open a native window. The package is loaded straight from source, so there is nothing to build first.

```bash
pi install git:github.com/Coffelix2023/xpi-model-cfg@main
```

| Where | Command |
| --- | --- |
| Global (user settings) | `pi install git:github.com/Coffelix2023/xpi-model-cfg@main` |
| This project only (`.pi/settings.json`) | `pi install -l git:github.com/Coffelix2023/xpi-model-cfg@main` |

`pi install` writes to `~/.pi/agent/settings.json`; `-l` writes to the project settings, which Pi installs automatically once the project is trusted. The commands above point at `main`, which `pi update` will move — switch to a specific commit or tag when you need a reproducible version.

```bash
pi list                              # installed packages
pi update --extensions               # update packages and reconcile pinned refs
pi remove git:github.com/Coffelix2023/xpi-model-cfg
```

Package-level debugging uses npm or git remote sources on purpose: a local-path install only records a reference to your working copy and leaves a stale entry in settings the moment you forget to `pi remove` it.

## Usage

| Command | Description |
| --- | --- |
| `/xpi-model-cfg` | Open the global Provider and Model editor |

### What it edits

- **Providers** — `id`, `api`, `baseUrl`, `apiKey`, `headers`, `authHeader`, plus the `compat` switches for the selected `api`. Reorder by drag-and-drop or the up/down buttons; add and remove freely.
- **Models** — `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, input types (`text` / `image`), thinking levels (`medium` / `high` / `xhigh`), and `cost`.
- **`compat`** — with `api: openai-completions` the panel shows `maxTokensField` and `supportsUsageInStreaming`; with `api: anthropic-messages` it shows `supportsEagerToolInputStreaming`, `supportsLongCacheRetention`, `forceAdaptiveThinking`, and `allowEmptySignature`. Boolean switches are tri-state (`Default` / `true` / `false`), and picking `Default` writes no key at all. No other `api` value shows a `compat` group.

### Write and safety boundaries

- It edits `~/.pi/agent/models.json` and maintains two sidecars: `models.yml` (a human-readable mirror) and `models.json.order` (the provider order this extension remembers). YAML is not an independent editing source and has no import action; no `.bak.*` files are created.
- Before writing, it verifies that `models.json` has not changed externally and refuses to write if it has. Once that check passes, it atomically replaces the file with mode `0600`.
- Literal API keys and `!command` references are masked in the panel and in the diff; `$VAR` / `${VAR}` environment expressions stay verbatim and are never resolved or executed.
- `compat` is written back as a **merge**: keys belonging to a hidden group, and keys this panel never shows such as `openRouterRouting`, survive byte-for-byte.
- Model `cost` values are stored in CNY per 1M tokens; choosing USD only converts the display and converts back on save.
- **Validate** and **Preview diff** never write files. **Apply** saves and keeps the window open, **OK** saves and closes it, and **Cancel** discards unapplied changes. Deletions and saves each require one explicit confirmation inside the panel, and save confirmations include the redacted diff.
- This extension registers no tools and no hooks, and it will not reload your model list for you: reload Pi after a successful apply.

## Development

```bash
mise install                         # pinned Node.js and pnpm
pnpm install
```

| Gate | Command |
| --- | --- |
| Types | `pnpm typecheck` — `tsc --noEmit` |
| Lint and format | `pnpm -w run lint` — Biome across the repository |
| Tests | `pnpm test` — Vitest (`vitest run --passWithNoTests`) |

All three must pass before committing. Run `pnpm -w run lint` explicitly at the workspace root; the wrapper occasionally misreads a bare `pnpm run lint` as an unknown recursive command.

Two ways to run the extension while working on it:

```bash
pi -e ./src/index.ts                 # smoke test: load once, current run only
```

```bash
ln -s "$(pwd)" ~/.pi/agent/extensions/xpi-model-cfg   # live loop: /reload inside Pi
```

`pi -e` writes nothing to settings; the symlink is picked up from the extensions directory and is removed with `rm`.

## Directory structure

```text
.
├── mise.toml / package.json / biome.jsonc / tsconfig.json / pnpm-workspace.yaml
├── AGENTS.md / CONTEXT.md / DESIGN.md
├── README.md / README.zh-CN.md
├── docs/                            # Git workflow and repository guardrails
└── src/
    ├── index.ts                     # Extension entrypoint (register function), registers /xpi-model-cfg
    ├── lib/
    │   ├── models-config.ts         # Types, validation, redaction, apply-time diff preview
    │   └── models-persistence.ts    # Atomic writes to models.json
    └── ui/
        ├── glimpse-runtime.ts       # Dynamic Glimpse loading, muzzles macOS native stderr
        ├── model-config-panel.ts    # Panel HTML and its inline script
        └── model-config-workflow.ts # Panel message loop and write orchestration
```

## Design baseline

This project adopts the [Google Labs DESIGN.md format](https://github.com/google-labs-code/design.md) tailored for terminal TUI interfaces. See [`DESIGN.md`](./DESIGN.md) for the design tokens (colors, monospace typography, spacing, and component definitions).

## Conventions & constraints

- **Glossary** — [`CONTEXT.md`](./CONTEXT.md) defines the repository's unified terminology; terms must not drift in code, docs, or commits.
- **Git discipline** — Read [`docs/GIT-WORKFLOW.md`](./docs/GIT-WORKFLOW.md) and [`docs/GITHUB-GUARD.md`](./docs/GITHUB-GUARD.md) before committing or pushing. Do not push to `main` by default; use small, granular Conventional Commits.
- **Token safety** — credentials and secret tokens are never written into code, logs, examples, or documentation.
- **Agent contract** — [`AGENTS.md`](./AGENTS.md) is the single source of truth for this repository. When an oral agreement, older code, or this README disagrees with it, `AGENTS.md` wins.

## Credits

- [Pi Coding Agent](https://github.com/earendil-works/pi) by [earendil-works](https://github.com/earendil-works) — the host this extension plugs into. The extension API, the `ctx.ui` contract, and the package manifest format are theirs.
- [Glimpse](https://github.com/hazat/glimpse) — rendering and native process management for the panel window. This extension loads it dynamically and falls back to the copy bundled with the user-level Pi packages; when neither is available the command fails with an error instead of degrading silently.

## License

MIT. This repository does not yet ship a `LICENSE` file; `package.json` declares `"license": "MIT"`.
