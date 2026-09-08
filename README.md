# xpi-model-cfg

**简体中文**: [README.zh-CN.md](./README.zh-CN.md)

> A lightweight, non-intrusive extension for the Pi Coding Agent (`pi-extension` / `pi-package`).

> No build step. Direct TypeScript source execution. Strict quality gates.

[Quickstart](#quickstart) · [Commands](#commands) · [Development](#development) · [Directory structure](#directory-structure) · [Design baseline](#design-baseline)

---

## What it is

**`@fx-pi/xpi-model-cfg`** is a Pi Coding Agent extension running inside the Pi main process.

Design principles:

- **No build step** — Pi loads `./src/index.ts` directly; no compilation artifacts (`dist/` or bundles) are committed.
- **Pi-native UI** — Uses `ctx.ui.*` and `@earendil-works/pi-tui` for rendering; never hijacks the terminal or installs conflicting terminal frameworks.
- **Zero heavy runtime dependencies** — Relies on host-provided APIs with strict type safety (`@sinclair/typebox`, TypeScript strict).
- **Strict quality gates** — TypeScript strict + Biome + Vitest; all three checks must pass before any commit.

## Tech stack

- [Node.js](https://nodejs.org/) + [pnpm](https://pnpm.io/), versions pinned in [`mise.toml`](./mise.toml)
- [Pi Coding Agent API](https://github.com/earendil-works/pi-coding-agent) (`@earendil-works/pi-coding-agent`, `@earendil-works/pi-tui`)
- TypeScript strict (`target: ES2024`, `module: NodeNext`)
- [Biome](https://biomejs.dev/) (lint + format)
- [Vitest](https://vitest.dev/) (test runner)

## Quickstart

### Environment

Install the pinned Node.js and pnpm versions with [mise](https://mise.jdx.dev/):

```bash
mise install
```

### Install dependencies

```bash
pnpm install
```

### Smoke test

Run a quick test loading the extension directly into Pi:

```bash
pi -e ./src/index.ts
```

### Local development

Symlink to your local Pi extensions directory for live testing:

```bash
ln -s "$(pwd)" ~/.pi/agent/extensions/xpi-model-cfg
```

Inside a running Pi session, use `/reload` to hot-reload the extension.

## Commands

| Command | Description |
| :--- | :--- |
| `/xpi-model-cfg` | Open the global Provider and Model editor |

## Configuration safety

The editor reads `~/.pi/agent/models.json` and automatically maintains `~/.pi/agent/models.yml` as a human-readable mirror. YAML is not an independent editing source and has no import action. The global JSON editor is intentionally omitted; structured provider and model fields are the editing surface. Thinking levels are controlled by `medium`, `high`, and `xhigh` checkboxes. Validate and Preview diff never write the JSON file.

**Apply** saves the configuration and keeps the editor open. **OK** saves the configuration and closes the editor. **Cancel** discards unapplied changes. Providers can be reordered by drag-and-drop or the up/down buttons, and providers and models can be added or removed. Deletions require a second confirmation and cancelling leaves the configuration unchanged. Each action requires an explicit confirmation inside the Glimpse panel; save confirmations include the redacted diff. Before either save action writes, the extension checks that `models.json` has not changed externally, creates `models.json.bak.<timestamp>` as the rollback safety valve, and atomically replaces the file with mode `0600`; the YAML mirror is then updated from the saved configuration. Literal API keys and `!command` references are masked in the panel and diff; environment-variable expressions remain visible but are never resolved or executed. Reload Pi after a successful apply.

## Development

| Command | Description |
| :--- | :--- |
| `pnpm typecheck` | `tsc --noEmit` — strict type check |
| `pnpm -w run lint` | Biome check across the repository |
| `pnpm test` | Vitest test runner (`vitest run --passWithNoTests`) |

All three gates (`typecheck`, `lint`, `test`) must pass before committing.

## Directory structure

```
.
├── mise.toml / package.json / biome.jsonc / tsconfig.json / pnpm-workspace.yaml
├── AGENTS.md / CONTEXT.md / DESIGN.md
├── docs/                      # Git workflow and repository guardrails
└── src/
    └── index.ts               # Extension entrypoint (register function)
```

## Design baseline

This project adopts the [Google Labs DESIGN.md format](https://github.com/google-labs-code/design.md) tailored for terminal TUI interfaces. See [`DESIGN.md`](./DESIGN.md) for terminal design tokens (colors, monospace typography, spacing, and component definitions).

## Conventions & constraints

- **Glossary** — [`CONTEXT.md`](./CONTEXT.md) defines the repository's unified terminology; terms must not drift in code, docs, or commits.
- **Git discipline** — Read [`docs/GIT-WORKFLOW.md`](./docs/GIT-WORKFLOW.md) and [`docs/GITHUB-GUARD.md`](./docs/GITHUB-GUARD.md) before committing or pushing. Do not push to `main` by default; use small, granular Conventional Commits.
- **Token safety** — Credentials and secret tokens are never written into code, logs, examples, or documentation.
