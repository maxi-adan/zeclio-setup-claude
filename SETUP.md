# Setup Guide — Sistema de docs sincronizados

Este documento cubre todo lo necesario para que el flujo de sincronización de documentos funcione correctamente entre `maxi-libs/web-components` y `zeclio-setup-claude`.

---

## Cómo funciona el sistema

```
Editas o creas un .md en .claude/docs/  (maxi-libs/web-components)
  → npm run build     genera mwc.md automáticamente al final del build
  → npm run sync:docs sube todos los docs y abre un PR en zeclio-setup-claude
  → mergeas el PR
  → GitHub Action publica nueva versión a Nexus automáticamente
  → proyectos corren: npx zeclio-setup-claude --force
```

---

## 1. Instalar GitHub CLI (`gh`)

```powershell
winget install --id GitHub.cli
```

Abre una **terminal nueva** después de instalar para que el PATH se actualice.

Verifica:
```powershell
gh --version
```

> Si usas una terminal interna de un IDE (como Antigravity) que no hereda el PATH del sistema, el script lo resuelve automáticamente — no necesitas hacer nada extra.

---

## 2. Autenticación en GitHub

Tienes dos opciones:

### Opción A — Con tu propia cuenta (para colaboradores del repo)

```powershell
gh auth login
```

Responde así:

| Pregunta | Respuesta |
|---|---|
| Where do you use GitHub? | `GitHub.com` |
| What is your preferred protocol? | `HTTPS` |
| Authenticate Git with your GitHub credentials? | `Yes` |
| How would you like to authenticate? | `Login with a web browser` |

Se abre el navegador — copia el código de la terminal, pégalo en GitHub y autoriza.

Verifica:
```powershell
gh auth status
```

El admin del repo debe darte acceso en:
```
github.com/maxi-adan/zeclio-setup-claude → Settings → Collaborators → Add people
```

### Opción B — Con token compartido (sin ser colaborador)

El admin genera un token en:
```
github.com → Settings → Developer settings → Personal access tokens → Fine-grained tokens
  → Repository: maxi-adan/zeclio-setup-claude
  → Permissions: Contents (write) + Pull requests (write)
```

Agrega el token a tu entorno de PowerShell:

```powershell
# Permanente — lo agrega a tu perfil de PowerShell
Add-Content $PROFILE "`n`$env:GH_TOKEN = 'github_pat_xxxx...'"
```

`gh` CLI lo detecta automáticamente. No necesitas correr `gh auth login`.

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
   npx zeclio-setup-claude --force
   ```

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
| `gh: command not found` | Abre una terminal nueva. Si persiste, usa la Opción B con `GH_TOKEN`. |
| `Could not access maxi-adan/zeclio-setup-claude` | Verifica `gh auth status` o que `GH_TOKEN` esté definido. Pide acceso al admin. |
| `mwc.md not found` | Corre `npm run build` en `core/` primero. |
| La Action no se dispara | El PR debe tocar archivos dentro de `templates/`. Verifica en la pestaña Actions. |
| Error de publicación en Nexus | Verifica que el secret `NEXUS_TOKEN` esté configurado y sea válido. |
