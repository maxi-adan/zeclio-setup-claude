# zeclio-setup-claude

Bootstrapper de la estructura `.claude` para proyectos Maxi. Con un solo comando crea las carpetas y archivos base que necesita Claude Code para trabajar en cualquier repositorio del equipo: slash commands, scripts de utilidad, documentación de MCP y más.

---

## Requisitos previos

| Requisito | Versión mínima | Verificar con |
|---|---|---|
| Node.js | 16 | `node --version` |
| npm | incluido con Node | `npm --version` |

---

## Configurar el registry de Maxi

El paquete está publicado en el registry privado de Maxi (Nexus). Configura npm para usarlo una sola vez en tu máquina:

```sh
npm config set registry https://artifacts.maxilabs.net/repository/maxi-npm-group/
```

Para verificar:

```sh
npm config get registry
# Debe mostrar: https://artifacts.maxilabs.net/repository/maxi-npm-group/
```

---

## Uso

Ejecuta el comando desde la raíz del proyecto donde quieres inicializar la estructura `.claude`:

```sh
npx zeclio-setup-claude
```

Si `.claude` ya existe y tiene archivos, el comando los respeta y solo agrega los que faltan.

### Flags disponibles

| Flag | Comportamiento |
|---|---|
| _(ninguno)_ | Copia los archivos que no existen, omite los que ya están |
| `--force` | Copia todos los archivos sobreescribiendo los existentes |
| `--dry-run` | Muestra qué se copiaría sin escribir nada |

**Previsualizar antes de aplicar:**

```sh
npx zeclio-setup-claude --dry-run
```

**Forzar actualización completa:**

```sh
npx zeclio-setup-claude --force
```

### Instalación global (opcional)

Si vas a usarlo frecuentemente puedes instalarlo globalmente:

```sh
npm install -g zeclio-setup-claude
zeclio-setup-claude
```

---

## Qué crea

### En `.claude/`

```
.claude/
├── .version                    ← Versión instalada del setup (usada para detectar actualizaciones)
├── maxi-setup.md               ← Instrucciones de sesión: verifica versión, verifica init de CLAUDE.md, referencia docs
├── docs/
│   ├── login.md                ← Contexto de @maxi/login (Keycloak, token$, API de sesión)
│   ├── mwc.md                  ← Referencia de Maxi Web Components (ms-* / Ms*)
│   ├── root-config.md          ← Contexto del root-config (rutas, import maps, startup)
│   ├── styleguide.md           ← Catálogo de componentes, hooks y utilidades de @maxi/styleguide
│   ├── api.md                  ← Patrón HTTP ZEUS: instance.js, auth headers, APP_CONFIG_*
│   └── state.md                ← Redux Toolkit en single-spa: store, permissions slice, usePermissions
└── skills/
    └── speckit-*/SKILL.md      ← Skills de SpecKit (specify, plan, tasks, implement, …)
```

> `docs/` **siempre se sobreescribe** en cada ejecución para mantener la documentación actualizada.
> El resto de archivos en `.claude/` solo se crea si no existe — nunca sobreescribe.

### En la raíz del proyecto

```
SETUP.md                                ← Guía de flujo de trabajo ZEUS (SpecKit, docs, versión)
.specify/
└── memory/
    └── constitution.md                 ← Principios ZEUS pre-llenados (módulos, auth, controles, permisos)
└── (resto de .specify/)                ← Config de SpecKit: templates, scripts, extensions, workflows
```

> Al correr `/speckit-specify`, Claude pregunta el tipo de rama (`feat` o `fix`) antes de crearla. La rama resultante sigue el patrón `feat/NNN-nombre` o `fix/NNN-nombre`.

> `SETUP.md` y `constitution.md` solo se crean si no existen — en re-ejecuciones se respetan los cambios del proyecto.

### En `CLAUDE.md`

El script **inyecta dos bloques** en `CLAUDE.md` si no están ya presentes (crea el archivo si no existe):

| Inyección | Contenido |
|---|---|
| Referencia de sesión | `@.claude/maxi-setup.md` — Claude la carga al inicio de cada sesión |
| Regla de mantenimiento | Instrucción para que Claude actualice `CLAUDE.md` cuando cambie la arquitectura del proyecto |

> `CLAUDE.md` **no es un archivo de template** — el script lo parchea directamente. Agregar más inyecciones requiere editar `zeclio-setup-claude.js`.

---

## Próximos pasos

Después de ejecutar el comando, abre el proyecto en Claude Code. Al inicio de cada sesión Claude:

1. Lee `.claude/maxi-setup.md` y verifica si la versión instalada coincide con la disponible en Nexus — si no, ejecuta `npx zeclio-setup-claude@latest --force` automáticamente.
2. Verifica si `CLAUDE.md` está inicializado (contiene secciones `##` con arquitectura del proyecto). Si no, pregunta una sola vez si querés correr `/init`.
3. Carga todos los docs de `.claude/docs/` en contexto (login, mwc, root-config, styleguide, api, state).
4. Aplica las reglas de `CLAUDE.md` y los principios de `.specify/memory/constitution.md` en cualquier tarea de código.

Consulta `SETUP.md` en la raíz del proyecto para el flujo de trabajo completo: tareas directas, features con SpecKit y cómo mantener `CLAUDE.md` actualizado.
