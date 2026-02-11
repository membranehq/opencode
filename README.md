# Membrane OpenCode Fork

> This is Membrane's fork of [OpenCode](https://github.com/anomalyco/opencode).

The `membrane` branch is the source of truth for Membrane-specific changes.

For the original OpenCode project README, see:

- https://github.com/anomalyco/opencode/blob/dev/README.md

---

## Branch Strategy

- `membrane` - Main branch for Membrane work
- `main` / `dev` - Upstream-tracking branches synced from `anomalyco/opencode`

If you cloned this fork and landed on another branch, switch to `membrane` first:

```bash
git fetch origin
git checkout membrane
git pull origin membrane
```

---

## Sync with Upstream

```bash
bun run script/membrane-sync.ts          # sync from upstream/dev
bun run script/membrane-sync.ts --main   # sync from upstream/main

# then push
git push origin membrane
```

---

## Release Tags

Membrane releases use `membrane-v*` tags.

```bash
bun run script/membrane-release.ts 1.0.0
bun run script/membrane-release.ts 1.0.0 --build

git tag -l "membrane-*"
```

---

## How membrane/core Uses This Fork

`membrane/core/agent` builds and runs the OpenCode binary from this fork via `setup-opencode`.

See the `membrane/core` docs for the exact workflow and flags:

- https://github.com/membranehq/core/blob/main/agent/README.md#opencode-binary
