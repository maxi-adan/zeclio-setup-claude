# Setup Guide — Sistema de docs sincronizados

Este documento cubre todo lo necesario para que el flujo de sincronización de documentos funcione correctamente entre `maxi-libs/web-components` y `zeclio-setup-claude`.

---

## Cómo funciona el sistema

```
┌─────────────────────────────────┐     ┌─────────────────────────────────────────────┐
│   maxi-libs/web-components      │     │   ZEUS-Layout                               │
│                                 │     │                                             │
│  Editas componente              │     │  Editas docs manualmente                   │
│  → npm run build                │     │  (.claude/docs/*.md)                        │
│    genera mwc.md automático     │     │                                             │
│                                 │     │  Docs actuales:                             │
│  Docs actuales:                 │     │    login.md, root-config.md, styleguide.md  │
│    mwc.md                       │     │    api.md, state.md                         │
│                                 │     │                                             │
│  → npm run sync:docs            │     │  → npm run sync:docs                        │
└──────────────┬──────────────────┘     └───────────────┬─────────────────────────────┘
               │                                        │
               └──────────────────┬─────────────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │   zeclio-setup-claude (GitHub) │
                  │                               │
                  │  PR creado automáticamente    │
                  │  con los docs actualizados    │
                  │                               │
                  │  Al mergear:                  │
                  │  → GitHub Action se dispara   │
                  │  → bumpa versión en           │
                  │    package.json               │
                  │  → publica a Nexus            │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │   Nexus (npm registry)        │
                  │                               │
                  │  Nueva versión disponible     │
                  │  zeclio-setup-claude@x.x.x    │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │   Proyectos microfrontend     │
                  │                               │
                  │  npx zeclio-setup-claude      │
                  │                               │
                  │  docs/*.md   → siempre        │
                  │               actualizados    │
                  │  otros       → solo si no     │
                  │  archivos      existen        │
                  └───────────────────────────────┘
```

---

## 1. Instalar GitHub CLI (`gh`)

**Windows:**

```powershell
winget install --id GitHub.cli
```

**Mac:**

```bash
brew install gh
```

> Si usas una terminal interna de un IDE (como Antigravity) que no hereda el PATH del sistema, el script lo resuelve automáticamente — no necesitas hacer nada extra.

---

## 2. Autenticación — token de GitHub

Los scripts usan la variable de entorno `GH_TOKEN`. `gh` CLI la detecta automáticamente — no necesitas correr `gh auth login`.

### Para el admin (una sola vez)

**1.** Ve a: `https://github.com/settings/personal-access-tokens/new`

**2.** Completa el formulario:

| Campo | Valor |
|---|---|
| Token name | `zeclio-sync-docs` (o el nombre que prefieras) |
| Expiration | El tiempo que necesites (ej. 1 year) |
| Resource owner | `maxi-adan` |

**3.** En **Repository access** selecciona:
- `Only select repositories`
- Busca y selecciona: `maxi-adan/zeclio-setup-claude`

**4.** En **Permissions** expande `Repository permissions` y configura:

| Permiso | Valor |
|---|---|
| Contents | `Read and write` |
| Pull requests | `Read and write` |

El resto déjalo en `No access`.

**5.** Clic en **Generate token** → copia el token (`github_pat_...`) que aparece. Solo se muestra una vez.

**6.** Comparte ese token con el equipo de forma segura (no por chat).

---

### Para cada integrante del equipo (una sola vez por máquina)

#### Windows

**1. Abre PowerShell y ejecuta:**

```powershell
Add-Content $PROFILE "`n`$env:GH_TOKEN = 'github_pat_xxxx...'"
```

Reemplaza `github_pat_xxxx...` con el token que te compartió el admin.

**2. Recarga el perfil para aplicarlo en la sesión actual:**

```powershell
. $PROFILE
```

**3. Verifica que funciona:**

```powershell
gh api repos/maxi-adan/zeclio-setup-claude --jq ".name"
```

Debe responder `zeclio-setup-claude`. Si es así, ya puedes correr `npm run sync:docs`.

> El token queda guardado permanentemente en tu perfil de PowerShell. En futuras sesiones se carga automáticamente.

