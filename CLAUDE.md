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
| `templates/` | `cwd()/.claude/` | everything (`*`) — all files are platform-managed |
| `templates-root/` | `cwd()/` (project root) | `.specify/extensions/git/scripts/**`, `.specify/extensions/git/commands/**`, `.specify/extensions/git/extension.yml` |

After the copy loop, `main()` runs two **CLAUDE.md injections** regardless of `--force`:

1. **`@.claude/maxi-setup.md` reference** — appended once if not already present; creates `CLAUDE.md` if it doesn't exist yet.
2. **Maintenance rule** — appended once if the marker `'Al terminar cualquier tarea'` is not found. Instructs Claude to update `CLAUDE.md` whenever the project architecture changes (new routes, modules, patterns, rules). Idempotent.

`processTemplates(srcDir, destDir, alwaysOverwritePrefixes)` does the following:

1. Walks `srcDir` recursively with `getAllFiles()` to get a flat list of files
2. For each file, computes the relative path from the source root and the corresponding target path under `destDir`
3. `NEVER_OVERWRITE` check (highest priority, beats `--force` and `'*'`): if the relative path is in the `NEVER_OVERWRITE` list and the target exists → logs `~  omitido` and skips
4. `alwaysOverwrite` check: true when `alwaysOverwritePrefixes === '*'`, OR the file is in the `ALWAYS_OVERWRITE` list, OR the relative path starts with one of the prefix strings
5. If `--force` is not set and `alwaysOverwrite` is false and the target exists → logs `~  omitido` and skips
6. Otherwise → creates parent directories with `mkdirSync({ recursive: true })`, copies the file, logs `+  copiado`
7. If `--dry-run` is set → steps 3–6 run without writing anything

**`alwaysOverwritePrefixes` values per call:**
- `templates/` → `.claude/`: called with `'*'` — todos los archivos de `.claude/` son de plataforma y siempre se actualizan sin `--force`
- `templates-root/` → `./`: called with `['.specify/extensions/git/scripts', '.specify/extensions/git/commands', '.specify/extensions/git/extension.yml']` — los scripts y comandos del git-extension siempre se actualizan; el resto solo se crea si no existe

### Templates

Both `templates/` and `templates-root/` are shipped with the package (listed in `files` in `package.json`).

#### `templates/` → `.claude/`

```
templates/
├── CLAUDE.md           ← instrucciones para Claude: verificar versión al inicio de sesión, verificar init de CLAUDE.md, tabla de docs de contexto (incluyendo .specify/memory/constitution.md)
├── docs/
│   ├── login.md        ← @maxi/login — Keycloak, token$, exported API, session patterns
│   ├── mwc.md          ← Maxi Web Components — full component reference, props, events
│   ├── root-config.md  ← root-config — routes, import maps, startup sequence, inter-app comms
│   ├── styleguide.md   ← @maxi/styleguide — component catalog, hooks, permission utilities, rules
│   ├── api.md          ← HTTP pattern: instance.js, validateToken, token$ interceptor, APP_CONFIG_*
│   └── state.md        ← Redux Toolkit in single-spa: store, permissions slice, usePermissions hook
├── settings.json
└── skills/
    └── speckit-*/SKILL.md   ← speckit-git-feature pregunta feat/fix antes de crear la rama y la nombra feat/NNN-nombre o fix/NNN-nombre
```

#### `templates-root/` → project root (`./`)

```
templates-root/
├── SETUP.md                          ← Guía de flujo de trabajo ZEUS (SpecKit, docs, versión)
└── .specify/                         ← Specify tool config, copied to root of the target project
    └── memory/
        └── constitution.md           ← Principios ZEUS pre-llenados (módulos, auth, controles, permisos)
```

**To add a new template file under `.claude/`:** drop it inside `templates/`. No code changes needed.

**To add a new file at the project root:** drop it inside `templates-root/`. No code changes needed.

**Files intentionally excluded from templates:** `settings.local.json` — project-specific, must never be overwritten.

**Files never overwritten by `processTemplates`:** `SETUP.md` and `.specify/memory/constitution.md` are in the `NEVER_OVERWRITE` list — created once and left alone on every subsequent run, even with `--force`.

**All other files in `templates/` always overwrite** on every `npx zeclio-setup-claude` run (no `--force` needed). This includes `skills/`, `maxi-setup.md`, `settings.json`, and `docs/`.

**CLAUDE.md is not a template file** — it is written/patched by the injection logic at the end of `main()`, not by `processTemplates()`. Adding content to `CLAUDE.md` requires editing the injection block in `zeclio-setup-claude.js`, not dropping a file in `templates-root/`.

**`memory/project-state.md` is not a template file either** — it is created once by the injection logic if it doesn't exist, and is never overwritten (not even with `--force`). Each project accumulates its own history there. Putting it in `templates/` would reset project-specific content on `--force` runs.

#### About `docs/`

The `docs/` folder contains context documents loaded by Claude Code when it opens a ZEUS microfrontend project. Each file documents a shared module Claude must understand before touching any app code:

| File | Covers |
|---|---|
| `login.md` | How to consume `@maxi/login`: `token$`, `validateToken`, `decodeJWT`, session patterns, rules |
| `mwc.md` | All `ms-*` / `Ms*` components: props, event names, refs, usage rules. Includes **⚠️ Excepciones ZEUS** section with mandatory patterns for single-spa + React 17: MsDialog lifecycle, `key` for conditional content, MsTable `size="small"`, MsTable `ms-table-actions` on clickable cells, MsTable numeric column alignment. |
| `root-config.md` | Registration flow, active routes, import maps per environment, cross-app communication |
| `styleguide.md` | Full component catalog, form helpers, date utilities, permission API, strict usage rules |
| `api.md` | HTTP service pattern: `instance.js` with interceptors, `validateToken`+`token$` for auth headers, `window.APP_CONFIG_*` for base URL, `logout()` on invalid token |
| `state.md` | Redux Toolkit in single-spa: isolated store per microfrontend, permissions slice, `usePermissions` hook, Provider setup, when to use Redux vs local state |

`maxi-setup.md` also points Claude to `.specify/memory/constitution.md` (at the project root), so Claude reads the project's governance principles in addition to the platform docs.

**Init check (Step 4):** `maxi-setup.md` also instructs Claude to read `CLAUDE.md` at session start and detect whether it has been initialized (i.e., contains `##` sections beyond the injected boilerplate). If not, Claude asks once whether the user wants to run `/init` before proceeding. This prevents silent degradation in projects where architecture was never documented.

### Flags

| Flag | Constant | Effect |
|---|---|---|
| `--force` | `FORCE` | Skips the exists-check, overwrites all files |
| `--dry-run` | `DRY_RUN` | Skips `mkdirSync` and `copyFileSync`, only logs |

Both are read from `process.argv` at module load time.

---

## Regla de mantenimiento

- **Al terminar cualquier tarea**, actualizar este archivo si algo cambió en la arquitectura del proyecto: nueva lógica de inyección en el script, nuevos archivos en templates, cambios en el flujo de sincronización, nuevas flags. No registrar cambios de contenido de docs — eso es responsabilidad del historial de git.

- **Al documentar una nueva excepción ZEUS en `mwc.md`**, replicarla siempre en `templates/docs/mwc.md` (este repo) y registrarla en la tabla de la sección 7 de `SETUP.md`. Las excepciones ZEUS son reglas obligatorias — deben viajar a todos los proyectos en el próximo `npx zeclio-setup-claude`.

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
