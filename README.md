# Membrane OpenCode Fork

> **This is Membrane's fork of [OpenCode](https://github.com/anomalyco/opencode).** The `membrane` branch is our source of truth.

## Important for Contributors

- Do Membrane work on the `membrane` branch (or topic branches cut from `membrane`).
- Treat `main` and `dev` as upstream-tracking branches, not the source of truth for this fork.
- If you cloned this repo and landed on another branch, switch to `membrane` before making Membrane-specific changes.

```bash
git fetch origin
git checkout membrane
git pull origin membrane
```

For original OpenCode documentation, see [upstream README](https://github.com/anomalyco/opencode#readme).

---

## Branch Strategy

- `membrane` - Our main branch with Membrane-specific changes
- `main`/`dev` - Synced from upstream (anomalyco/opencode)

---

## Scripts

### Sync with Upstream

```bash
bun run script/membrane-sync.ts          # Sync with upstream/dev
bun run script/membrane-sync.ts --main   # Sync with upstream/main (stable)

# Then push
git push origin membrane
```

### Create a Release

```bash
bun run script/membrane-release.ts 1.0.0           # Create tag membrane-v1.0.0
bun run script/membrane-release.ts 1.0.0 --build   # Create tag and build binary

# List existing tags
git tag -l "membrane-*"
```

### Build Binary

```bash
# Build for current platform (auto version)
bun run packages/opencode/script/build.ts --single

# Build with specific version
OPENCODE_VERSION=1.0.0-membrane bun run packages/opencode/script/build.ts --single
```

---

## Usage in membrane/core

The `membrane/core` agent uses setup script to build from this fork:

```bash
cd membrane/core/agent
bun run setup-opencode           # Build binary (if needed)
bun run setup-opencode --update  # Pull latest and rebuild
bun run setup-opencode --force   # Force rebuild
bun run opencode                 # Run the binary
```
