# SETUP — Flujo de trabajo en la plataforma ZEUS

Este documento describe cómo trabajar en cualquier microfrontend de ZEUS: cómo se inicializa la sesión, cómo se construyen features mediante specs, y cómo conviven las reglas de la plataforma con el sistema SpecKit.

---

## 1. Cómo está organizado todo

Hay un único punto de entrada: **`CLAUDE.md`**. Cada sesión de Claude Code lo carga automáticamente y desde ahí se dispara todo lo demás.

```
CLAUDE.md
  ├── @.claude/maxi-setup.md       ← chequeo de versión + instrucción de actualizar
  ├── @.claude/docs/login.md       ← API de autenticación Keycloak
  ├── @.claude/docs/root-config.md ← shell single-spa, rutas, import maps
  ├── @.claude/docs/styleguide.md  ← catálogo de componentes @maxi/styleguide
  ├── @.claude/docs/mwc.md         ← referencia completa MAXI Web Components
  ├── @.claude/docs/api.md         ← patrón HTTP: instance.js, auth headers, APP_CONFIG
  └── @.claude/docs/state.md       ← Redux Toolkit, permissions slice, usePermissions hook
```

No hay nada que "llamar" manualmente. Con que Claude Code abra una sesión en este directorio, carga todo el contexto.

---

## 2. Chequeo de versión automático

Al inicio de **cada sesión**, Claude ejecuta el siguiente flujo definido en `.claude/maxi-setup.md`:

```
1. Leer .claude/.version  (versión instalada del setup)
2. Consultar Nexus:
   npm view zeclio-setup-claude version
     --registry=https://artifacts.maxilabs.net/repository/maxi-npm-group/
3. Comparar versiones:
   - .version no existe       → npx zeclio-setup-claude --force
   - versiones difieren       → npx zeclio-setup-claude@latest --force
   - versiones coinciden      → continúa silenciosamente
```

### Lo que hace `npx zeclio-setup-claude`

Regenera la estructura `.claude/` con los docs, skills y maxi-setup.md actualizados. Actualiza `.claude/.version` con la nueva versión. **No toca código del microfrontend**.

### Dónde vive esto

En `.claude/maxi-setup.md`. CLAUDE.md lo importa con `@.claude/maxi-setup.md`. No requiere nada más.

---

## 3. Contexto de docs — regla de oro antes de codificar

Antes de escribir cualquier línea de código en un microfrontend ZEUS, Claude lee los docs relevantes. Esto está forzado por las reglas de CLAUDE.md:

| Situación                               | Doc obligatorio               |
| --------------------------------------- | ----------------------------- |
| Cualquier componente `Ms*` / `ms-*`     | `.claude/docs/mwc.md`         |
| Formularios, tablas, botones, UI        | `.claude/docs/styleguide.md`  |
| Autenticación, token, sesión            | `.claude/docs/login.md`       |
| Rutas, import maps, shell               | `.claude/docs/root-config.md` |
| Llamadas HTTP, servicios, axios         | `.claude/docs/api.md`         |
| Redux, estado global, permisos en store | `.claude/docs/state.md`       |

Todos los docs ya están cargados en contexto desde el inicio de sesión vía CLAUDE.md. Antes de pedir una feature, no necesitas pedirle a Claude que los lea — ya los tiene.

---

## 4. Cuándo NO usar SpecKit

Para algo puntual no necesitas ningún comando. Solo pídelo directamente en el chat:

> "Hazme una tabla que muestre una lista de usuarios con columnas nombre, email y estado"

Claude ya tiene `mwc.md` y `styleguide.md` cargados en contexto, así que usará `MsTable` con los props correctos sin que tengas que indicárselo.

| Situación                                       | Camino                                                |
| ----------------------------------------------- | ----------------------------------------------------- |
| Componente suelto, tabla, formulario pequeño    | Pídelo directo en el chat                             |
| Feature de una pantalla con lógica clara        | Pídelo directo, sin spec                              |
| Feature mediana con requisitos definidos        | `/speckit-specify` + `/speckit-plan` + codear directo |
| Feature grande con múltiples flujos y pantallas | Flujo completo: specify → plan → tasks → implement    |

El chequeo de versión y la carga de docs siempre corren — eso es transparente independientemente del camino que tomes.

---

## 5. Flujo completo con SpecKit

### Visión general

```
/speckit-specify "descripción"
       ↓
[specs/NNN-nombre/spec.md]
       ↓
/speckit-clarify  (opcional — solo si hay ambigüedades)
       ↓
/speckit-plan
       ↓
[specs/NNN-nombre/plan.md]
       ↓
/speckit-tasks
       ↓
[specs/NNN-nombre/tasks.md]
       ↓
/speckit-implement
       ↓
Código en el microfrontend
```

