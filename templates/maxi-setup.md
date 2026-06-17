> **OBLIGATORIO — INICIO DE SESIÓN:** Antes de responder cualquier solicitud del usuario, ejecutar los pasos 1–4 de esta sección. Sin excepciones, sin omitir, independientemente de lo urgente o simple que parezca la tarea.

# Maxi — Instrucciones para Claude Code

## Verificación de contexto al inicio de cada sesión

Antes de responder cualquier solicitud del usuario, ejecuta los siguientes pasos **una vez por sesión**:

### 1. Leer la versión instalada

Lee el archivo `.claude/.version`. Contiene la versión de `zeclio-setup-claude` con la que se generó esta estructura.

### 2. Consultar la versión disponible en Nexus

```bash
npm view zeclio-setup-claude version --registry=https://artifacts.maxilabs.net/repository/maxi-npm-group/
```

### 3. Actuar

- Si `.claude/.version` **no existe** → ejecuta sin preguntar:
  ```bash
  npx zeclio-setup-claude --force
  ```

- Si la versión instalada es **distinta** a la disponible en Nexus → ejecuta sin preguntar:
  ```bash
  npx zeclio-setup-claude@latest --force
  ```

- Si las versiones **coinciden** → continúa normalmente sin mencionar nada.

### 4. Verificar si CLAUDE.md está inicializado

Lee `CLAUDE.md`. Si el archivo **no contiene ninguna sección `##`** (solo tiene las directivas `@` y las reglas de mantenimiento, sin `## Commands`, `## Architecture` ni ninguna otra sección con contenido específico del proyecto), significa que el usuario no ejecutó `/init` todavía.

En ese caso, **antes de responder cualquier solicitud** (ya sea una tarea directa por chat o un comando SpecKit), pregunta una sola vez:

> "Este proyecto aún no tiene documentación de arquitectura en `CLAUDE.md`. ¿Querés que ejecute `/init` primero? Analizo el proyecto y documento comandos, arquitectura y patrones — lo que mejora la calidad de mis respuestas. Si preferís continuar sin init, también está bien."

- Si el usuario dice que **sí** → invoca `/init` y luego retoma su solicitud original.
- Si el usuario dice que **no** → continúa normalmente sin volver a preguntar en esa sesión.
- Si `CLAUDE.md` ya tiene secciones `##` → no preguntes nada, continúa.

---

## Documentos de contexto disponibles

Los archivos en `.claude/docs/` describen la arquitectura y las APIs de la plataforma ZEUS. Léelos cuando trabajes en cualquier microfrontend:

| Archivo                           | Cuándo leerlo                                                                     |
| --------------------------------- | --------------------------------------------------------------------------------- |
| `docs/login.md`                   | Autenticación, sesión Keycloak, consumo de `token$`                               |
| `docs/mwc.md`                     | Cualquier componente `ms-*` / `Ms*`                                               |
| `docs/root-config.md`             | Rutas, import maps, registro de microfrontends                                    |
| `docs/styleguide.md`              | Componentes UI, helpers, permisos de `@maxi/styleguide`                           |
| `docs/api.md`                     | Cualquier llamada HTTP — patrón `instance.js`, auth headers, `APP_CONFIG_*`       |
| `docs/state.md`                   | Redux Toolkit, store, permissions slice, `usePermissions` hook, guard en el router |
| `.specify/memory/constitution.md` | Principios y gobernanza del proyecto                                              |
