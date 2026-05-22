#!/usr/bin/env node

/**
 * Script para crear automáticamente un microfront Single-SPA con React
 * basado en la estructura estándar de Maxi.
 *
 * Uso: node create-microfront.js
 */

const { execSync } = require("child_process");
const readline = require("readline");
const fs = require("fs");
const path = require("path");

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function question(prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

function step(n, total, label) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`[${n}/${total}] ${label}`);
  console.log("─".repeat(60));
}

function run(cmd, cwd) {
  execSync(cmd, { stdio: "inherit", cwd });
}

// ─────────────────────────────────────────────
// Versiones requeridas
// ─────────────────────────────────────────────

const REQUIRED_DEPS = {
  "copy-webpack-plugin": "^13.0.1",
  dotenv: "^16.0.1",
  react: "^17.0.2",
  "react-dom": "^17.0.2",
  "single-spa-react": "^4.3.1",
};

const REQUIRED_DEV_DEPS = {
  "@babel/core": "^7.23.3",
  "@babel/eslint-parser": "^7.23.3",
  "@babel/plugin-transform-runtime": "^7.23.3",
  "@babel/preset-env": "^7.23.3",
  "@babel/preset-react": "^7.23.3",
  "@babel/runtime": "^7.23.3",
  "@testing-library/jest-dom": "^5.17.0",
  "@testing-library/react": "^12.0.0",
  "babel-jest": "^27.5.1",
  concurrently: "^6.2.1",
  "cross-env": "^7.0.3",
  eslint: "^7.32.0",
  "eslint-config-prettier": "^8.3.0",
  "eslint-config-react-important-stuff": "^3.0.0",
  "eslint-plugin-prettier": "^3.4.1",
  husky: "^7.0.2",
  "identity-obj-proxy": "^3.0.0",
  jest: "^27.5.1",
  "jest-cli": "^27.5.1",
  prettier: "^2.3.2",
  "pretty-quick": "^3.1.1",
  webpack: "^5.89.0",
  "webpack-cli": "^4.10.0",
  "webpack-config-single-spa-react": "^4.0.0",
  "webpack-dev-server": "^4.0.0",
  "webpack-merge": "^5.8.0",
};

// ─────────────────────────────────────────────
// Generadores de contenido de archivos
// ─────────────────────────────────────────────

function generateWebpackConfig(orgName, projectName) {
  // Los backticks y ${...} del archivo de salida se escapan dentro del template literal del script
  return `const webpack = require("webpack");
const { merge } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-react");
const path = require("path");
require("dotenv").config({ path: "./.env" });
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = (webpackConfigEnv, argv) => {
  const defaultConfig = singleSpaDefaults({
    orgName: "${orgName}",
    projectName: "${projectName}",
    webpackConfigEnv,
    argv,
  });

  return merge(defaultConfig, {
    plugins: [
      new webpack.EnvironmentPlugin(["REACT_APP_HASH"]),
      new CopyWebpackPlugin({
        patterns: [{ from: "src/config.json", to: "config.json" }],
      }),
    ],
    output: {
      path: path.resolve(__dirname, "${projectName}"),
      filename: \`${orgName}-${projectName}.\${process.env.REACT_APP_HASH}.js\`,
      chunkFilename: \`${orgName}-${projectName}-chunk-[id].\${process.env.REACT_APP_HASH}.js\`,
    },
    performance: {
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
  });
};
`;
}

function generateMainEntry(orgName, projectName) {
  return `import React from "react";
import ReactDOM from "react-dom";
import singleSpaReact from "single-spa-react";
import Root from "./root.component";

const lifecycles = singleSpaReact({
  React,
  ReactDOM,
  rootComponent: Root,
  errorBoundary(err, info, props) {
    return null;
  },
});

export const { bootstrap, mount, unmount } = lifecycles;
`;
}

function generateRootComponent() {
  return `export default function Root(props) {
  return <section>{props.name} is mounted!</section>;
}
`;
}

function generateRootComponentTest() {
  return `import { render } from "@testing-library/react";
import Root from "./root.component";

describe("Root component", () => {
  it("should be in the document", () => {
    const { getByText } = render(<Root name="Testapp" />);
    expect(getByText(/Testapp is mounted!/i)).toBeInTheDocument();
  });
});
`;
}

