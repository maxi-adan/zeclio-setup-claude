# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## What this project is

`zeclio-setup-claude` is an npm CLI package published to the Maxi Nexus registry. It is a **bootstrapper** — it has no build step and no test suite. Running it copies a predefined set of template files into the `.claude/` folder of whatever directory the user runs it from.

The package has one main file: `zeclio-setup-claude.js`. Everything else (`bin/`, `templates/`, `templates-root/`, `package.json`) is packaging scaffolding.

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

`main()` calls `processTemplates()` twice — once per source directory:

| Source | Destination | Always overwrites |
|---|---|---|
| `templates/` | `cwd()/.claude/` | `docs/**` |
| `templates-root/` | `cwd()/` (project root) | nothing (skip if exists) |

`processTemplates(srcDir, destDir, alwaysOverwritePrefix)` does the following:

1. Walks `srcDir` recursively with `getAllFiles()` to get a flat list of files
2. For each file, computes the relative path from the source root and the corresponding target path under `destDir`
3. If `--force` is not set and `alwaysOverwritePrefix` doesn't match and the target exists → logs `~  omitido` and skips
4. Otherwise → creates parent directories with `mkdirSync({ recursive: true })`, copies the file, logs `+  copiado`
5. If `--dry-run` is set → steps 3–4 run without writing anything

**Special rule for `docs/`:** files under `templates/docs/` always overwrite the target — no `--force` needed. This ensures docs stay up to date every time `npx zeclio-setup-claude` runs.

### Templates

Both `templates/` and `templates-root/` are shipped with the package (listed in `files` in `package.json`).

#### `templates/` → `.claude/`

```
templates/
├── CLAUDE.md           ← instrucciones para Claude: verificar versión al inicio de sesión
├── docs/
│   ├── login.md        ← @maxi/login — Keycloak, token$, exported API, session patterns
│   ├── mwc.md          ← Maxi Web Components — full component reference, props, events
│   ├── root-config.md  ← root-config — routes, import maps, startup sequence, inter-app comms
│   └── styleguide.md   ← @maxi/styleguide — component catalog, hooks, permission utilities, rules
├── settings.json
└── skills/
    └── speckit-*/SKILL.md
```

#### `templates-root/` → project root (`./`)

```
templates-root/
└── .specify/           ← Specify tool config, copied to root of the target project
```

**To add a new template file under `.claude/`:** drop it inside `templates/`. No code changes needed.

**To add a new file at the project root:** drop it inside `templates-root/`. No code changes needed.

**Files intentionally excluded from templates:** `settings.local.json` — project-specific, must never be overwritten.

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

## Doc sync system

`docs/` files in this package are auto-synced from two source repos via their `npm run sync:docs` command:

| Source repo | Docs location | Notable doc |
|---|---|---|
| `maxi-libs/web-components` | `.claude/docs/` | `mwc.md` — auto-generated from Stencil component `readme.md` files on every `npm run build` |
| `ZEUS-Layout` | `.claude/docs/` | Docs maintained manually |

### Flow

1. Developer runs `npm run sync:docs` in either source repo
2. Script (`scripts/sync-docs.js`) uploads all `.md` files from `.claude/docs/` to `templates/docs/` in this repo via GitHub API and opens a PR
3. If a new doc appears that isn't referenced in `templates/maxi-setup.md`, the script adds it to the table automatically using the `description:` frontmatter field
4. PR is reviewed and merged
5. GitHub Action (`.github/workflows/publish-on-merge.yml`) detects changes in `templates/` → bumps patch version → publishes to Nexus
6. Projects run `npx zeclio-setup-claude` to pull the latest docs

The sync scripts use `GH_TOKEN` env var for authentication. See `SETUP.md` for token setup instructions.

---

## Registry

- **Publish target (hosted):** `https://artifacts.maxilabs.net/repository/maxi-npm-hosted/`
- **Consume (group/proxy):** `https://artifacts.maxilabs.net/repository/maxi-npm-group/`

The `publishConfig` in `package.json` points to the hosted registry. Users must have the group registry set in their local npm config to pull via `npx`.
