# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Mobile-first web app for logging daily accomplishments with unconditionally positive feedback (no punitive streaks, no broken chains on a missed day). Full specs are in [instructions.txt](instructions.txt).

Status: early scaffold (Phase 0 complete). Domain, database, and auth layers described below are the target architecture, not yet all implemented — check `src/` before assuming a layer exists.

## Commands

```bash
npm run dev            # dev server, http://localhost:3000
npm run build           # production build (Turbopack, output: standalone)
npm run lint             # ESLint

npm run test              # Vitest, watch mode
npm run test:run          # Vitest, single run
npx vitest run tests/domain/task/task.entity.test.ts   # single test file
npx vitest run -t "test name"          # single test by name

npm run test:e2e                       # Playwright (auto-starts npm run dev)
npx playwright test e2e/some.spec.ts   # single e2e file

docker compose up -d    # local Postgres for dev (see .env.example for DATABASE_URL)
```

## Architecture

Domain-Driven Design, organized by layer under `src/`:

- `src/domain/{user,task}/` — entities and repository *interfaces* only, no framework/ORM imports. Core rule: a `Task` belongs to one `User` and is get-or-created by `(userId, label)`; each log creates a `TaskLog` under that task. The "day" a log belongs to (for the daily counter and for what can still be deleted) is derived from `TaskLog.loggedAt` converted into `User.timezone` — not UTC midnight. A log can only be deleted while it's still "today" for that user; past logs are immutable.
- `src/application/` — use cases (`log-task`, `remove-today-log`, `list-today-tasks`, admin `list-accounts` / `list-tasks-with-stats`) that orchestrate domain objects via the repository interfaces. This is the layer route handlers/Server Actions call into — they should not talk to Prisma directly.
- `src/infrastructure/prisma/` — Prisma schema and repository implementations (satisfying the `src/domain` interfaces).
- `src/infrastructure/auth/` — Auth.js (NextAuth v5) config: Credentials provider first, Email (magic-link) provider added later without touching the rest of auth.
- `src/app/` — Next.js App Router routes/pages, plus `/admin/*` for the role-gated back-office (accounts list, tasks list with log stats).
- `src/components/` — UI: `task-input`, `feedback-message`, `task-list-item`, `daily-counter`, `celebration-animation`. Animations use `motion` (Framer Motion) — e.g. zoom-in-out on log, positive-message rotation.

Never write domain/application code that imports Prisma or Next.js types directly — repository interfaces are the seam; concrete Prisma repositories implement them in `src/infrastructure`.

### Testing approach

TDD for the domain and application layers: write the Vitest test first (red), then implement (green). Vitest + Testing Library cover unit/domain logic and synchronous components (async Server Components aren't supported by Vitest — use Playwright e2e for those). Playwright e2e covers full flows (login → log a task → see feedback/counter → delete today's log).

Tests live under `tests/`, mirroring the `src/` tree (e.g. `src/domain/task/task.entity.ts` ↔ `tests/domain/task/task.entity.test.ts`) — not colocated next to the source file. Import from source via the `@/*` alias (e.g. `@/domain/task/task.entity`), not relative paths.

## Hosting constraint

Self-hosted only (Docker/Portainer or OVH) — **never Vercel or Vercel-specific APIs**. This is a deliberate, non-negotiable choice by the project owner, not an oversight. `next.config.ts` sets `output: "standalone"` for this reason; the `Dockerfile` is a standard multi-stage standalone build.

## Commits & branching

- Claude never runs `git commit` (or anything that creates a commit, e.g. `git rebase --continue`, `git merge --no-edit`). Committing is the user's action.
- At the end of a coding session, give the commit message as a ready-to-paste `git commit -m "..."` command line — don't just describe the message.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/): `<type>[optional scope]: <description>` (types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`).
- Branch names follow [Conventional Branch](https://conventionalbranch.org/): `main` and `develop` are the only bare names; all other work lives on `feature/…`, `bugfix/…`, `hotfix/…`, `release/…`, or `chore/…` (kebab-case description).
- `main` is protected — no direct commits, no direct pushes.
- Every feature lives on its own `feature/…` branch and merges into `develop`, never straight into `main`.