function generateBabelConfig() {
  return {
    presets: [
      "@babel/preset-env",
      ["@babel/preset-react", { runtime: "automatic" }],
    ],
    plugins: [
      ["@babel/plugin-transform-runtime", { useESModules: true, regenerator: false }],
    ],
    env: {
      test: {
        presets: [["@babel/preset-env", { targets: "current node" }]],
      },
    },
  };
}

function generateJestConfig() {
  return `module.exports = {
  rootDir: "src",
  testEnvironment: "jsdom",
  transform: {
    "^.+\\\\.(j|t)sx?$": "babel-jest",
  },
  moduleNameMapper: {
    "\\\\.(css)$": "identity-obj-proxy",
    "single-spa-react/parcel": "single-spa-react/lib/cjs/parcel.cjs",
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
};
`;
}

function generateEslintRc() {
  return {
    extends: ["react-important-stuff", "plugin:prettier/recommended"],
    parser: "@babel/eslint-parser",
  };
}

function generateGitignore() {
  return `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage
lib-cov
coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# TypeScript
typings/

# npm
.npm
.eslintcache
.node_repl_history
*.tgz
.yarn-integrity

# Environment
.env

# Build
.next
dist

# Editor
.idea
.vscode
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
.DS_Store
`;
}

function generatePrettierIgnore() {
  return `.gitignore
.prettierignore
yarn.lock
yarn-error.log
package-lock.json
dist
coverage
pnpm-lock.yaml
`;
}

function generateHuskyPreCommit() {
  return `#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm exec pretty-quick --staged && npm exec concurrently npm:test npm:lint
`;
}

function generateHuskySh() {
  return `#!/bin/sh
if [ -z "$husky_skip_init" ]; then
  debug () {
    if [ "$HUSKY_DEBUG" = "1" ]; then
      echo "husky (debug) - $1"
    fi
  }

  readonly hook_name="$(basename "$0")"
  debug "starting $hook_name..."

  if [ "$HUSKY" = "0" ]; then
    debug "HUSKY env variable is set to 0, skipping hook"
    exit 0
  fi

  if [ -f ~/.huskyrc ]; then
    debug "sourcing ~/.huskyrc"
    . ~/.huskyrc
  fi

  export readonly husky_skip_init=1
  sh -e "$0" "$@"
  exitCode="$?"

  if [ $exitCode != 0 ]; then
    echo "husky - $hook_name hook exited with code $exitCode (error)"
  fi

  exit $exitCode
fi
`;
}

// ─────────────────────────────────────────────
// Función principal
// ─────────────────────────────────────────────

