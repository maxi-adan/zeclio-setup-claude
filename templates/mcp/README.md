# MCP Servers

## GitHub MCP

Servidor MCP oficial de GitHub corriendo via Docker.

### Requisitos

- Docker Desktop instalado y **corriendo** antes de abrir Claude Code
- Personal Access Token de GitHub con permisos de repo

### Configuración

El servidor está configurado en `.claude/settings.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<TU_TOKEN>"
      }
    }
  }
}
```

### Por qué puede fallar

El MCP de GitHub **no aparece disponible** si Docker no estaba corriendo cuando se inició Claude Code. En ese caso, las herramientas `github_*` no estarán disponibles en la sesión.

**Solución:** Asegurarse de que Docker esté corriendo *antes* de abrir Claude Code o el VSCode con la extensión.

### Alternativa cuando el MCP no está disponible

Usar la API de GitHub directamente con `curl` y el token del settings:

```bash
# Leer un archivo de un repo
curl -s \
  -H "Authorization: token <TOKEN>" \
  -H "Accept: application/vnd.github.v3.raw" \
  "https://api.github.com/repos/<owner>/<repo>/contents/<path>"

# Listar repos del usuario autenticado
curl -s \
  -H "Authorization: token <TOKEN>" \
  "https://api.github.com/user/repos?per_page=100"
```

### Qué puedes hacer con el MCP (cuando está activo)

| Acción | Ejemplo de prompt |
|---|---|
| Leer archivo | "Lee el README.md del repo maxi-adan/ia" |
| Crear repo | "Crea el repo maxi-root-config en la org maxi" |
| Crear issue | "Abre un issue en maxi-adan/ia con título X" |
| Listar PRs | "Lista los PRs abiertos de maxi-ms/ZEUS-Layout" |
| Crear rama | "Crea la rama feature/mi-feature en el repo X" |
| Mergear PR | "Mergea el PR #3 del repo X" |
