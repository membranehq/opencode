# Membrane OpenCode Fork - Agent Notes

## Fork Context

- This repository is Membrane's fork of OpenCode.
- `membrane` is the source-of-truth branch for Membrane-specific work.
- `main` and `dev` are kept in sync with upstream (`anomalyco/opencode`) and used as upstream tracking branches.

## Branch Workflow

- Start Membrane work from `origin/membrane`.
- Keep changes scoped on short-lived topic branches (for example: `membrane/fix-*`, `membrane/feat-*`).
- Merge or cherry-pick finished fixes back into `membrane`.
- To sync upstream changes into Membrane branch, use:
  - `bun run script/membrane-sync.ts` (sync from upstream `dev`)
  - `bun run script/membrane-sync.ts --main` (sync from upstream `main`)
- Release tags use the `membrane-v*` format (for example: `membrane-v1.0.0`).

## Build and Test

- To test OpenCode in `packages/opencode`, run `bun dev`.
- To regenerate the JavaScript SDK, run `./packages/sdk/js/script/build.ts`.

## How membrane/core Consumes This Fork

- `membrane/core/agent` builds the OpenCode binary from this fork via `setup-opencode`.
- Cached clone path: `~/.membrane/opencode/`.
- The core agent can target a specific release tag with `bun run setup-opencode --version membrane-vX.Y.Z`.

## Working Rules

- ALWAYS USE PARALLEL TOOLS WHEN APPLICABLE.
- Prefer Bun tooling for scripts and runtime commands.

## Fork Reminder (Append-Only)

- This fork's source branch is `membrane`.
- Start Membrane-specific work from `origin/membrane`.
- `main` and `dev` are upstream-tracking branches and may be overwritten by sync.
- Keep this reminder block at the bottom so upstream syncs are low-conflict.
