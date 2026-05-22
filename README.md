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

```
.claude/
├── agents/
│   └── README.md               ← Documentación para definir agentes personalizados
├── commands/
│   ├── agents/
│   │   └── README.md           ← Slash commands que invocan agentes
│   ├── mcp/
│   │   └── README.md           ← Slash commands que usan herramientas MCP
│   ├── scripts/
│   │   └── README.md           ← Slash commands que ejecutan scripts
│   └── skills/
│       └── README.md           ← Skills reutilizables como slash commands
├── docs/
│   ├── login.md                ← Contexto de @maxi/login (Keycloak, token$, API de sesión)
│   ├── mwc.md                  ← Referencia de Maxi Web Components (ms-* / Ms*)
│   ├── root-config.md          ← Contexto del root-config (rutas, import maps, startup)
│   └── styleguide.md           ← Catálogo de componentes, hooks y utilidades de @maxi/styleguide
├── mcp/
│   └── README.md               ← Documentación del MCP de GitHub y alternativas
└── scripts/
    └── README.md               ← Índice de scripts disponibles
```

> El comando **nunca toca** `settings.json`, `settings.local.json` ni `CLAUDE.md` — esos archivos son específicos de cada proyecto.

---

## Próximos pasos

Después de ejecutar el comando, abre el proyecto en Claude Code. Los documentos de contexto en `.claude/docs/` se cargan automáticamente y dan a Claude conocimiento de la plataforma ZEUS (componentes, autenticación, rutas, arquitectura).
