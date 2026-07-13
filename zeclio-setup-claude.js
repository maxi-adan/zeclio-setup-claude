#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, 'templates');
const TEMPLATES_ROOT_DIR = path.join(__dirname, 'templates-root');
const TARGET_DIR = path.join(process.cwd(), '.claude');
const TARGET_ROOT_DIR = process.cwd();
const FORCE = process.argv.includes('--force');
const DRY_RUN = process.argv.includes('--dry-run');

// Archivos que jamás se sobreescriben aunque se pase --force.
// Son archivos del proyecto (no del tool) que acumulan contenido específico del repo.
const NEVER_OVERWRITE = [
  'SETUP.md',
  '.specify/memory/constitution.md',
];

// Archivos del tool que siempre se sobreescriben, incluso sin --force.
// Son instrucciones de plataforma que deben mantenerse en sincronía con cada versión.
const ALWAYS_OVERWRITE = [
  'maxi-setup.md',
];

const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

function log(symbol, color, msg) {
  console.log(`  ${color}${symbol}${RESET}  ${msg}`);
}

function getAllFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

function main() {
  console.log(`\n${BOLD}${CYAN}  Maxi — setup-claude${RESET}`);
  console.log(`  Bootstrapping .claude structure in: ${process.cwd()}\n`);

  if (DRY_RUN) {
    console.log(`  ${YELLOW}[dry-run] No se escribirá ningún archivo${RESET}\n`);
  }

  let copied = 0;
  let skipped = 0;

  // alwaysOverwritePrefixes: '*' sobreescribe todo, o array de prefijos de ruta posix.
  // NEVER_OVERWRITE siempre tiene prioridad máxima (ni --force ni '*' lo tocan).
  function processTemplates(srcDir, destDir, alwaysOverwritePrefixes) {
    if (!fs.existsSync(srcDir)) return;
    const prefixes = Array.isArray(alwaysOverwritePrefixes)
      ? alwaysOverwritePrefixes
      : alwaysOverwritePrefixes ? [alwaysOverwritePrefixes] : [];
    const overwriteAll = prefixes.includes('*');

    for (const templateFile of getAllFiles(srcDir)) {
      const relative = path.relative(srcDir, templateFile);
      const target = path.join(destDir, relative);
      const relativePosix = relative.replace(/\\/g, '/');

      const neverOverwrite = NEVER_OVERWRITE.some(p => relativePosix === p);
      if (neverOverwrite && fs.existsSync(target)) {
        log('~', YELLOW, `omitido   ${relative}`);
        skipped++;
        continue;
      }

      const alwaysOverwrite = overwriteAll ||
        ALWAYS_OVERWRITE.some(p => relativePosix === p) ||
        prefixes.some(prefix =>
          prefix !== '*' && (
            relative.startsWith(prefix + path.sep) ||
            relativePosix.startsWith(prefix + '/')
          )
        );

      if (!FORCE && !alwaysOverwrite && fs.existsSync(target)) {
        log('~', YELLOW, `omitido   ${relative}`);
        skipped++;
        continue;
      }

      if (!DRY_RUN) {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(templateFile, target);
      }

      log('+', GREEN, `copiado   ${relative}`);
      copied++;
    }
  }

  // templates/ → .claude/: todos los archivos son de plataforma, siempre se actualizan
  processTemplates(TEMPLATES_DIR, TARGET_DIR, '*');

  // templates-root/ → ./: solo se copian si no existen, excepto los scripts y
  // comandos del git-extension que son de plataforma y deben mantenerse al día
  processTemplates(TEMPLATES_ROOT_DIR, TARGET_ROOT_DIR, [
    '.specify/extensions/git/scripts',
    '.specify/extensions/git/commands',
    '.specify/extensions/git/extension.yml',
  ]);

  if (!DRY_RUN) {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));
    fs.mkdirSync(TARGET_DIR, { recursive: true });
    fs.writeFileSync(path.join(TARGET_DIR, '.version'), pkg.version + '\n');

    // .claude/settings.json is NOT a plain template file (unlike docs/skills,
    // it's a config file individual projects are expected to accumulate their
    // own hooks/permissions into over time) — a blind overwrite here would
    // silently destroy any project-specific customization on the next
    // `npx zeclio-setup-claude --force` run. Instead this merges just the
    // version-check SessionStart hook in, same append-only philosophy as the
    // CLAUDE.md injections below: read what's there (or start empty), add our
    // entry only if missing, leave everything else untouched.
    const settingsPath = path.join(TARGET_DIR, 'settings.json');
    const HOOK_COMMAND = 'bash .claude/hooks/check-zeclio-setup-version.sh';
    let settings = {};
    let settingsUnreadable = false;
    if (fs.existsSync(settingsPath)) {
      try {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      } catch (e) {
        settingsUnreadable = true;
      }
    }
    if (settingsUnreadable) {
      log('~', YELLOW, 'omitido   .claude/settings.json (JSON inválido — revisar manualmente, no se mergeó el hook)');
    } else {
      settings.hooks = settings.hooks || {};
      settings.hooks.SessionStart = settings.hooks.SessionStart || [];
      const alreadyWired = settings.hooks.SessionStart.some(group =>
        Array.isArray(group.hooks) && group.hooks.some(h => h.command === HOOK_COMMAND)
      );
      if (!alreadyWired) {
        settings.hooks.SessionStart.push({
          hooks: [
            {
              type: 'command',
              command: HOOK_COMMAND,
              shell: 'bash',
              timeout: 20,
              statusMessage: 'Checking zeclio-setup-claude version...',
            },
          ],
        });
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
        log('+', GREEN, 'hook SessionStart de verificación de versión añadido en .claude/settings.json');
      }
    }

    const claudePath = path.join(process.cwd(), 'CLAUDE.md');
    const reference = '\n@.claude/maxi-setup.md\n';
    if (fs.existsSync(claudePath)) {
      const content = fs.readFileSync(claudePath, 'utf-8');
      if (!content.includes('@.claude/maxi-setup.md')) {
        fs.appendFileSync(claudePath, reference);
        log('+', GREEN, 'referencia añadida en CLAUDE.md → @.claude/maxi-setup.md');
      }
    } else {
      fs.writeFileSync(claudePath, '@.claude/maxi-setup.md\n');
      log('+', GREEN, 'creado   CLAUDE.md → @.claude/maxi-setup.md');
    }

    const memoryRef = '@project-state.md';
    const claudeContentAfterSetup = fs.readFileSync(claudePath, 'utf-8');
    if (!claudeContentAfterSetup.includes(memoryRef)) {
      fs.appendFileSync(claudePath, '\n' + memoryRef + '\n');
      log('+', GREEN, 'referencia añadida en CLAUDE.md → @project-state.md');
    }

    const projectStatePath = path.join(TARGET_ROOT_DIR, 'project-state.md');
    if (!fs.existsSync(projectStatePath)) {
      fs.writeFileSync(projectStatePath,
        '# Estado del proyecto\n\n' +
        'Este archivo documenta lo que se ha construido. Cualquier desarrollador que clone el repo parte de aquí.\n' +
        'Actualizar cada vez que se complete una feature o se agregue un componente reutilizable.\n\n' +
        '## Componentes existentes\n\n' +
        '| Archivo | Descripción |\n' +
        '|---|---|\n' +
        '| _(vacío — completar al construir)_ | |\n\n' +
        '## Features completadas\n\n' +
        '| Spec | Feature | Estado |\n' +
        '|---|---|---|\n' +
        '| _(vacío)_ | | |\n\n' +
        '## Patrones establecidos en este proyecto\n\n' +
        '_Agregar aquí decisiones de diseño locales que no están en la constitution global._\n'
      );
      log('+', GREEN, 'creado   project-state.md');
    }

    const updateRuleMarker = 'actualizar `project-state.md`';
    const updateRuleText =
      '\n- **Al terminar cualquier tarea**, actualizar este archivo si algo cambió en la arquitectura del proyecto: ' +
      'nueva ruta registrada, nuevo módulo compartido, nuevo patrón establecido, nueva regla de la plataforma descubierta. ' +
      'No registrar cambios de código — eso es responsabilidad del historial de git.\n' +
      '- **Al terminar cualquier tarea que cree un componente o complete una feature**, actualizar `project-state.md`: ' +
      'agregar el componente en la tabla con su ruta y descripción de una línea, o la feature en la tabla de features completadas ' +
      'con referencia a su spec. No esperar a que se pida — hacerlo siempre al finalizar.\n';
    const claudeContent = fs.readFileSync(claudePath, 'utf-8');
    if (!claudeContent.includes(updateRuleMarker)) {
      fs.appendFileSync(claudePath, updateRuleText);
      log('+', GREEN, 'reglas de mantenimiento añadidas en CLAUDE.md');
    }

    const versionCheckMarker = 'OBLIGATORIO al inicio de cada sesión — verificar versión de zeclio-setup-claude';
    const versionCheckRule =
      '\n- **OBLIGATORIO al inicio de cada sesión — verificar versión de zeclio-setup-claude**: ' +
      'Leer `.claude/.version`, consultar `npm view zeclio-setup-claude version --registry=https://artifacts.maxilabs.net/repository/maxi-npm-group/`, ' +
      'y si difieren ejecutar `npx zeclio-setup-claude@latest --force` sin preguntar. ' +
      'Hacer esto ANTES de responder cualquier solicitud.\n';
    const claudeContentForVersionCheck = fs.readFileSync(claudePath, 'utf-8');
    if (!claudeContentForVersionCheck.includes(versionCheckMarker)) {
      fs.appendFileSync(claudePath, versionCheckRule);
      log('+', GREEN, 'regla de verificación de versión añadida en CLAUDE.md');
    }
  }

  console.log('');
  console.log(`  ${BOLD}Resultado:${RESET} ${GREEN}${copied} copiados${RESET}  ${YELLOW}${skipped} omitidos${RESET}`);

  if (skipped > 0) {
    console.log(`\n  Usa ${CYAN}--force${RESET} para sobreescribir archivos existentes.`);
  }

  console.log('');
}

main();
