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

---

## Documentos de contexto disponibles

Los archivos en `.claude/docs/` describen la arquitectura y las APIs de la plataforma ZEUS. Léelos cuando trabajes en cualquier microfrontend:

| Archivo | Cuándo leerlo |
|---|---|
| `docs/login.md` | Autenticación, sesión Keycloak, consumo de `token$` |
| `docs/mwc.md` | Cualquier componente `ms-*` / `Ms*` |
| `docs/root-config.md` | Rutas, import maps, registro de microfrontends |
| `docs/styleguide.md` | Componentes UI, helpers, permisos de `@maxi/styleguide` |
| `.specify/memory/constitution.md` | Principios y gobernanza del proyecto |