async function main() {
  console.log("\n" + "═".repeat(60));
  console.log("   Maxi Microfront Generator");
  console.log("═".repeat(60) + "\n");

  // ── Preguntas al usuario ──────────────────────────────────────
  let projectName = await question("¿Nombre del microfront? (ej: mi-app): ");
  projectName = projectName.trim();

  if (!projectName) {
    console.error("\n✗ Error: El nombre del proyecto no puede estar vacío.\n");
    process.exit(1);
  }

  const portInput = await question("¿Puerto para desarrollo? [9003]: ");
  const port = portInput.trim() || "9003";

  rl.close();

  const ORG = "maxi";
  const installPath = process.cwd();
  const fullPath = path.resolve(installPath, projectName);
  const TOTAL_STEPS = 7;

  console.log(`\nProyecto : @${ORG}/${projectName}`);
  console.log(`Ruta     : ${fullPath}`);
  console.log(`Puerto   : ${port}`);

  // ── PASO 1: Instalar create-single-spa globalmente ────────────
  step(1, TOTAL_STEPS, "Verificando create-single-spa@4.1.5");

  let alreadyInstalled = false;
  try {
    const installed = execSync("npm list -g create-single-spa --depth=0", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    alreadyInstalled = installed.includes("create-single-spa@4.1.5");
  } catch {
    // npm list falla si el paquete no está instalado — se instala a continuación
  }

  if (alreadyInstalled) {
    console.log("✓ create-single-spa@4.1.5 ya está instalado globalmente, se omite");
  } else {
    console.log("Instalando create-single-spa@4.1.5 globalmente...");
    run("npm install -g create-single-spa@4.1.5");
    console.log("✓ create-single-spa@4.1.5 instalado");
  }

  // ── PASO 2: Verificar que el directorio destino no exista ─────
  step(2, TOTAL_STEPS, "Verificando directorio de instalación");
  console.log(`Instalando en: ${installPath}`);

  if (fs.existsSync(fullPath)) {
    console.error(`\n✗ Error: Ya existe "${projectName}" en este directorio.`);
    console.error("  Elimínalo o elige un nombre diferente.\n");
    process.exit(1);
  }
  console.log("✓ Directorio disponible");

  // ── PASO 3: Generar estructura con create-single-spa ──────────
  step(3, TOTAL_STEPS, "Generando estructura base con create-single-spa");
  console.log("(Si aparecen prompts interactivos, responde según se indica)\n");

  const createCmd = [
    "create-single-spa",
    `"${fullPath}"`,
    "--moduleType app-parcel",
    "--framework react",
    `--orgName ${ORG}`,
    `--projectName ${projectName}`,
    "--packageManager npm",
  ].join(" ");

  run(createCmd);
  console.log("\n✓ Estructura base generada");

  // ── PASO 4: Verificar e instalar dependencias faltantes ───────
  step(4, TOTAL_STEPS, "Verificando e instalando dependencias faltantes");

  const pkgPath = path.join(fullPath, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  const existing = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  };

  const missingDeps = [];
  const missingDevDeps = [];

  for (const [name, version] of Object.entries(REQUIRED_DEPS)) {
    if (!existing[name]) {
      missingDeps.push(`"${name}@${version}"`);
      console.log(`  → Dependencia faltante: ${name}@${version}`);
    }
  }

  for (const [name, version] of Object.entries(REQUIRED_DEV_DEPS)) {
    if (!existing[name]) {
      missingDevDeps.push(`"${name}@${version}"`);
      console.log(`  → DevDependencia faltante: ${name}@${version}`);
    }
  }

  if (missingDeps.length === 0 && missingDevDeps.length === 0) {
    console.log("  ✓ Todas las dependencias requeridas están presentes");
  }

  if (missingDeps.length > 0) {
    console.log(`\nInstalando ${missingDeps.length} dependencias...`);
    run(`npm install --save ${missingDeps.join(" ")}`, fullPath);
  }

  if (missingDevDeps.length > 0) {
    console.log(`\nInstalando ${missingDevDeps.length} devDependencias...`);
    run(`npm install --save-dev ${missingDevDeps.join(" ")}`, fullPath);
  }

  console.log("✓ Dependencias verificadas");

  // ── PASO 5: Reescribir webpack.config.js ──────────────────────
  step(5, TOTAL_STEPS, "Actualizando webpack.config.js");
  fs.writeFileSync(
    path.join(fullPath, "webpack.config.js"),
    generateWebpackConfig(ORG, projectName)
  );
  console.log("✓ webpack.config.js actualizado con:");
  console.log("    - dotenv");
  console.log("    - CopyWebpackPlugin (src/config.json → config.json)");
  console.log("    - EnvironmentPlugin (REACT_APP_HASH)");
  console.log("    - output con hash dinámico");
  console.log("    - performance hints desactivados");

  // ── PASO 6: Crear / sobrescribir archivos de configuración ────
  step(6, TOTAL_STEPS, "Creando archivos de configuración y código fuente");

  // .env
  fs.writeFileSync(path.join(fullPath, ".env"), "REACT_APP_HASH = default\n");
  console.log("✓ .env");

  // src/config.json
  const srcDir = path.join(fullPath, "src");
  if (!fs.existsSync(srcDir)) fs.mkdirSync(srcDir, { recursive: true });
  fs.writeFileSync(
    path.join(srcDir, "config.json"),
    JSON.stringify(
      { REACT_APP_API: "", REACT_APP_PERMISSION_ENVIRONMENT: "" },
      null,
      2
    ) + "\n"
  );
  console.log("✓ src/config.json");

  // babel.config.json
  fs.writeFileSync(
    path.join(fullPath, "babel.config.json"),
    JSON.stringify(generateBabelConfig(), null, 2) + "\n"
  );
  console.log("✓ babel.config.json");

  // jest.config.js
  fs.writeFileSync(path.join(fullPath, "jest.config.js"), generateJestConfig());
  console.log("✓ jest.config.js");

  // .eslintrc
  fs.writeFileSync(
    path.join(fullPath, ".eslintrc"),
    JSON.stringify(generateEslintRc(), null, 2) + "\n"
  );
  console.log("✓ .eslintrc");

  // .gitignore
  fs.writeFileSync(path.join(fullPath, ".gitignore"), generateGitignore());
  console.log("✓ .gitignore");

  // .prettierignore
  fs.writeFileSync(
    path.join(fullPath, ".prettierignore"),
    generatePrettierIgnore()
  );
  console.log("✓ .prettierignore");

  // Husky hooks
  const huskyDir = path.join(fullPath, ".husky");
  const huskyInternalDir = path.join(huskyDir, "_");
  if (!fs.existsSync(huskyInternalDir)) {
    fs.mkdirSync(huskyInternalDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(huskyDir, "pre-commit"),
    generateHuskyPreCommit()
  );
  fs.writeFileSync(
    path.join(huskyInternalDir, "husky.sh"),
    generateHuskySh()
  );
  fs.writeFileSync(path.join(huskyInternalDir, ".gitignore"), "*\n");
  console.log("✓ .husky/pre-commit y .husky/_/husky.sh");

  // Archivos src/
  const mainJsName = `${ORG}-${projectName}.js`;
  fs.writeFileSync(
    path.join(srcDir, mainJsName),
    generateMainEntry(ORG, projectName)
  );
  console.log(`✓ src/${mainJsName}`);

  fs.writeFileSync(
    path.join(srcDir, "root.component.js"),
    generateRootComponent()
  );
  console.log("✓ src/root.component.js");

  fs.writeFileSync(
    path.join(srcDir, "root.component.test.js"),
    generateRootComponentTest()
  );
  console.log("✓ src/root.component.test.js");

  // ── PASO 7: Actualizar package.json ───────────────────────────
  step(7, TOTAL_STEPS, "Actualizando package.json");

  const updatedPkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  updatedPkg.name = `@${ORG}/${projectName}`;
  updatedPkg.scripts = {
    start: `webpack serve --port ${port}`,
    "start:standalone": "webpack serve --env standalone",
    build: "concurrently npm:build:*",
    "build:webpack": "webpack --mode=production",
    analyze: "webpack --mode=production --env analyze",
    lint: "eslint src --ext js",
    format: "prettier --write .",
    "check-format": "prettier --check .",
    test: "cross-env BABEL_ENV=test jest",
    "watch-tests": "cross-env BABEL_ENV=test jest --watch",
    prepare: "husky install",
    coverage: "cross-env BABEL_ENV=test jest --coverage",
  };

  // Asegurar que las versiones requeridas están en el package.json
  updatedPkg.dependencies = updatedPkg.dependencies || {};
  updatedPkg.devDependencies = updatedPkg.devDependencies || {};

  for (const [name, version] of Object.entries(REQUIRED_DEPS)) {
    if (!updatedPkg.dependencies[name]) {
      updatedPkg.dependencies[name] = version;
    }
  }

  for (const [name, version] of Object.entries(REQUIRED_DEV_DEPS)) {
    if (!updatedPkg.devDependencies[name]) {
      updatedPkg.devDependencies[name] = version;
    }
  }

  fs.writeFileSync(pkgPath, JSON.stringify(updatedPkg, null, 2) + "\n");
  console.log("✓ package.json actualizado");

  // ── Resumen final ─────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("  Microfront creado exitosamente");
  console.log("═".repeat(60));
  console.log(`\n  Proyecto : @${ORG}/${projectName}`);
  console.log(`  Ruta     : ${fullPath}`);
  console.log(`  Puerto   : ${port}`);
  console.log("\n  Proximos pasos:");
  console.log(`    cd "${fullPath}"`);
  console.log("    npm start\n");
}

main().catch((err) => {
  console.error("\n✗ Error fatal:", err.message || err);
  process.exit(1);
});
