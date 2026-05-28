# Setup Guide — Sistema de sync mwc.md

Este documento cubre todo lo necesario para que el flujo `maxi-libs/web-components` → `zeclio-setup-claude` → Nexus funcione correctamente.

---

## 1. GitHub CLI (`gh`) — instalación y autenticación

### 1.1 Verificar instalación

Abre una terminal nueva (importante: nueva sesión para que el PATH se actualice) y ejecuta:

```powershell
gh --version
```

Deberías ver algo como `gh version 2.93.0`.

### 1.2 Autenticarte en GitHub

```powershell
gh auth login
```

El comando te pregunta:

| Pregunta | Respuesta |
|---|---|
| Where do you use GitHub? | `GitHub.com` |
| What is your preferred protocol? | `HTTPS` |
| Authenticate Git with your GitHub credentials? | `Yes` |
| How would you like to authenticate? | `Login with a web browser` |

Se abrirá el navegador. Copia el código que aparece en la terminal, pégalo en la página de GitHub y autoriza.

### 1.3 Verificar autenticación

```powershell
gh auth status
```

Debe mostrar tu usuario de GitHub y `Logged in to github.com`.

---

## 2. Secret `NEXUS_TOKEN` en repo-A (zeclio-setup-claude)

La GitHub Action `publish-on-merge.yml` necesita este secret para publicar a Nexus.

**Pasos:**

1. Ve a GitHub → repositorio `zeclio-setup-claude`
2. `Settings` → `Secrets and variables` → `Actions`
3. Clic en `New repository secret`
4. Nombre: `NEXUS_TOKEN`
5. Valor: token de Nexus (el mismo que usas en tu `.npmrc` local de `_authToken`)
6. Clic en `Add secret`

---

## 3. Configurar el repo en `sync-mwc.js`

En `maxi-libs/web-components/core/scripts/sync-mwc.js`, línea 13, cambia:

```js
const REPO = 'ORG/zeclio-setup-claude';
```

por:

```js
const REPO = 'maxi-adan/zeclio-setup-claude';
```

---

## 4. Permisos de `gh` sobre repo-A

Para que el script pueda crear ramas y PRs en `zeclio-setup-claude`, tu usuario de GitHub autenticado en `gh` debe tener acceso de escritura (write) a ese repo.

Si el repo pertenece a una organización:
- Un admin debe darte acceso de colaborador, o
- Ser miembro de un equipo con permisos de escritura en el repo

Verifica que puedes acceder:

```powershell
gh repo view maxi-adan/zeclio-setup-claude
```

---

## 5. Flujo completo de uso

### Actualizar y distribuir `mwc.md`

```powershell
# 1. Entra al directorio core de web-components
cd C:\Users\adans\OneDrive\Escritorio\p\maxi\maxi-libs\web-components\core

# 2. Haz build (genera mwc.md automáticamente al final)
npm run build

# 3. Cuando quieras distribuir los cambios, abre un PR en zeclio-setup-claude
npm run sync:mwc
```

### En repo-A (zeclio-setup-claude)

```
Revisar y mergear el PR generado por sync:mwc
  → GitHub Action se dispara automáticamente
  → Bumpa versión patch en package.json
  → Publica nueva versión a Nexus
```

### En proyectos que consumen el paquete

```powershell
npx zeclio-setup-claude --force
```

---

## 6. Resumen de secrets y variables

| Dónde | Nombre | Valor | Para qué |
|---|---|---|---|
| repo-A → GitHub Secrets | `NEXUS_TOKEN` | Token de Nexus | Publicar a Nexus desde la Action |

---

## 7. Troubleshooting

**`gh: command not found`**
→ Abre una terminal nueva. El PATH se actualiza al abrir una sesión nueva.

**`gh auth status` muestra error**
→ Corre `gh auth login` nuevamente.

**`sync:mwc` falla con "Could not access ORG/repo"**
→ Verifica que actualizaste `REPO` en `sync-mwc.js` y que tu usuario tiene acceso al repo.

**`mwc.md not found`**
→ Corre `npm run build` en `core/` primero. El archivo se genera durante el build.

**La Action no se dispara al mergear**
→ Verifica que el PR modifica algún archivo dentro de `templates/`. La Action solo se activa con cambios en esa carpeta.