Cada paso genera artefactos en `specs/NNN-nombre/`. SpecKit los encadena automáticamente.

---

### Paso 1 — Describir la feature: `/speckit-specify`

```
/speckit-specify quiero una pantalla de listado de usuarios con filtros por nombre y estado
```

**Qué hace:**

- Crea una rama git `NNN-feature-nombre` (hook automático `before_specify`)
- Genera `specs/NNN-feature-nombre/spec.md` con historias de usuario, requisitos funcionales y criterios de éxito
- Si hay ambigüedades críticas, presenta máximo 3 preguntas con opciones antes de continuar
- Genera un checklist de calidad en `specs/.../checklists/requirements.md`

**Qué NO incluye en la spec:**

- Tecnologías, frameworks, nombres de componentes (eso viene en el plan)
- La spec es agnóstica — describe QUÉ y PARA QUIÉN, no el CÓMO

**Tip:** Describe la feature en lenguaje de negocio. No necesitas mencionar `MsTable` ni `@maxi/styleguide` en la descripción — Claude ya sabe cuáles debe usar cuando llegue al plan.

---

### Paso 2 — Clarificar (opcional): `/speckit-clarify`

**En la práctica este paso se omite la mayoría de las veces.** El flujo habitual es `specify → plan → tasks → implement` directamente.

**Cuándo sí usarlo:**

| Situación                                                               | Por qué clarificar primero                                               |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| La spec tiene marcadores `[NEEDS CLARIFICATION]`                        | El modelo detectó ambigüedades que necesita resolver antes de planificar |
| La feature tiene reglas de negocio complejas que no quedaron en la spec | Evita que el plan tome decisiones técnicas incorrectas                   |
| Hay múltiples enfoques válidos y quieres decidir uno antes del plan     | El plan ya no tendrá que hacer suposiciones                              |

**Cuándo saltarlo** (la mayoría de los casos):

- La spec quedó limpia y completa
- Es una feature técnica estándar (tabla con filtros, formulario CRUD, etc.)
- Los requisitos son claros para ti aunque no estén hyper-detallados

> Si saltas clarify y el plan encuentra ambigüedades, las marcará como `[NEEDS CLARIFICATION]` en `research.md` durante la fase 0 de `/speckit-plan` — mismo resultado, un paso después.

---

### Paso 3 — Planificar: `/speckit-plan`

**Qué hace:**

- Lee `spec.md` y genera `plan.md` con contexto técnico, estructura de carpetas y contratos
- En este punto Claude ya tiene todos los docs ZEUS en contexto, así que el plan reflejará automáticamente:
  - Imports desde `@maxi/styleguide` (nunca `maxi-react-components` directo)
  - `token$` / `validateToken()` desde `@maxi/login` para sesión
  - Sin dependencias compartidas (React, RxJS) — están en el import map global
  - Componentes `Ms*` con los props correctos según `.claude/docs/mwc.md`

---

### Paso 4 — Generar tareas: `/speckit-tasks`

Genera `specs/NNN-nombre/tasks.md` con tareas ordenadas por dependencia y marcadas como paralelas `[P]` donde aplica. Las tareas incluyen rutas de archivo exactas dentro del microfrontend.

---

### Paso 5 — Implementar: `/speckit-implement`

Ejecuta las tareas de `tasks.md` en orden. Marca cada tarea completada con `[X]`. Si un paso falla, detiene y reporta con contexto para depurar.

Al implementar, Claude aplica automáticamente todas las reglas de CLAUDE.md:

- Usa `MsTable` con `size="small"` en lugar de `<table>`
- En columnas con acciones clicables (`MsButton`, íconos, links), siempre envolver en `<div class="ms-table-actions">` para que el click no propague al `rowClick` de la fila
- Usa `MsInputField`, `MsDropdown`, etc. en lugar de `<input>`, `<select>`
- Importa todo desde `@maxi/styleguide`
- Usa `validatePermission()` para controlar visibilidad por rol
- No almacena el token — usa `props.token` o `token$`

---

## 6. Comandos disponibles (referencia rápida)

