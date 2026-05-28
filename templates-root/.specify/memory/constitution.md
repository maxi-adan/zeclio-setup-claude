<!-- SYNC IMPACT REPORT
Version change: (template / unreleased) → 1.0.0
Modified principles: N/A — initial constitution, no prior version.
Added sections:
  - Core Principles (I–V)
  - Code Quality & Style
  - Development Workflow
  - Governance
Removed sections: N/A — initial constitution.
Templates reviewed:
  - .specify/templates/plan-template.md ✅ compatible — Constitution Check gate present; gates derive from principles below.
  - .specify/templates/spec-template.md ✅ compatible — user stories and requirements structure aligns with principles.
  - .specify/templates/tasks-template.md ✅ compatible — phase/story structure aligns with Test-Driven Logic and Simplicity principles.
  - .specify/templates/commands/ — no command files found; nothing to update.
Follow-up TODOs: None — all placeholders resolved.
-->

# Spec Kit Explorer Constitution

## Core Principles

### I. Component-First Design

Every UI feature MUST be built from small, composable React components. Each
component has a single responsibility and MUST be independently renderable
without relying on hidden global side effects. State is lifted only as high as
necessary to satisfy requirements; no higher.

### II. Explicit Typing

All component props and function signatures MUST be explicitly typed using
TypeScript types or rigorous JSDoc annotations. Implicit `any` types are
prohibited. Every public interface boundary requires a declared type contract.

### III. Test-Driven Logic

Non-trivial business logic and utility functions MUST have tests written and
confirmed failing before implementation begins (Red → Green → Refactor). UI
components with conditional rendering or dynamic state MUST include rendering
tests. Tests are written first; implementation follows only after a failing test
exists.

### IV. Performance Consciousness

Unnecessary re-renders are prohibited. React optimization primitives (`memo`,
`useCallback`, `useMemo`) MUST only be applied when profiling confirms a
measurable need — never preemptively. Each new runtime dependency MUST be
justified by its impact on bundle size. Vite build output MUST not regress
on bundle size without documented justification.

### V. Simplicity (YAGNI)

The simplest solution that satisfies the stated requirement MUST be chosen.
Premature abstractions, speculative features, and over-engineered helpers are
prohibited. Three similar lines of code are preferable to a premature
extraction. Abstractions introduced for hypothetical future needs are a
constitution violation.

## Code Quality & Style

All code merged to the main branch MUST pass ESLint checks without suppressed
warnings. Any suppression requires an inline justification comment referencing
why the rule does not apply. Formatting is enforced by the project ESLint
configuration. `TODO` comments MUST NOT be merged without a linked issue or
ticket reference.

## Development Workflow

Feature branches are REQUIRED for all changes; direct commits to `main` are
prohibited. Pull requests MUST be reviewed by at least one other contributor
before merge. The Vite build (`npm run build`) MUST succeed and the dev server
(`npm run dev`) MUST be manually validated for any UI-impacting change before
the PR is considered complete. CI lint checks MUST pass before merging.

## Governance

This constitution supersedes all other development practices. Amendments
require: (1) a documented rationale, (2) a version bump following semantic
versioning rules (MAJOR for principle removals/redefinitions; MINOR for new
principles or material expansions; PATCH for clarifications and wording fixes),
and (3) propagation of changes across all dependent templates listed in the
Sync Impact Report. Compliance is verified at the Constitution Check gate in
every implementation plan. Complexity violations MUST be justified in the
plan's Complexity Tracking table before implementation work begins.

**Version**: 1.0.0 | **Ratified**: 2026-05-14 | **Last Amended**: 2026-05-14
