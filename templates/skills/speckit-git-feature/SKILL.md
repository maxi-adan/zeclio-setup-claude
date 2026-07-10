---
name: speckit-git-feature
model: haiku
description: Create a feature branch with sequential or timestamp numbering
compatibility: Requires spec-kit project structure with .specify/ directory
metadata:
  author: github-spec-kit
  source: git:commands/speckit.git.feature.md
---

# Create Feature Branch

Create and switch to a new git feature branch for the given specification. This command handles **branch creation only** — the spec directory and files are created by the core `/speckit-specify` workflow.

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Environment Variable Override

If the user explicitly provided `GIT_BRANCH_NAME` (e.g., via environment variable, argument, or in their request), pass it through to the script by setting the `GIT_BRANCH_NAME` environment variable before invoking the script. When `GIT_BRANCH_NAME` is set:
- The script uses the exact value as the branch name, bypassing all prefix/suffix generation
- `--short-name`, `--number`, and `--timestamp` flags are ignored
- `FEATURE_NUM` is extracted from the name if it starts with a numeric prefix, otherwise set to the full branch name

## Prerequisites

- Verify Git is available by running `git rev-parse --is-inside-work-tree 2>/dev/null`
- If Git is not available, warn the user and skip branch creation

## Branch Type Selection

**Before running any script**, collect two mandatory inputs from the user. Ask them sequentially:

**Step A — Type (required):**

> "¿Qué tipo de rama es?
> `feat` — nueva funcionalidad
> `fix` — corrección de bug"

Wait for the answer. Normalize to `feat` or `fix`. Store as `BRANCH_TYPE`.

**Step B — Name (required):**

Based on the feature description, generate a suggested short name (2-4 words, kebab-case, action-noun format). Then ask:

> "¿Cómo la llamamos? Sugerencia: `<suggested-name>`
> (Confirmá con enter o escribí otro nombre)"

Wait for the answer. If the user confirms the suggestion (presses enter, writes "ok", "sí", or repeats the suggestion), use the suggestion. Otherwise use what the user wrote. Clean to kebab-case. Store as `BRANCH_SHORT_NAME`.

**Do NOT proceed to the script until both BRANCH_TYPE and BRANCH_SHORT_NAME are confirmed.**

## Branch Numbering Mode

Determine the branch numbering strategy by checking configuration in this order:

1. Check `.specify/extensions/git/git-config.yml` for `branch_numbering` value
2. Check `.specify/init-options.json` for `branch_numbering` value (backward compatibility)
3. Default to `sequential` if neither exists

## Execution

If `BRANCH_SHORT_NAME` was not provided by the user, generate a concise short name (2-4 words) from the feature description:
- Use action-noun format when possible (e.g., "add-user-auth", "fix-payment-bug")
- Preserve technical terms and acronyms (OAuth2, API, JWT, etc.)

Use `BRANCH_SHORT_NAME` (user-provided or auto-generated) as the `--short-name` / `-ShortName` argument.

Run the appropriate script based on your platform:

- **Bash**: `.specify/extensions/git/scripts/bash/create-new-feature.sh --json --short-name "<BRANCH_SHORT_NAME>" "<feature description>"`
- **Bash (timestamp)**: `.specify/extensions/git/scripts/bash/create-new-feature.sh --json --timestamp --short-name "<BRANCH_SHORT_NAME>" "<feature description>"`
- **PowerShell**: `.specify/extensions/git/scripts/powershell/create-new-feature.ps1 -Json -ShortName "<BRANCH_SHORT_NAME>" "<feature description>"`
- **PowerShell (timestamp)**: `.specify/extensions/git/scripts/powershell/create-new-feature.ps1 -Json -Timestamp -ShortName "<BRANCH_SHORT_NAME>" "<feature description>"`

**IMPORTANT**:
- Do NOT pass `--number` — the script determines the correct next number automatically
- Always include the JSON flag (`--json` for Bash, `-Json` for PowerShell) so the output can be parsed reliably
- You must only ever run this script once per feature
- The JSON output will contain `BRANCH_NAME` and `FEATURE_NUM`

After the script creates the branch (e.g., `003-user-auth`), rename it to include the type prefix:

```bash
git branch -m <BRANCH_NAME> <BRANCH_TYPE>/<BRANCH_NAME>
```

Update `BRANCH_NAME` to `<BRANCH_TYPE>/<BRANCH_NAME>` (e.g., `feat/003-user-auth` or `fix/003-payment-bug`).

## Graceful Degradation

If Git is not installed or the current directory is not a Git repository:
- Branch creation is skipped with a warning: `[specify] Warning: Git repository not detected; skipped branch creation`
- The script still outputs `BRANCH_NAME` and `FEATURE_NUM` so the caller can reference them

## Output

The script outputs JSON with:
- `BRANCH_NAME`: The branch name with type prefix (e.g., `feat/003-user-auth` or `fix/20260319-143022-payment-bug`)
- `FEATURE_NUM`: The numeric or timestamp prefix used (e.g., `003` or `20260319-143022`)