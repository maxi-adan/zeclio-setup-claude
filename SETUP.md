# Setup Guide — Sistema de docs sincronizados

Este documento cubre todo lo necesario para que el flujo de sincronización de documentos funcione correctamente entre `maxi-libs/web-components` y `zeclio-setup-claude`.

---

## Cómo funciona el sistema

```
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│   maxi-libs/web-components      │     │   ZEUS-Layout                   │
│                                 │     │                                 │
│  Editas componente              │     │  Editas doc manualmente         │
│  → npm run build                │     │  (.claude/docs/*.md)            │
│    genera mwc.md automático     │     │                                 │
│  → npm run sync:docs            │     │  → npm run sync:docs            │
└──────────────┬──────────────────┘     └───────────────┬─────────────────┘
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

```powershell
winget install --id GitHub.cli
```

> Si usas una terminal interna de un IDE (como Antigravity) que no hereda el PATH del sistema, el script lo resuelve automáticamente — no necesitas hacer nada extra.

---

## 2. Autenticación — token de GitHub

Los scripts usan la variable de entorno `GH_TOKEN`. `gh` CLI la detecta automáticamente — no necesitas correr `gh auth login`.

### Para el admin (una sola vez)

Genera un token en GitHub:

```
github.com → Settings → Developer settings → Personal access tokens → Fine-grained tokens
  → New Fine-grained token
  → Repository access: Only selected repositories → maxi-adan/zeclio-setup-claude
  → Permissions:
      Contents      → Read and write
      Pull requests → Read and write
```

Comparte ese token (`github_pat_...`) con el equipo de forma segura (no por chat).

---

### Para cada integrante del equipo (una sola vez por máquina)

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

## 5. Agregar un nuevo documento

1. Crea el `.md` en `.claude/docs/` dentro de `maxi-libs/web-components`
2. Agrega un frontmatter con `description:` para que aparezca correctamente en `maxi-setup.md`:
   ```markdown
   ---
   name: mi-doc
   description: Cuándo y cómo usar este módulo
   ---
   ```
3. Corre `npm run sync:docs` — el script detecta el archivo nuevo, lo sube y registra la fila en `maxi-setup.md` automáticamente

---

## 6. Disparar la Action manualmente

Si necesitas publicar sin hacer un nuevo sync, puedes disparar la Action desde GitHub:

```
github.com/maxi-adan/zeclio-setup-claude → Actions → Publish to Nexus → Run workflow
```

---

## 7. Troubleshooting

| Problema | Solución |
|---|---|
| `gh: command not found` | Abre una terminal nueva o reinstala con `winget install --id GitHub.cli`. |
| `Could not access maxi-adan/zeclio-setup-claude` | Verifica que `GH_TOKEN` esté definido: `echo $env:GH_TOKEN`. Si está vacío, repite el paso 2. |
| `mwc.md not found` | Corre `npm run build` en `core/` primero. |
| La Action no se dispara | El PR debe tocar archivos dentro de `templates/`. Verifica en la pestaña Actions. |
| Error de publicación en Nexus | Verifica que el secret `NEXUS_TOKEN` esté configurado y sea válido. |