#### Mac

**1. Abre Terminal y ejecuta:**

```bash
echo '\nexport GH_TOKEN="github_pat_xxxx..."' >> ~/.zshrc
```

Reemplaza `github_pat_xxxx...` con el token que te compartió el admin.

> Si usas bash en lugar de zsh, cambia `~/.zshrc` por `~/.bash_profile`.

**2. Recarga el perfil para aplicarlo en la sesión actual:**

```bash
source ~/.zshrc
```

**3. Verifica que funciona:**

```bash
gh api repos/maxi-adan/zeclio-setup-claude --jq ".name"
```

Debe responder `zeclio-setup-claude`. Si es así, ya puedes correr `npm run sync:docs`.

> El token queda guardado permanentemente en tu perfil de shell. En futuras sesiones se carga automáticamente.

---

## 3. Secret `NEXUS_TOKEN` en zeclio-setup-claude

La GitHub Action necesita este secret para publicar a Nexus. Solo el admin lo configura una vez.

```
github.com/maxi-adan/zeclio-setup-claude → Settings → Secrets and variables → Actions
  → New repository secret
  → Name: NEXUS_TOKEN
  → Value: token de Nexus (el _authToken de tu .npmrc)
```

---

## 4. Flujo de trabajo diario

### Generar y sincronizar docs

Desde `maxi-libs/web-components/core/`:

```powershell
# Genera mwc.md automáticamente (y cualquier otro doc que genere el build)
npm run build

# Sube todos los .md de .claude/docs/ y abre un PR en zeclio-setup-claude
npm run sync:docs
```

### Qué hace `sync:docs`

1. Sube todos los archivos `.md` de `.claude/docs/` a `templates/docs/` en `zeclio-setup-claude`
2. Si hay archivos nuevos que no están referenciados en `maxi-setup.md`, los agrega automáticamente a la tabla
3. Abre un PR con la lista de archivos actualizados

### Después del PR

1. Alguien revisa y mergea el PR en `zeclio-setup-claude`
2. La GitHub Action detecta el cambio en `templates/` y se dispara automáticamente
3. Bumpa la versión patch en `package.json` y publica a Nexus
4. Los proyectos actualizan con:
   ```powershell
   npx zeclio-setup-claude
   ```
   > Los `docs/*.md` se sobreescriben automáticamente. El resto de archivos se omite si ya existen.

---

## 5. Actualizar templates de proyecto (SETUP.md, constitution, inyecciones)

Además de los docs, el script distribuye otros archivos y lógica que también deben mantenerse al día.

### `templates-root/SETUP.md`

Guía de flujo de trabajo que se crea en la raíz de cada proyecto nuevo. Para actualizarla:

1. Edita `templates-root/SETUP.md` en este repo directamente.
2. El cambio llega a proyectos nuevos en el próximo `npx zeclio-setup-claude`.
3. Proyectos existentes **no se actualizan automáticamente** — `SETUP.md` nunca se sobreescribe. Si el cambio es crítico, notifica al equipo para que corra `npx zeclio-setup-claude --force`.

### `templates-root/.specify/memory/constitution.md`

Principios ZEUS que SpecKit usa como gate de calidad en `/speckit-plan` y `/speckit-implement`. Para actualizarla:

1. Edita `templates-root/.specify/memory/constitution.md` en este repo.
2. Mismo comportamiento que `SETUP.md`: solo llega a proyectos nuevos o con `--force`.

### Inyecciones en `CLAUDE.md` (lógica en el script)

Las inyecciones en `CLAUDE.md` están hardcodeadas en `zeclio-setup-claude.js`. Para agregar una nueva inyección:

1. Edita el bloque `if (!DRY_RUN)` al final de `main()` en `zeclio-setup-claude.js`.
2. Sigue el patrón existente: define un **marker único** para idempotencia, define el **texto a inyectar**, verifica si el marker ya está presente antes de escribir.
3. Estas inyecciones **sí corren en cada ejecución** (con o sin `--force`) — la idempotencia la garantiza el marker.

---

## 6. Agregar un nuevo doc de plataforma

Los docs se crean en el repo fuente según su naturaleza:

