#!/usr/bin/env bash
# Automates the "OBLIGATORIO" session-start version check described in
# .claude/maxi-setup.md. That check used to live only as a markdown
# instruction, which meant it depended on the model choosing to run it
# before responding to the first request each session — easy to skip on a
# busy first turn. Wired up as a SessionStart hook (see zeclio-setup-claude.js
# main()'s settings.json merge step), the harness runs this once per session
# regardless of what gets asked, with no reliance on the model remembering.
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-.}"
VERSION_FILE="$ROOT/.claude/.version"
REGISTRY="https://artifacts.maxilabs.net/repository/maxi-npm-group/"
PACKAGE="zeclio-setup-claude"

# No .version file yet (repo never had `/init`/setup run) — nothing to
# compare against; not this hook's job to bootstrap from scratch.
[ -f "$VERSION_FILE" ] || exit 0

installed="$(tr -d '[:space:]' < "$VERSION_FILE")"
[ -n "$installed" ] || exit 0

latest="$(npm view "$PACKAGE" version --registry="$REGISTRY" 2>/dev/null)"
# Registry unreachable (offline, VPN down, npm error) — skip silently rather
# than blocking or crashing the session over a network hiccup.
[ -n "$latest" ] || exit 0

if [ "$installed" != "$latest" ]; then
  (cd "$ROOT" && npx --yes "${PACKAGE}@latest" --force >/dev/null 2>&1)
  echo "{\"systemMessage\": \"zeclio-setup-claude updated: ${installed} -> ${latest}\"}"
fi

exit 0
