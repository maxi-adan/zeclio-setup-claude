# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## What this project is

`zeclio-setup-claude` is an npm CLI package published to the Maxi Nexus registry. It is a **bootstrapper** — it has no build step and no test suite. Running it copies a predefined set of template files into the `.claude/` folder of whatever directory the user runs it from.

The package has one main file: `zeclio-setup-claude.js`. Everything else (`bin/`, `templates/`, `package.json`) is packaging scaffolding.

## Commands

### Publish a new version

Use `publish.js`:

```sh
node publish.js
```

It prompts for version type (`patch` / `minor` / `major`), runs `npm version <type> --no-git-tag-version` to update `package.json`, then publishes to the Nexus hosted registry.

The `--no-git-tag-version` flag is required because npm version by default attempts to create a git commit and tag, which fails when the working directory has uncommitted changes.

### Test locally before publishing

Run from any directory where you want to test the output:

```sh
node /path/to/zeclio-setup-claude.js
node /path/to/zeclio-setup-claude.js --force
node /path/to/zeclio-setup-claude.js --dry-run
```

---

## Architecture

### Entry points

- `bin/zeclio-setup-claude` — Unix shebang, delegates to `zeclio-setup-claude.js`
- `bin/zeclio-setup-claude.cmd` — Windows CMD wrapper that calls `node` explicitly
- `zeclio-setup-claude.js` — all CLI and copy logic, self-contained

### Copy flow (`zeclio-setup-claude.js`)

`main()` does the following in order:

1. Resolves `TEMPLATES_DIR` (`__dirname/templates/`) and `TARGET_DIR` (`cwd()/.claude/`)
2. Walks `TEMPLATES_DIR` recursively with `getAllFiles()` to get a flat list of all template files
3. For each file, computes the relative path from the templates root and the corresponding target path under `.claude/`
4. If `--force` is not set and the target file already exists → logs `~  omitido` and skips
5. Otherwise → creates parent directories with `mkdirSync({ recursive: true })`, copies the file, logs `+  copiado`
6. If `--dry-run` is set → steps 4–5 run without writing anything

### Templates

All files under `templates/` are shipped with the package (listed in `files` in `package.json`). The directory structure inside `templates/` maps 1:1 to what gets written under `.claude/`.

```
templates/
├── CLAUDE.md           ← instrucciones para Claude: verificar versión al inicio de sesión
├── agents/README.md
├── commands/
│   ├── agents/README.md
│   ├── mcp/README.md
│   ├── scripts/README.md
│   └── skills/README.md
├── docs/
│   ├── login.md        ← @maxi/login — Keycloak, token$, exported API, session patterns
│   ├── mwc.md          ← Maxi Web Components — full component reference, props, events
│   ├── root-config.md  ← root-config — routes, import maps, startup sequence, inter-app comms
│   └── styleguide.md   ← @maxi/styleguide — component catalog, hooks, permission utilities, rules
├── mcp/README.md
└── scripts/README.md
```

**To add a new template file:** drop it anywhere inside `templates/` following the desired target path. No code changes needed — `getAllFiles()` walks the tree dynamically.

**Files intentionally excluded from templates:** `settings.json`, `settings.local.json` — these are project-specific and must never be overwritten by the bootstrapper.

#### About `docs/`

The `docs/` folder contains context documents loaded by Claude Code when it opens a ZEUS microfrontend project. Each file documents a shared module Claude must understand before touching any app code:

| File | Covers |
|---|---|
| `login.md` | How to consume `@maxi/login`: `token$`, `validateToken`, `decodeJWT`, session patterns, rules |
| `mwc.md` | All `ms-*` / `Ms*` components: props, event names, refs, usage rules |
| `root-config.md` | Registration flow, active routes, import maps per environment, cross-app communication |
| `styleguide.md` | Full component catalog, form helpers, date utilities, permission API, strict usage rules |

### Flags

| Flag | Constant | Effect |
|---|---|---|
| `--force` | `FORCE` | Skips the exists-check, overwrites all files |
| `--dry-run` | `DRY_RUN` | Skips `mkdirSync` and `copyFileSync`, only logs |

Both are read from `process.argv` at module load time.

---

## Registry

- **Publish target (hosted):** `https://artifacts.maxilabs.net/repository/maxi-npm-hosted/`
- **Consume (group/proxy):** `https://artifacts.maxilabs.net/repository/maxi-npm-group/`

The `publishConfig` in `package.json` points to the hosted registry. Users must have the group registry set in their local npm config to pull via `npx`.