| Tipo de doc | Repo fuente | Cómo se genera |
|---|---|---|
| Docs de componentes `ms-*` | `maxi-libs/web-components` | Auto-generado por `npm run build` a partir de los `readme.md` de Stencil |
| Docs de plataforma ZEUS (auth, rutas, HTTP, estado) | `ZEUS-Layout` | Redactado y mantenido manualmente en `.claude/docs/` |

**Desde cualquiera de los dos repos:**

1. Crea o edita el `.md` en `.claude/docs/` dentro del repo correspondiente.
2. Agrega frontmatter con `description:` para que aparezca correctamente en `maxi-setup.md`:
   ```markdown
   ---
   name: mi-doc
   description: Cuándo y cómo usar este módulo — aparece en la tabla de maxi-setup.md
   ---
   ```
3. Corre `npm run sync:docs` — el script detecta el archivo nuevo o modificado, lo sube a `templates/docs/` en `zeclio-setup-claude` y abre un PR.
4. Si es un doc nuevo, el script agrega automáticamente la fila en `maxi-setup.md`.

> **Docs actuales y su repo fuente:**
> - `mwc.md` → `maxi-libs/web-components` (auto-generado)
> - `login.md`, `root-config.md`, `styleguide.md`, `api.md`, `state.md` → `ZEUS-Layout` (manual)

---

## 7. Excepciones ZEUS documentadas en `mwc.md`

Las reglas específicas de ZEUS (comportamientos de MWC que difieren del default en el contexto single-spa + React 17) se documentan en la sección **`⚠️ Excepciones ZEUS`** al inicio de `mwc.md`. Son **obligatorias** en todos los microfrontends.

### Reglas actuales

| Componente | Regla |
|---|---|
| `MsDialog` | Nunca renderizar con `visible=true` antes de tener los datos listos. Patrón: `useState(false)` + `if (!visible) return null` + mostrar solo después de resolver el fetch. |
| `MsDialog` | Cuando el mismo dialog muestra distintos registros (edición por fila en tabla), usar `key={record.id}` para forzar remount. Sin `key` React reutiliza la instancia y el contenido queda stale. |
| `MsTable` | Columnas con valores numéricos (dinero, cantidades, porcentajes) siempre con `align: 'right'` y `alignHeader: 'right'`. |
| `MsTable` | Siempre usar `size="small"`. El default `"normal"` produce filas demasiado altas para los diseños ZEUS. |

### Cómo agregar una excepción nueva

1. Descúbrela en un microfrontend real.
2. Documenta la regla en la sección `⚠️ Excepciones ZEUS` de `.claude/docs/mwc.md` del proyecto.
3. Replica la misma regla en `templates/docs/mwc.md` de este repo.
4. Corre `npm run sync:docs` o edita directamente `templates/docs/mwc.md`.
5. Mergea el PR → nueva versión llega a todos los proyectos con `npx zeclio-setup-claude`.

---

## 8. Disparar la Action manualmente

Si necesitas publicar sin hacer un nuevo sync, puedes disparar la Action desde GitHub:

```
github.com/maxi-adan/zeclio-setup-claude → Actions → Publish to Nexus → Run workflow
```

---

## 9. Troubleshooting

| Problema | Solución |
|---|---|
| `gh: command not found` (Windows) | Abre una terminal nueva o reinstala con `winget install --id GitHub.cli`. |
| `gh: command not found` (Mac) | Abre una terminal nueva o reinstala con `brew install gh`. |
| `Could not access maxi-adan/zeclio-setup-claude` (Windows) | Verifica que `GH_TOKEN` esté definido: `echo $env:GH_TOKEN`. Si está vacío, repite el paso 2. |
| `Could not access maxi-adan/zeclio-setup-claude` (Mac) | Verifica que `GH_TOKEN` esté definido: `echo $GH_TOKEN`. Si está vacío, repite el paso 2. |
| `mwc.md not found` | Corre `npm run build` en `core/` primero. |
| La Action no se dispara | El PR debe tocar archivos dentro de `templates/`. Verifica en la pestaña Actions. |
| Error de publicación en Nexus | Verifica que el secret `NEXUS_TOKEN` esté configurado y sea válido. |
