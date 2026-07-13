# Guía de Setup — Sistema de Docs Sincronizados

Este documento explica cómo funciona el sistema que mantiene los documentos de contexto de Claude actualizados en todos los proyectos microfrontend de ZEUS. Aplica a cualquier miembro del equipo que necesite instalar el entorno o sincronizar docs desde cualquiera de los dos repos fuente.

---

## Tabla de contenidos

> ⭐ **[Primeros pasos — instalar el paquete en tu proyecto](#primeros-pasos--instalar-el-paquete-en-tu-proyecto)** — si es tu primera vez, leé esto antes que nada.

1. [Cómo funciona el sistema (visión general)](#1-cómo-funciona-el-sistema)
2. [Quién hace qué](#2-quién-hace-qué)
3. [Setup inicial — una sola vez por máquina](#3-setup-inicial--una-sola-vez-por-máquina)
4. [Flujo diario — `maxi-libs/web-components`](#4-flujo-diario--maxi-libsweb-components)
5. [Flujo diario — `ZEUS-Layout`](#5-flujo-diario--zeus-layout)
6. [Qué pasa después del PR](#6-qué-pasa-después-del-pr)
7. [Cómo actualizar los proyectos microfrontend](#7-cómo-actualizar-los-proyectos-microfrontend)
8. [Auto-actualización automática — cómo funciona `.version`](#8-auto-actualización-automática)
9. [Para qué sirve cada doc en `.claude/docs/`](#9-para-qué-sirve-cada-doc)
10. [SpecKit — flujo completo, cuándo usarlo y cuándo no](#10-speckit)
11. [Actualizar templates del proyecto (SETUP.md, constitution, inyecciones)](#11-actualizar-templates-del-proyecto)
12. [Agregar un nuevo doc de plataforma](#12-agregar-un-nuevo-doc-de-plataforma)
13. [Excepciones ZEUS en `mwc.md`](#13-excepciones-zeus-en-mwcmd)
14. [Disparar la Action manualmente](#14-disparar-la-action-manualmente)
15. [Troubleshooting](#15-troubleshooting)

---

## Primeros pasos — instalar el paquete en tu proyecto

> **Para quién:** cualquier desarrollador que va a trabajar en un microfrontend ZEUS por primera vez en su máquina. Si ya tenés el proyecto andando y Claude actualizándose solo, no necesitás repetir esto.

`zeclio-setup-claude` es un paquete npm **privado** publicado en el Nexus de Maxi. No está en el npm público, así que hay dos requisitos antes de poder instalarlo: **acceso a Nexus** y **configurar npm para que apunte ahí**.

> 📌 **Antes que nada: solicitá el acceso a Nexus a tu líder de equipo** (un usuario/credenciales o directamente el `_authToken` de npm). Sin ese acceso no vas a poder instalar el paquete. El detalle está en el Paso 1.

**Versión actual del paquete:** `3.0.3` — verificá siempre la última con:

```powershell
npm view zeclio-setup-claude version --registry=https://artifacts.maxilabs.net/repository/maxi-npm-group/
```

### Paso 1 — Solicitá acceso a Nexus a tu líder

El paquete vive en un registry privado protegido con autenticación. **Pedile a tu líder de equipo:**

- Un usuario/credenciales de Nexus, o directamente el **`_authToken` de npm** para el registry.
- Confirmación de la URL del registry de consumo (grupo): `https://artifacts.maxilabs.net/repository/maxi-npm-group/`.

> Sin esto, cualquier `npx zeclio-setup-claude` falla con `404 Not Found` (npm no sabe dónde buscar el paquete) o `401 Unauthorized` (falta el token).

### Paso 2 — Configurá npm para usar el registry de Maxi

Creá o editá tu archivo `.npmrc`. Puede ser **global** (afecta toda tu máquina) o **por proyecto** (recomendado si además trabajás con paquetes de otros registries).

- **Global:** `~/.npmrc` (Mac/Linux) o `C:\Users\<tu-usuario>\.npmrc` (Windows).
- **Por proyecto:** un `.npmrc` en la raíz del repo (agregalo a `.gitignore` si contiene el token).

Contenido:

```ini
registry=https://artifacts.maxilabs.net/repository/maxi-npm-group/
//artifacts.maxilabs.net/repository/maxi-npm-group/:_authToken=NpmToken.<el-que-te-dio-tu-líder>
```

> El registry de grupo también sirve los paquetes públicos de npm (los proxea), así que ponerlo como `registry` por defecto **no rompe** la instalación de tus otras dependencias.

Verificá que quedó bien configurado:

```powershell
npm view zeclio-setup-claude version
# Debe devolver un número de versión (ej. 3.0.3), no un error de auth
```

### Paso 3 — Corré el comando en la raíz de tu proyecto

```powershell
cd <tu-proyecto-microfrontend>
npx zeclio-setup-claude
```

Esto arma toda la estructura `.claude/` (docs de plataforma, skills de SpecKit, settings), crea o actualiza `CLAUDE.md`, y deja `SETUP.md`, la constitution y `project-state.md` en la raíz. El detalle completo de qué archivos toca está en la [sección 7](#7-cómo-actualizar-los-proyectos-microfrontend).

### Paso 4 — Abrí el proyecto en Claude Code y listo

A partir de acá **no tenés que volver a correr el comando manualmente**: al inicio de cada sesión Claude compara tu versión instalada contra la de Nexus y se auto-actualiza si hay una nueva (ver [sección 8](#8-auto-actualización-automática)). Tu único trabajo recurrente es programar features — con SpecKit para las grandes ([sección 10](#10-speckit)) o pidiéndole a Claude directamente en el chat para las chicas.

---

## 1. Cómo funciona el sistema

El sistema tiene **dos repos fuente** que producen documentos de contexto para Claude. Cada uno tiene su propio mecanismo de generación/edición, pero ambos los entregan al mismo destino: el paquete `zeclio-setup-claude` publicado en Nexus.

```
┌────────────────────────────────────┐     ┌──────────────────────────────────────────────┐
│   maxi-libs/web-components         │     │   ZEUS-Layout                                │
│                                    │     │                                              │
│  DOCS AUTO-GENERADOS               │     │  DOCS MANUALES                               │
│  ─────────────────────             │     │  ──────────────                              │
│  • mwc.md                          │     │  • login.md        (auth Keycloak, token$)   │
│    generado por npm run build      │     │  • root-config.md  (rutas, import maps)      │
│    a partir de los readme.md       │     │  • styleguide.md   (componentes, permisos)   │
│    de cada componente Stencil      │     │  • api.md          (HTTP, interceptores)     │
│                                    │     │  • state.md        (Redux en single-spa)     │
│  Cuándo sincronizar:               │     │                                              │
│  → Después de editar un componente │     │  Cuándo sincronizar:                         │
│    y correr npm run build          │     │  → Después de editar cualquiera de estos .md │
│                                    │     │                                              │
│  Comando:                          │     │  Comando:                                    │
│  npm run sync:docs                 │     │  npm run sync:docs                           │
└──────────────────┬─────────────────┘     └─────────────────────┬────────────────────────┘
                   │                                             │
                   └────────────────────┬────────────────────────┘
                                        │
                                        │  Ambos corren el mismo script:
                                        │  scripts/sync-docs.js
                                        │  Lee .claude/docs/*.md → abre PR en GitHub
                                        ▼
                        ┌─────────────────────────────────┐
                        │   maxi-adan/zeclio-setup-claude  │
                        │   (GitHub)                       │
                        │                                  │
                        │  PR creado automáticamente       │
                        │  con los docs actualizados       │
                        │                                  │
                        │  Al mergear:                     │
                        │  → GitHub Action se dispara      │
                        │  → Bumpa versión patch en        │
                        │    package.json                  │
                        │  → Publica a Nexus               │
                        └──────────────────┬───────────────┘
                                           │
                                           ▼
                        ┌─────────────────────────────────┐
                        │   Nexus (npm registry)           │
                        │                                  │
                        │  Nueva versión disponible        │
                        │  zeclio-setup-claude@x.x.x       │
                        └──────────────────┬───────────────┘
                                           │
                                           ▼
                        ┌─────────────────────────────────┐
                        │   Proyectos microfrontend        │
                        │                                  │
                        │  npx zeclio-setup-claude         │
                        │                                  │
                        │  docs/*.md   → siempre           │
                        │               actualizados       │
                        │  otros       → solo si no        │
                        │  archivos      existen           │
                        └─────────────────────────────────┘
```

**Resumen en una línea:** editás un doc en su repo fuente → corrés `sync:docs` → se abre un PR → alguien lo mergea → la Action publica la nueva versión → los proyectos corren `npx zeclio-setup-claude` y reciben los docs frescos.

---

## 2. Quién hace qué

| Rol | Tareas |
|---|---|
| **Admin** (una sola vez) | Crear el token de GitHub, configurarlo como `GH_TOKEN` en su máquina, configurar el secret `NEXUS_TOKEN` en el repo |
| **Integrante del equipo** (una sola vez por máquina) | Instalar GitHub CLI (`gh`), configurar `GH_TOKEN` en su perfil de shell |
| **Dev en `maxi-libs/web-components`** | Editar componentes → `npm run build` → `npm run sync:docs` cuando quiera publicar los docs actualizados |
| **Dev en `ZEUS-Layout`** | Editar los `.md` de `.claude/docs/` → `npm run sync:docs` cuando quiera publicar los docs actualizados |
| **Cualquier dev** | Revisar y mergear el PR en `zeclio-setup-claude`. Correr `npx zeclio-setup-claude` en sus proyectos para recibir los docs frescos. |

---

## 3. Setup inicial — una sola vez por máquina

Estos pasos son necesarios **una sola vez** en cada máquina desde la que quieras correr `npm run sync:docs`.

### 3.1 Instalar GitHub CLI (`gh`)

La CLI de GitHub es la herramienta que usa el script para crear PRs automáticamente.

**Windows:**

```powershell
winget install --id GitHub.cli
```

**Mac:**

```bash
brew install gh
```

Después de instalar, **abre una terminal nueva** para que el PATH se actualice.

> Si usás una terminal interna de un IDE (como Antigravity o VS Code integrado) que no hereda el PATH del sistema, el script lo resuelve automáticamente. No necesitás hacer nada extra.

---

### 3.2 Configurar el token de GitHub (`GH_TOKEN`)

Los scripts de sincronización usan la variable de entorno `GH_TOKEN` para autenticarse contra GitHub. `gh` CLI la detecta automáticamente, así que **no necesitás correr `gh auth login`**.

#### Paso previo — El admin genera el token (una sola vez para todo el equipo)

1. Ingresá a: `https://github.com/settings/personal-access-tokens/new`

2. Completá el formulario con estos valores:

   | Campo | Valor |
   |---|---|
   | Token name | `zeclio-sync-docs` (o el nombre que prefieras) |
   | Expiration | El tiempo que necesites, por ejemplo `1 year` |
   | Resource owner | `maxi-adan` |

3. En **Repository access**, seleccioná:
   - `Only select repositories`
   - Buscá y seleccioná: `maxi-adan/zeclio-setup-claude`

4. En **Permissions**, expandí `Repository permissions` y configurá:

   | Permiso | Valor |
   |---|---|
   | Contents | `Read and write` |
   | Pull requests | `Read and write` |

   El resto dejalo en `No access`.

5. Hacé clic en **Generate token** y copiá el token (`github_pat_...`). **Solo se muestra una vez.**

6. Compartí ese token con el equipo de forma segura (no por chat — usá un gestor de contraseñas, 1Password, o similar).

---

#### Guardar el token en tu máquina

Una vez que tenés el token, guardarlo toma un minuto.

**Windows — PowerShell:**

```powershell
# 1. Agrega el token a tu perfil de PowerShell (persiste entre sesiones)
Add-Content $PROFILE "`n`$env:GH_TOKEN = 'github_pat_xxxx...'"

# 2. Recarga el perfil en la sesión actual
. $PROFILE

# 3. Verifica que funciona
gh api repos/maxi-adan/zeclio-setup-claude --jq ".name"
# Debe responder: zeclio-setup-claude
```

**Mac — zsh (default desde macOS Catalina):**

```bash
# 1. Agrega el token a tu perfil de zsh (persiste entre sesiones)
echo '\nexport GH_TOKEN="github_pat_xxxx..."' >> ~/.zshrc

# 2. Recarga el perfil en la sesión actual
source ~/.zshrc

# 3. Verifica que funciona
gh api repos/maxi-adan/zeclio-setup-claude --jq ".name"
# Debe responder: zeclio-setup-claude
```

> Si usás bash en Mac, reemplazá `~/.zshrc` por `~/.bash_profile`.

---

### 3.3 Configurar el secret `NEXUS_TOKEN` (solo el admin, una sola vez)

La GitHub Action necesita este secret para publicar el paquete a Nexus. Se configura una sola vez en el repo de GitHub.

```
Ir a: github.com/maxi-adan/zeclio-setup-claude
  → Settings
  → Secrets and variables
  → Actions
  → New repository secret
     Name:  NEXUS_TOKEN
     Value: (el _authToken de tu .npmrc de Nexus)
```

---

## 4. Flujo diario — `maxi-libs/web-components`

Este flujo aplica cuando editaste uno o más componentes Stencil (`ms-*`) y querés que los docs actualizados lleguen a todos los proyectos.

### Por qué se requiere `npm run build` primero

`mwc.md` **no se escribe a mano** — se genera automáticamente a partir de los archivos `readme.md` que Stencil produce para cada componente durante el build. Si saltás el build y corrés `sync:docs` directamente, el archivo `mwc.md` que se sincroniza quedará desactualizado.

### Pasos

```powershell
# Desde maxi-libs/web-components/core/

# Paso 1: Generá el doc actualizado
npm run build
# → Produce (entre otros): .claude/docs/mwc.md

# Paso 2: Sincronizá todos los docs
npm run sync:docs
# → Sube todos los .md de .claude/docs/ a templates/docs/ en zeclio-setup-claude
# → Abre un PR automáticamente con la lista de archivos modificados
```

### Qué hace `sync:docs` internamente

1. Lee todos los archivos `.md` de `.claude/docs/`
2. Para cada archivo, lo sube a `templates/docs/` en el repo `maxi-adan/zeclio-setup-claude` vía GitHub API
3. Si aparece un archivo nuevo que todavía no está referenciado en `templates/maxi-setup.md`, lo agrega automáticamente a la tabla usando el campo `description:` del frontmatter del archivo
4. Crea un PR con el título y la lista de archivos que cambiaron

> Para que esto funcione, `GH_TOKEN` debe estar configurado en tu entorno (ver sección 3.2).

---

## 5. Flujo diario — `ZEUS-Layout`

Este flujo aplica cuando editaste uno o más de los docs de plataforma de ZEUS y querés que los cambios lleguen a todos los proyectos.

### Cuáles son los docs de ZEUS-Layout

A diferencia de `mwc.md`, estos docs se **escriben y mantienen manualmente**. Están en `.claude/docs/` dentro del repo `ZEUS-Layout`:

| Archivo | Qué documenta |
|---|---|
| `login.md` | Cómo consumir `@maxi/login`: `token$`, `validateToken`, `decodeJWT`, patrones de sesión, reglas de uso |
| `root-config.md` | Registro de microfrontends, rutas activas, import maps por entorno, comunicación inter-app |
| `styleguide.md` | Catálogo completo de componentes, form helpers, utilidades de fecha, API de permisos, reglas estrictas de uso |
| `api.md` | Patrón HTTP: `instance.js`, interceptores, `validateToken`+`token$` para headers de auth, `window.APP_CONFIG_*` para base URL, `logout()` en token inválido |
| `state.md` | Redux Toolkit en single-spa: store aislado por microfrontend, permissions slice, hook `usePermissions`, setup del Provider |

### Pasos

```bash
# Desde ZEUS-Layout/

# Paso 1: Editá el o los .md que necesites
# Ejemplo: editás .claude/docs/api.md para documentar un nuevo endpoint

# Paso 2: Sincronizá
npm run sync:docs
# → Sube todos los .md de .claude/docs/ a templates/docs/ en zeclio-setup-claude
# → Abre un PR automáticamente con la lista de archivos modificados
```

**No hay `npm run build` previo** — los docs ya están listos para sincronizar en cuanto los editás.

### Añadir frontmatter a un doc nuevo

Si creás un doc que todavía no existe, agregale frontmatter al inicio del archivo para que aparezca correctamente en la tabla de `maxi-setup.md`:

```markdown
---
name: mi-doc
description: Cuándo y cómo usar este módulo — esta descripción aparece en la tabla de maxi-setup.md
---

# Resto del contenido...
```

El script de sync detecta el `description:` y lo usa al insertar la fila en `maxi-setup.md` automáticamente.

---

## 6. Qué pasa después del PR

Una vez que corrés `npm run sync:docs` desde cualquiera de los dos repos:

### Paso 1 — Revisión del PR

El PR se abre en `github.com/maxi-adan/zeclio-setup-claude`. Cualquier integrante del equipo puede revisarlo y mergearlo. Revisá que:
- Los archivos modificados sean los esperados
- El contenido del diff tenga sentido (no hay líneas rotas, el markdown es válido)

### Paso 2 — GitHub Action automática

Al mergear, la GitHub Action `.github/workflows/publish-on-merge.yml` se dispara **sola**. No hay que hacer nada manualmente. La Action:

1. Detecta que el PR tocó archivos dentro de `templates/`
2. Bumpa la versión patch en `package.json` (ej. `1.4.2` → `1.4.3`)
3. Publica la nueva versión a Nexus usando el secret `NEXUS_TOKEN`

> Si el PR no toca archivos en `templates/`, la Action no se dispara. Verificá en la pestaña Actions del repo si no ves actividad.

---

## 7. Cómo actualizar los proyectos microfrontend

Una vez que la nueva versión está publicada en Nexus, cualquier dev puede actualizar su proyecto con un solo comando:

```powershell
# Desde la raíz del proyecto microfrontend
npx zeclio-setup-claude
```

**Qué hace este comando:**

| Archivo | Comportamiento |
|---|---|
| Todo en `.claude/` (docs, skills, maxi-setup, settings) | **Siempre se sobreescribe** — todos son archivos de plataforma |
| `.specify/extensions/git/scripts/*` | **Siempre se sobreescribe** — scripts de plataforma |
| `.specify/extensions/git/commands/*` | **Siempre se sobreescribe** — comandos de plataforma |
| `.specify/extensions/git/extension.yml` | **Siempre se sobreescribe** — config de plataforma |
| `SETUP.md` en la raíz | Solo se copia si no existe todavía — nunca sobreescribe |
| `.specify/memory/constitution.md` | Solo se copia si no existe todavía — nunca sobreescribe |
| `.specify/extensions.yml`, `init-options.json`, `git-config.yml` | Solo se copia si no existe todavía |
| `project-state.md` (raíz) | Se **crea** una sola vez si no existe — nunca se sobreescribe (ni con `--force`). Acumula el historial del proyecto (componentes y features completadas); Claude lo mantiene actualizado al terminar cada tarea. |
| `CLAUDE.md` | Se crea si no existe. Se inyectan de forma idempotente: las referencias `@.claude/maxi-setup.md` y `@project-state.md`, la regla de auto-verificación de versión, y las reglas de mantenimiento. |

> Si querés resetear todos los archivos a sus valores de template (no solo los docs), corrés:
> ```powershell
> npx zeclio-setup-claude --force
> ```
> **Usalo con cuidado** — sobreescribe también archivos que el equipo pudo haber personalizado.

> Para **ver qué haría sin escribir nada** (útil antes de correr un `--force`), agregá `--dry-run`:
> ```powershell
> npx zeclio-setup-claude --dry-run
> ```

---

## 8. Auto-actualización automática

Cada proyecto que usa `zeclio-setup-claude` tiene un archivo `.claude/.version` que registra qué versión del paquete se usó al inicializar o actualizar la estructura `.claude/`. Este archivo es la base del mecanismo de auto-actualización.

### Qué pasa cuando Claude abre el proyecto

Al inicio de **cada sesión**, antes de responder cualquier mensaje, Claude ejecuta estos pasos automáticamente (instrucciones definidas en `.claude/maxi-setup.md`):

**Paso 1 — Lee la versión instalada**

```
.claude/.version  →  ej. "1.4.2"
```

**Paso 2 — Consulta la versión disponible en Nexus**

```bash
npm view zeclio-setup-claude version \
  --registry=https://artifacts.maxilabs.net/repository/maxi-npm-group/
# Responde: "1.4.5"
```

**Paso 3 — Actúa según el resultado**

| Situación | Lo que hace Claude |
|---|---|
| `.claude/.version` **no existe** | Corre `npx zeclio-setup-claude --force` sin preguntar |
| Versión instalada **≠** versión en Nexus | Corre `npx zeclio-setup-claude@latest --force` sin preguntar |
| Versiones **coinciden** | No hace nada, continúa normalmente |

> Claude no te avisa si actualizó — simplemente lo hace y sigue con tu solicitud. Si querés saber qué versión está instalada, podés leer `.claude/.version` directamente.

**Paso 4 — Verifica si `CLAUDE.md` está inicializado**

Claude lee `CLAUDE.md`. Si el archivo **no tiene ninguna sección `##`** con contenido específico del proyecto (solo las directivas `@` y las reglas de mantenimiento que inyecta el script), le pregunta una sola vez:

> "Este proyecto aún no tiene documentación de arquitectura en `CLAUDE.md`. ¿Querés que ejecute `/init` primero? Analizo el proyecto y documento comandos, arquitectura y patrones — lo que mejora la calidad de mis respuestas."

- Si respondés **sí** → Claude corre `/init`, documenta el proyecto, y retoma tu solicitud.
- Si respondés **no** → continúa normalmente, no vuelve a preguntar en esa sesión.
- Si `CLAUDE.md` ya tiene secciones → no pregunta nada.

### Por qué existe este mecanismo

Los docs en `.claude/docs/` (especialmente `mwc.md`) cambian cada vez que un componente se actualiza en `maxi-libs/web-components`. Sin este mecanismo, un proyecto podría estar trabajando con una referencia de componentes desactualizada durante semanas sin saberlo. El auto-update garantiza que Claude siempre tenga la documentación más reciente antes de tocar cualquier código.

---

## 9. Para qué sirve cada doc

Los archivos en `.claude/docs/` son el **contexto de plataforma** que Claude lee al inicio de cada sesión. Sin ellos, Claude no sabe que estás en un microfrontend ZEUS, no conoce los componentes `ms-*`, no sabe cómo funciona la autenticación, y podría generar código que parece correcto pero viola reglas críticas de la plataforma.

Cada doc tiene un propósito específico:

---

### `login.md` — Autenticación y sesión

**Cuándo lo usa Claude:** cada vez que el código toca autenticación, tokens, sesión de usuario, o protección de rutas.

**Qué contiene:**

- Cómo importar y consumir `@maxi/login`
- El observable `token$` — cómo suscribirte y leer el token actual
- `validateToken()` — cuándo llamarlo (antes de operaciones críticas o de larga duración)
- `decodeJWT()` — cómo decodificar el payload del token para leer claims
- Patrones de sesión: cómo saber si el usuario está autenticado, cómo reaccionar a expiración
- Reglas de lo que NO hacer: nunca guardar el token en `localStorage`, nunca llamar `keycloak.init()` desde un microfrontend

**Ejemplo de uso real:**

> "¿Cómo hago para que mi componente solo se muestre si el usuario tiene el rol `ADMIN`?"
> → Claude lee `login.md` y `constitution.md` para responderte con el patrón correcto usando `validatePermission()`.

---

### `mwc.md` — Componentes Maxi Web Components

**Cuándo lo usa Claude:** cada vez que el código usa o necesita usar cualquier componente `ms-*` o `Ms*`.

**Qué contiene:**

- Referencia completa de todos los componentes: `MsTable`, `MsDialog`, `MsDropdown`, `MsInputField`, `MsCalendar`, `MsMultiselect`, `MsNotification`, `MsFileUpload`, etc.
- Props exactos de cada componente (nombres no siguen HTML estándar — son no obvios)
- Eventos: cómo se llaman, cómo escucharlos en React (con prefijo `on`)
- Cómo pasar objetos/arrays como props (siempre como objetos JavaScript, nunca como strings JSON)
- **Sección `⚠️ Excepciones ZEUS`** al inicio — reglas obligatorias específicas del contexto single-spa + React 17:
  - `MsDialog`: nunca renderizar con `visible=true` antes de tener datos
  - `MsDialog`: usar `key={record.id}` cuando el mismo dialog muestra distintos registros
  - `MsTable`: siempre `size="small"`
  - `MsTable`: siempre `ms-table-actions` en elementos clicables dentro de celdas
  - `MsTable`: columnas numéricas siempre con `align: 'right'`

> Este es el doc que más frecuentemente tiene cambios — se regenera automáticamente con cada `npm run build` en `maxi-libs/web-components`. Por eso los docs siempre se sobreescriben con `npx zeclio-setup-claude`.

---

### `root-config.md` — Rutas e import maps

**Cuándo lo usa Claude:** cuando el código toca rutas, registro de microfrontends, startup de la aplicación, o comunicación entre apps.

**Qué contiene:**

- Cómo funciona el registro de microfrontends en single-spa
- Rutas activas: qué path activa qué microfrontend
- Import maps por entorno (local, dev, staging, producción)
- Secuencia de startup: en qué orden arrancan los módulos
- Comunicación inter-app: cómo un microfrontend puede hablar con otro
- Cómo agregar un nuevo microfrontend al sistema

---

### `styleguide.md` — Componentes UI y utilidades

**Cuándo lo usa Claude:** cuando el código usa componentes de `@maxi/styleguide`, helpers de formulario, utilidades de fecha, o controles de permisos.

**Qué contiene:**

- Catálogo completo de componentes del styleguide disponibles
- Form helpers: patrones para construir formularios con validación
- Date utilities: funciones para formatear y parsear fechas
- API de permisos: `validatePermission()`, `validateGroupPermissions()`, `getUserRoles()` — cómo usarlos y cuándo usar cada uno
- Reglas estrictas: cuándo se puede y no se puede usar cada componente
- Regla #15: cómo sobreescribir CSS de componentes `ms-*` sin romper el scope (usando `class` o `customClass` prop)

---

### `api.md` — Patrón HTTP

**Cuándo lo usa Claude:** cada vez que el código hace llamadas HTTP a un backend.

**Qué contiene:**

- El patrón `instance.js`: cómo crear la instancia de axios/fetch con los interceptores correctos
- Cómo agregar el header de autenticación automáticamente usando `token$`
- `window.APP_CONFIG_*`: cómo leer la URL base del backend desde la configuración de entorno (nunca hardcodeada)
- Qué hacer cuando el token es inválido: llamar `logout()` y redirigir
- Patrón completo de un servicio HTTP en ZEUS: imports, instancia, interceptor de request, interceptor de response

> Sin este doc, Claude generaría llamadas HTTP sin auth o con la URL hardcodeada — errores comunes que este doc previene explícitamente.

---

### `state.md` — Redux Toolkit en single-spa

**Cuándo lo usa Claude:** cuando el código necesita estado global, permisos del usuario en el store, o setup del Provider.

**Qué contiene:**

- Por qué cada microfrontend tiene su propio store aislado (no comparten store con otros microfrontends)
- Cómo configurar Redux Toolkit en un microfrontend ZEUS
- El `permissions slice`: cómo se carga y actualiza el estado de permisos del usuario
- El hook `usePermissions()`: cómo leer permisos desde cualquier componente
- Setup del `Provider`: dónde y cómo envolverlo correctamente en single-spa
- Cuándo usar Redux vs estado local (`useState`): regla simple — permisos y datos compartidos entre rutas van al store; estado de UI local va a `useState`

---

### `.specify/memory/constitution.md` — Principios ZEUS

**Cuándo lo usa Claude:** en cada tarea de `/speckit-plan` y `/speckit-implement` como gate de calidad. También disponible en cualquier tarea de código cuando las reglas son relevantes.

**Qué contiene:**

Los principios no negociables de la plataforma ZEUS, organizados en secciones:

| Sección | Qué prohíbe / qué exige |
|---|---|
| I. Módulos compartidos | Todo UI viene de `@maxi/styleguide`. Nunca instalar `maxi-react-components` directamente. |
| II. Autenticación | Nunca re-implementar auth. Usar `token$` o `props.token` de `@maxi/login`. Nunca guardar token en storage. |
| III. Controles HTML nativos | Prohibido `<input>`, `<select>`, `<table>`, `<dialog>`. Usar siempre los equivalentes `Ms*`. |
| IV. Permisos | Usar `validatePermission()` del styleguide. Nunca `user.role === 'admin'`. |
| V. Props y eventos Ms* | Verificar props exactos en `mwc.md` antes de usar cualquier componente. |
| VI. Dependencias | Nunca duplicar React, RxJS, single-spa — están en el import map global. |
| VII. CSS y tema | El CSS global se importa una sola vez. Nunca targetear clases internas sin scope. |

> Si Claude detecta una violación durante `/speckit-plan` o `/speckit-implement`, **reporta el problema antes de continuar** — no lo omite silenciosamente.

---

## 10. SpecKit

SpecKit es el sistema de flujo de trabajo estructurado para features medianas y grandes. Convierte una descripción en lenguaje natural en: especificación → diseño técnico → lista de tareas → código implementado, con la constitution como gate de calidad en cada paso.

Consiste en un conjunto de **slash commands** que escribís directamente en el chat de Claude Code.

### Cuándo usarlo

| Situación | ¿Usar SpecKit? |
|---|---|
| Feature nueva de mediana o gran complejidad (más de 2-3 archivos) | **Sí** |
| Feature que involucra múltiples componentes, servicios o rutas | **Sí** |
| Feature cuya implementación no está clara de entrada | **Sí** |
| Cambio que afecta contratos o integraciones con otros microfrontends | **Sí** |
| Bug fix simple | **No** — usá el chat directamente |
| Cambio de texto, color, estilo puntual | **No** — usá el chat directamente |
| Refactor interno de un solo archivo | **No** — usá el chat directamente |
| Agrega un campo a un formulario existente | **No** — usá el chat directamente |
| Tarea de una sola línea de código | **No** — usá el chat directamente |

**Regla simple:** si podés explicarle a Claude exactamente qué cambiar en el chat y tiene sentido hacerlo ahí, hacelo ahí. SpecKit vale la pena cuando el trabajo requiere pensar antes de codear.

---

### Flujo completo de SpecKit

El flujo estándar tiene 4 pasos obligatorios y 1 optativo:

```
/speckit-specify  →  /speckit-clarify (optativo)  →  /speckit-plan  →  /speckit-tasks  →  /speckit-implement
```

Cada comando produce un artefacto que el siguiente usa como input. No podés saltarte pasos — `/speckit-plan` necesita el `spec.md` que genera `/speckit-specify`.

---

#### Paso 1 — `/speckit-specify <descripción de la feature>`

**Qué hace:**
Convierte tu descripción en lenguaje natural en una especificación funcional formal. Claude la escribe en `specs/NNN-nombre-feature/spec.md`.

Antes de crear la rama, Claude te hace **dos preguntas obligatorias en secuencia**:

1. **Tipo de rama:** `feat` (nueva funcionalidad) o `fix` (corrección de bug)
2. **Nombre de la rama:** muestra una sugerencia basada en la descripción y espera que confirmes o escribas otro nombre

La rama se crea como `feat/NNN-nombre` o `fix/NNN-nombre` según tus respuestas.

La spec está escrita para stakeholders no técnicos — describe **qué** hace la feature y **para quién**, sin detalles de implementación. Incluye: actores, escenarios de usuario, requisitos funcionales, criterios de éxito medibles.

**Cómo interactuás:**
Escribís el comando seguido de la descripción directamente en el chat. Claude puede pedirte hasta 3 clarificaciones si hay ambigüedades críticas (más que eso no pregunta — hace suposiciones razonables).

```
/speckit-specify Quiero agregar un módulo de reportes que permita filtrar 
por rango de fechas y exportar a Excel. Los usuarios con rol AUDITOR 
pueden ver todos los reportes; los de rol USER solo los propios.
```

Claude responde con la spec completa y te pide confirmación si hay puntos ambiguos.

---

#### Paso 2 (optativo) — `/speckit-clarify`

**Qué hace:**
Analiza la spec existente e identifica ambigüedades que podrían causar rework en etapas posteriores. Hace hasta 5 preguntas, una por una, y actualiza la spec con cada respuesta.

**Cuándo usarlo:**
Si la spec tiene secciones marcadas con `[NEEDS CLARIFICATION]`, o si sabés que hay decisiones de diseño importantes que no quedaron claras en la descripción inicial.

**Cómo interactuás:**
```
/speckit-clarify
```
Claude hace preguntas de a una, con opciones de respuesta y una recomendación. Respondés con la letra de la opción o con texto libre.

---

#### Paso 3 — `/speckit-plan`

**Qué hace:**
Lee la spec y genera el diseño técnico completo. Produce varios artefactos en `specs/NNN-nombre-feature/`:

| Artefacto | Contenido |
|---|---|
| `plan.md` | Stack técnico, estructura de archivos, arquitectura, decisiones de diseño |
| `research.md` | Resolución de incógnitas técnicas (Claude investiga best practices) |
| `data-model.md` | Entidades, relaciones, reglas de validación |
| `contracts/` | Interfaces públicas del feature (endpoints, props, eventos) |

**Constitution check:** antes de finalizar el plan, Claude verifica que no viola ningún principio de `.specify/memory/constitution.md`. Si hay violaciones, reporta y no continúa.

**Cómo interactuás:**
```
/speckit-plan
```
Es mayormente automático. Claude puede pedirte confirmación en decisiones de arquitectura con impacto alto (ej. si un feature requiere compartir estado entre microfrontends).

---

#### Paso 4 — `/speckit-tasks`

**Qué hace:**
Convierte el plan en una lista de tareas accionable en `specs/NNN-nombre-feature/tasks.md`. Cada tarea tiene:
- ID único (`T001`, `T002`...)
- Marcador de paralelización `[P]` si puede correr en paralelo con otras
- Label de user story `[US1]`, `[US2]`...
- Descripción con **ruta exacta del archivo**

**Cómo interactuás:**
```
/speckit-tasks
```
Completamente automático. Podés revisar el `tasks.md` generado y pedir ajustes si algo no tiene sentido.

---

#### Paso 5 — `/speckit-implement`

**Qué hace:**
Ejecuta las tareas de `tasks.md` en orden. Para cada tarea: escribe o modifica el código, marca la tarea como `[X]` cuando termina, reporta progreso.

**Antes de empezar**, Claude verifica los checklists de calidad. Si algún checklist tiene ítems incompletos, pregunta si querés continuar de todas formas.

**Cómo interactuás:**
```
/speckit-implement
```
Claude corre las tareas en orden. Si una falla, para y te explica el problema. Para tareas marcadas `[P]`, puede correrlas en paralelo.

Podés filtrar qué tareas correr:
```
/speckit-implement US1
/speckit-implement T001 T002 T003
```

---

### Cómo interactuar con Claude en el chat (sin SpecKit)

Para tareas directas que no requieren SpecKit, escribís en el chat normalmente. Claude ya tiene todo el contexto de la plataforma cargado (los docs de `.claude/docs/`) y las reglas de `CLAUDE.md`, así que simplemente describe lo que necesitás:

**Ejemplos de tareas directas:**

```
Agrega un campo "observaciones" (textarea) al formulario de alta de proveedor.
Usá MsInputField con el prop multiline.
```

```
El MsTable de la pantalla de pagos tiene las columnas de monto alineadas a la izquierda.
Corregilo según las reglas de mwc.md.
```

```
¿Cómo leo los permisos del usuario en el componente ProveedorList?
```

```
Fix: el dialog de edición muestra los datos del registro anterior cuando abrís
uno distinto. Mirá la sección de excepciones ZEUS en mwc.md.
```

**Lo que Claude hace automáticamente** en cada tarea (sin que vos se lo pidas):

1. Lee `.claude/docs/mwc.md` antes de tocar cualquier componente `Ms*`
2. Verifica los props exactos (no adivina)
3. Aplica las excepciones ZEUS relevantes
4. Verifica permisos contra la API del styleguide
5. Al terminar, actualiza `CLAUDE.md` si hubo cambios en la arquitectura del proyecto

---

## 11. Actualizar templates del proyecto

Además de los docs, `zeclio-setup-claude` distribuye otros archivos y lógica que también deben mantenerse al día.

### `templates-root/SETUP.md` (este archivo)

Guía de flujo de trabajo que se crea en la raíz de cada proyecto nuevo. Para actualizarla:

1. Editá `templates-root/SETUP.md` en el repo `maxi-adan/zeclio-setup-claude` directamente.
2. El cambio llega a proyectos **nuevos** en el próximo `npx zeclio-setup-claude`.
3. Proyectos existentes **no se actualizan automáticamente** — `SETUP.md` nunca se sobreescribe. Si el cambio es crítico, notificá al equipo para que corra `npx zeclio-setup-claude --force`.

### `templates-root/.specify/memory/constitution.md`

Principios ZEUS que SpecKit usa como gate de calidad en `/speckit-plan` y `/speckit-implement`. Para actualizarla:

1. Editá `templates-root/.specify/memory/constitution.md` en este repo.
2. Mismo comportamiento que `SETUP.md`: solo llega a proyectos nuevos o con `--force`.

### Inyecciones en `CLAUDE.md`

Las inyecciones que se agregan a `CLAUDE.md` en cada proyecto están **hardcodeadas en `zeclio-setup-claude.js`** (no son un archivo de template). Actualmente son cuatro: la referencia `@.claude/maxi-setup.md`, la referencia `@project-state.md`, las reglas de mantenimiento, y la regla de auto-verificación de versión al inicio de sesión. Además, el script **crea `project-state.md`** en la raíz si no existe. Para agregar una nueva inyección:

1. Editá el bloque `if (!DRY_RUN)` al final de `main()` en `zeclio-setup-claude.js`.
2. Seguí el patrón existente:
   - Definí un **marker único** (string que identifica si el bloque ya fue inyectado)
   - Definí el **texto a inyectar**
   - Verificá si el marker ya está presente antes de escribir (idempotencia)
3. Estas inyecciones **corren en cada ejecución** (con o sin `--force`) — la idempotencia la garantiza el marker.

---

## 12. Agregar un nuevo doc de plataforma

Los docs se crean en el repo fuente según su naturaleza. La regla es simple:

| Tipo de doc | Repo fuente | Cómo se genera |
|---|---|---|
| Docs de componentes `ms-*` | `maxi-libs/web-components` | Auto-generado por `npm run build` a partir de los `readme.md` de Stencil |
| Docs de plataforma ZEUS (auth, rutas, HTTP, estado, etc.) | `ZEUS-Layout` | Redactado y mantenido manualmente en `.claude/docs/` |

**Pasos desde cualquiera de los dos repos:**

1. Creá el archivo `.md` en `.claude/docs/` dentro del repo correspondiente.

2. Agregale frontmatter con `description:` (obligatorio para que el script lo registre en `maxi-setup.md`):

   ```markdown
   ---
   name: mi-doc
   description: Cuándo y cómo usar este módulo — aparece en la tabla de maxi-setup.md
   ---
   ```

3. Corrés `npm run sync:docs` — el script detecta el archivo nuevo, lo sube a `templates/docs/` y abre un PR.

4. El script agrega automáticamente la fila en `maxi-setup.md` usando el `description:` del frontmatter.

5. Mergeás el PR → GitHub Action publica nueva versión → proyectos actualizan con `npx zeclio-setup-claude`.

**Docs actuales y su repo fuente:**

| Doc | Repo fuente | Tipo |
|---|---|---|
| `mwc.md` | `maxi-libs/web-components` | Auto-generado |
| `login.md` | `ZEUS-Layout` | Manual |
| `root-config.md` | `ZEUS-Layout` | Manual |
| `styleguide.md` | `ZEUS-Layout` | Manual |
| `api.md` | `ZEUS-Layout` | Manual |
| `state.md` | `ZEUS-Layout` | Manual |

---

## 13. Excepciones ZEUS en `mwc.md`

Las reglas específicas de ZEUS son comportamientos de los componentes MWC que difieren del default cuando se usan en el contexto **single-spa + React 17**. Se documentan en la sección `⚠️ Excepciones ZEUS` al inicio de `mwc.md`. Son **obligatorias** en todos los microfrontends.

### Reglas actuales

| Componente | Regla | Por qué |
|---|---|---|
| `MsDialog` | Nunca renderizar con `visible=true` antes de tener los datos listos. Patrón: `useState(false)` + `if (!visible) return null` + mostrar solo después de resolver el fetch. | Evita que el dialog se abra vacío y luego "salte" con contenido. |
| `MsDialog` | Cuando el mismo dialog muestra distintos registros (edición por fila en tabla), usar `key={record.id}` para forzar remount. | Sin `key`, React reutiliza la instancia y el contenido queda del registro anterior (stale). |
| `MsTable` | Columnas con valores numéricos (dinero, cantidades, porcentajes) siempre con `align: 'right'` y `alignHeader: 'right'`. | Estándar visual ZEUS — los números se alinean a la derecha. |
| `MsTable` | Siempre usar `size="small"`. | El default `"normal"` produce filas demasiado altas para los diseños ZEUS. |
| `MsTable` | Cualquier elemento clicable dentro de una celda (`render`) **debe** estar envuelto en `<div class="ms-table-actions">`. | Sin esta clase, el click propaga a la fila y dispara `rowClick` o el toggle de expand. Comportamiento hardcodeado en `ms-table.tsx`. |
| CSS global | **No importar** `global.css` ni `global-zeclio.css` en ningún microfrontend. `@maxi/styleguide` ya importa `global-zeclio.css` al arrancar el single-spa. | Doble importación puede causar conflictos. Todas las variables `--maxi-*` ya están disponibles. Para overrides usar CSS variables en el global del proyecto. |
| `MsSidebar` | El overlay (`ms-sidebar-overlay`) puede lanzar `removeChild` crash en race conditions con single-spa. **Workaround:** implementar paneles laterales como `<aside>` nativo con `position:fixed`. Fix pendiente en la librería. | Renderizado condicional en Stencil + evento click-outside propagándose → Stencil llama `removeChild` sobre un nodo que React ya retiró. |

### Cómo agregar una excepción nueva

1. Descubrís el comportamiento inesperado en un microfrontend real.
2. Documentás la regla en la sección `⚠️ Excepciones ZEUS` de `.claude/docs/mwc.md` en `maxi-libs/web-components`.
3. Replicás la misma regla en `templates/docs/mwc.md` de `zeclio-setup-claude` (este repo).
4. Corrés `npm run sync:docs` o editás `templates/docs/mwc.md` directamente.
5. Mergeás el PR → nueva versión viaja a todos los proyectos con `npx zeclio-setup-claude`.
6. Registrás la excepción en la tabla de esta sección para mantener este doc actualizado.

---

## 14. Disparar la Action manualmente

Si necesitás publicar una nueva versión sin hacer un nuevo sync de docs (por ejemplo, para corregir un bug en `zeclio-setup-claude.js`), podés disparar la Action desde GitHub:

```
github.com/maxi-adan/zeclio-setup-claude
  → Actions
  → Publish to Nexus
  → Run workflow
```

---

## 15. Troubleshooting

| Problema | Causa probable | Solución |
|---|---|---|
| `npm ERR! 404 ... 'zeclio-setup-claude'` al correr `npx` | npm no está apuntando al registry de Nexus | Configurá el `.npmrc` con el registry de grupo (ver [Primeros pasos, paso 2](#primeros-pasos--instalar-el-paquete-en-tu-proyecto)) |
| `npm ERR! 401 Unauthorized` / `E401` al instalar | Falta el `_authToken` o expiró | Pedile a tu líder un token nuevo de Nexus y actualizá el `.npmrc` |
| `gh: command not found` (Windows) | `gh` no está instalado o la terminal no cargó el PATH nuevo | Abrí una terminal nueva. Si persiste: `winget install --id GitHub.cli` |
| `gh: command not found` (Mac) | Igual que arriba | Abrí una terminal nueva. Si persiste: `brew install gh` |
| `Could not access maxi-adan/zeclio-setup-claude` (Windows) | `GH_TOKEN` no está definido o es inválido | Verificá: `echo $env:GH_TOKEN`. Si está vacío, repetí el paso 3.2 |
| `Could not access maxi-adan/zeclio-setup-claude` (Mac/Linux) | `GH_TOKEN` no está definido o es inválido | Verificá: `echo $GH_TOKEN`. Si está vacío, repetí el paso 3.2 |
| `mwc.md not found` | `npm run build` no se corrió antes de `sync:docs` | Corrés `npm run build` en `maxi-libs/web-components/core/` primero |
| La Action no se dispara al mergear | El PR no toca archivos dentro de `templates/` | Verificá en la pestaña Actions del repo. El trigger está configurado solo para cambios en `templates/` |
| Error de publicación en Nexus | `NEXUS_TOKEN` expiró o no está configurado | Verificás que el secret `NEXUS_TOKEN` esté configurado en Settings → Secrets and variables → Actions del repo |
| Los docs no se actualizan en el proyecto después del merge | La versión nueva todavía no se descargó localmente | Corrés `npx zeclio-setup-claude` en el proyecto. Si ya lo corriste y no cambió, verificás que la Action terminó con éxito |
| `sync:docs` abre un PR pero no modifica `maxi-setup.md` para el doc nuevo | El doc nuevo no tiene frontmatter con `description:` | Agregás el bloque frontmatter al inicio del `.md` (ver sección 9) y volvés a correr `sync:docs` |
