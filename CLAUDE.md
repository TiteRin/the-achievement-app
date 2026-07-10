# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Mobile-first web app for logging daily accomplishments with unconditionally positive feedback (no punitive streaks, no broken chains on a missed day). Full specs are in [instructions.txt](instructions.txt).

Status: domain layer, Prisma/Postgres infrastructure, and credentials auth are implemented (Phases 0–4). Magic-link sign-in, application-layer wiring of the main UI to the backend (the `/` page is still the Phase 1 mock), and the admin back-office are not yet built — check `src/` before assuming a layer exists.

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

docker compose up -d    # local Postgres for dev (port from POSTGRES_PORT in .env, defaults to 5432)
npx prisma migrate dev  # apply schema migrations
npx prisma generate     # regenerate the client after editing schema.prisma
npx prisma studio       # browse the local DB
```

`.env` also needs `AUTH_SECRET` (see `.env.example`; generate with `openssl rand -base64 33`).

## Architecture

Domain-Driven Design, organized by layer under `src/`:

- `src/domain/{user,task}/` — entities and repository *interfaces* only, no framework/ORM imports. Core rule: a `Task` belongs to one `User` and is get-or-created by `(userId, label)`; each log creates a `TaskLog` under that task. The "day" a log belongs to (for the daily counter and for what can still be deleted) is derived from `TaskLog.loggedAt` converted into `User.timezone` — not UTC midnight. A log can only be deleted while it's still "today" for that user; past logs are immutable.
- `src/application/` — use cases (`log-task`, `remove-today-log`, `list-today-tasks`, admin `list-accounts` / `list-tasks-with-stats`) that orchestrate domain objects via the repository interfaces. This is the layer route handlers/Server Actions call into — they should not talk to Prisma directly.
- `src/infrastructure/prisma/` — Prisma schema and repository implementations (satisfying the `src/domain` interfaces). Prisma 7: config lives in `prisma.config.ts` at the repo root (schema/migrations paths, `DATABASE_URL`), not in `schema.prisma` or `package.json`. The client is generated as TS source into `src/infrastructure/prisma/generated/` (gitignored, regenerate with `npx prisma generate`) and requires a driver adapter — `PrismaClient` is constructed with `@prisma/adapter-pg` in `src/infrastructure/prisma/client.ts`, it does not read `DATABASE_URL` implicitly. Repositories map Prisma records to domain entities via the entities' own `create()` factories; `Task` also stores a derived `labelKey` (normalized, lowercased) with a `@@unique([userId, labelKey])` constraint so case/whitespace-insensitive dedup is enforced by Postgres, not just app code.
- `src/infrastructure/auth/` — Auth.js (NextAuth v5, still beta — `next-auth@beta`) config in `auth.ts`, exposed at `src/app/api/auth/[...nextauth]/route.ts`. Credentials provider only for now (email/password), JWT session strategy — deliberately **no** `@auth/prisma-adapter` (its schema doesn't map to our domain `User`, and its peer range doesn't cover Prisma 7 yet); `authorize()` calls `verify-credentials.ts`, which queries the `users` table directly. `password.ts` hashes with Node's built-in `scrypt` (no extra dependency). `register-user.ts` does the signup insert (with `passwordHash`) and relies on the DB's unique `email` constraint (catches Prisma error `P2002`) rather than a check-then-insert race. `types.d.ts` augments `@auth/core/types`/`@auth/core/jwt` (not `"next-auth"` — those types are re-exported, not declared there, so augmenting `"next-auth"` silently no-ops) to carry `timezone`/`role` on `User`/`Session`/`JWT`. Magic-link (Email provider) is not implemented yet — it will need real token/adapter storage, unlike Credentials.
- `src/app/` — Next.js App Router routes/pages, plus `/admin/*` for the role-gated back-office (accounts list, tasks list with log stats).
- `src/components/` — UI: `task-input`, `feedback-message`, `task-list-item`, `daily-counter`, `celebration-animation`. Animations use `motion` (Framer Motion) — e.g. zoom-in-out on log, positive-message rotation.

Never write domain/application code that imports Prisma or Next.js types directly — repository interfaces are the seam; concrete Prisma repositories implement them in `src/infrastructure`.

### Testing approach

TDD for the domain and application layers: write the Vitest test first (red), then implement (green). Vitest + Testing Library cover unit/domain logic and synchronous components (async Server Components aren't supported by Vitest — use Playwright e2e for those). Playwright e2e covers full flows (login → log a task → see feedback/counter → delete today's log).

Tests live under `tests/`, mirroring the `src/` tree (e.g. `src/domain/task/task.entity.ts` ↔ `tests/domain/task/task.entity.test.ts`) — not colocated next to the source file. Import from source via the `@/*` alias (e.g. `@/domain/task/task.entity`), not relative paths.

`src/infrastructure/prisma/*.repository.ts` are covered by integration tests (`tests/infrastructure/prisma/`) that run against the real local Postgres (`docker compose up -d`, migrated) rather than mocks — these files start with `// @vitest-environment node` since they don't need jsdom. Each test file cleans up only the rows it created, scoped by a per-file email suffix (e.g. `@task-repo.test.local`) deleted `afterEach`, so parallel test files sharing the same DB don't clobber each other.

## Hosting constraint

Self-hosted only (Docker/Portainer or OVH) — **never Vercel or Vercel-specific APIs**. This is a deliberate, non-negotiable choice by the project owner, not an oversight. `next.config.ts` sets `output: "standalone"` for this reason; the `Dockerfile` is a standard multi-stage standalone build.

## Commits & branching

- Claude never runs `git commit` (or anything that creates a commit, e.g. `git rebase --continue`, `git merge --no-edit`). Committing is the user's action.
- At the end of a coding session, give the commit message as a ready-to-paste `git commit -m "..."` command line — don't just describe the message.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/): `<type>[optional scope]: <description>` (types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`).
- Branch names follow [Conventional Branch](https://conventionalbranch.org/): `main` and `develop` are the only bare names; all other work lives on `feature/…`, `bugfix/…`, `hotfix/…`, `release/…`, or `chore/…` (kebab-case description).
- `main` is protected — no direct commits, no direct pushes.
- Every feature lives on its own `feature/…` branch and merges into `develop`, never straight into `main`.
