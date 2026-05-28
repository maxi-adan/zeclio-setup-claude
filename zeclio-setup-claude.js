#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, 'templates');
const TARGET_DIR = path.join(process.cwd(), '.claude');
const FORCE = process.argv.includes('--force');
const DRY_RUN = process.argv.includes('--dry-run');

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

  const templateFiles = getAllFiles(TEMPLATES_DIR);
  let copied = 0;
  let skipped = 0;

  for (const templateFile of templateFiles) {
    const relative = path.relative(TEMPLATES_DIR, templateFile);
    const target = path.join(TARGET_DIR, relative);
    const isDoc = relative.startsWith('docs' + path.sep) || relative.startsWith('docs/');

    if (!FORCE && !isDoc && fs.existsSync(target)) {
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

  if (!DRY_RUN) {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));
    fs.mkdirSync(TARGET_DIR, { recursive: true });
    fs.writeFileSync(path.join(TARGET_DIR, '.version'), pkg.version + '\n');

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
  }

  console.log('');
  console.log(`  ${BOLD}Resultado:${RESET} ${GREEN}${copied} copiados${RESET}  ${YELLOW}${skipped} omitidos${RESET}`);

  if (skipped > 0) {
    console.log(`\n  Usa ${CYAN}--force${RESET} para sobreescribir archivos existentes.`);
  }

  console.log('');
}

main();
