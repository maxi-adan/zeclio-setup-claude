# Create Microfront

Ejecuta el generador de microfronts Single-SPA con la estructura estándar de Maxi.

## Usage

```
/create-microfront
```

## Steps

1. Ejecuta el script interactivo:

```bash
node .claude/scripts/create-microfront.js
```

El script pedirá:
- **Nombre del microfront** (ej: `mi-app`) → genera `@maxi/mi-app`
- **Puerto de desarrollo** (default: `9003`)

## What it does

- Instala `create-single-spa@4.1.5` globalmente si no existe
- Genera la estructura base con webpack, babel, jest, eslint, husky
- Configura `webpack.config.js` con dotenv, CopyWebpackPlugin y hash dinámico
- Crea `src/config.json`, `.env`, `.gitignore`, `.prettierignore`
- Actualiza `package.json` con todos los scripts estándar de Maxi