| Comando                 | Cuándo usarlo                                             |
| ----------------------- | --------------------------------------------------------- |
| `/speckit-specify`      | **Siempre primero.** Crea la spec desde descripción libre |
| `/speckit-clarify`      | Si la spec tiene dudas críticas sin resolver              |
| `/speckit-plan`         | Genera el plan técnico a partir de la spec                |
| `/speckit-tasks`        | Genera tareas ordenadas desde el plan                     |
| `/speckit-implement`    | Ejecuta las tareas del tasks.md                           |
| `/speckit-analyze`      | Audita consistencia entre spec, plan y tareas             |
| `/speckit-checklist`    | Genera un checklist personalizado para la feature         |
| `/speckit-constitution` | Crea/actualiza los principios del proyecto                |
| `/speckit-git-feature`  | Crea rama de feature manualmente (normally auto-hook)     |
| `/speckit-git-commit`   | Commit automático del estado actual                       |

---

## 7. La Constitution — principios ZEUS para SpecKit

El archivo `.specify/memory/constitution.md` contiene los principios de la plataforma ZEUS. SpecKit los carga como gate de verificación antes de planificar e implementar. Está pre-llenado con las reglas de la plataforma — si necesitas actualizarlo ejecuta `/speckit-constitution`.

---

## 8. Estructura de artefactos generados

```
specs/
└── 001-nombre-feature/
    ├── spec.md             ← historias, requisitos, criterios de éxito
    ├── plan.md             ← contexto técnico, estructura de archivos
    ├── tasks.md            ← tareas ordenadas y paralelas
    ├── research.md         ← decisiones técnicas (generado por /speckit-plan)
    ├── data-model.md       ← entidades (si aplica)
    ├── contracts/          ← contratos de API (si aplica)
    └── checklists/
        └── requirements.md ← checklist de calidad de la spec
```

---

## 9. Git — ramas y commits automáticos

| Evento                      | Hook             | Efecto                         |
| --------------------------- | ---------------- | ------------------------------ |
| Antes de `/speckit-specify` | `before_specify` | Crea rama `NNN-feature-nombre` |
| Después de cada comando     | `after_*`        | Propone commit automático      |

El hook `before_specify` es **obligatorio** — siempre crea la rama antes de crear la spec. Los hooks `after_*` son **opcionales** — pregunta antes de hacer commit.

---

## 10. Mantener CLAUDE.md actualizado

Al terminar cualquier tarea, Claude evalúa si algo cambió en la **arquitectura** del proyecto. Si cambió → actualiza `CLAUDE.md`. Si no → no toca nada.

### Cuándo SÍ se actualiza

| Evento                                              | Qué se agrega en CLAUDE.md        |
| --------------------------------------------------- | --------------------------------- |
| Se registra un nuevo microfrontend en root-config   | Nueva fila en la tabla de módulos |
| Se establece un nuevo patrón que todos deben seguir | Nueva regla en "Reglas globales"  |
| Se descubre una restricción de la plataforma        | Nueva regla en "Reglas globales"  |
| Se agrega un módulo al import map global            | Nueva fila en la tabla de módulos |

### Cuándo NO se actualiza

| Situación                                      | Razón                                                         |
| ---------------------------------------------- | ------------------------------------------------------------- |
| Se creó un componente dentro del microfrontend | Cambio de código, no de arquitectura — va en git              |
| Se hizo una feature completa con SpecKit       | Los artefactos van en `specs/` — CLAUDE.md no es un changelog |
| Se modificó lógica de negocio                  | No es información que Claude necesite en futuras sesiones     |
| Se hizo una tarea puntual (tabla, formulario)  | Igual — git lo registra, no CLAUDE.md                         |

---

## 11. Qué hacer cuando algo falla

| Problema                         | Solución                                                  |
| -------------------------------- | --------------------------------------------------------- |
| `.claude/.version` no existe     | Claude ejecuta `npx zeclio-setup-claude --force`          |
| Versión desactualizada           | Claude ejecuta `npx zeclio-setup-claude@latest --force`   |
| Plan usa componentes incorrectos | Revisar `constitution.md` con las reglas ZEUS             |
| `/speckit-implement` se detiene  | Revisar el error y volver a ejecutar `/speckit-implement` |
| Spec con `[NEEDS CLARIFICATION]` | Usar `/speckit-clarify` antes de planificar               |

---

## 12. Resumen — orden de operaciones por sesión

```
Nueva sesión
  → Claude carga CLAUDE.md
      → Chequea .claude/.version vs Nexus (maxi-setup.md)
      → Carga todos los docs de .claude/docs/ en contexto

Tarea puntual (tabla, componente, fix)
  → Pídelo directo en el chat

Feature completa
  → /speckit-specify "descripción en lenguaje de negocio"
  → /speckit-plan
  → /speckit-tasks
  → /speckit-implement

Todo lo demás (autenticación, componentes, permisos) está gobernado
por CLAUDE.md + .specify/memory/constitution.md — no necesitas
repetírselo a Claude en cada conversación.
```
