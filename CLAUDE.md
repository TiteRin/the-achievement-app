# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Mobile-first web app for logging daily accomplishments with unconditionally positive feedback (no punitive streaks, no broken chains on a missed day). Full specs are in [instructions.txt](instructions.txt).

Status: domain layer, Prisma/Postgres infrastructure, credentials auth, the main `/` page, the admin back-office, and self-hosted Docker deployment are fully wired end-to-end (Phases 0–7). Magic-link sign-in is the only piece from the original plan not yet built — check `src/` before assuming a layer exists.

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
- `src/application/` — use cases (`log-task`, `remove-today-log`, `list-today-tasks`, admin `list-accounts` / `list-tasks-with-stats`) that orchestrate domain objects via the repository interfaces and return plain DTOs (never raw entities — entities have private constructors and aren't meaningful to serialize across the Server Action boundary). Called from `src/app/actions.ts` / `src/app/page.tsx` / `src/app/admin/*`, which resolve `userId`/`timezone`/`role` from `auth()` — use cases themselves take those as params rather than reading the session, so they stay framework-free and unit-testable with the `tests/support/in-memory-repositories.ts` fakes. `list-tasks-with-stats` counts *all-time* logs per task (`TaskLogRepository.countByTaskId`), unlike the user-facing `list-today-tasks` which is scoped to today.
- `src/infrastructure/prisma/` — Prisma schema and repository implementations (satisfying the `src/domain` interfaces). Prisma 7: config lives in `prisma.config.ts` at the repo root (schema/migrations paths, `DATABASE_URL`), not in `schema.prisma` or `package.json`. The client is generated as TS source into `src/infrastructure/prisma/generated/` (gitignored, regenerate with `npx prisma generate`) and requires a driver adapter — `PrismaClient` is constructed with `@prisma/adapter-pg` in `src/infrastructure/prisma/client.ts`, it does not read `DATABASE_URL` implicitly. Repositories map Prisma records to domain entities via the entities' own `create()` factories; `Task` also stores a derived `labelKey` (normalized, lowercased) with a `@@unique([userId, labelKey])` constraint so case/whitespace-insensitive dedup is enforced by Postgres, not just app code.
- `src/infrastructure/auth/` — Auth.js (NextAuth v5, still beta — `next-auth@beta`) config in `auth.ts`, exposed at `src/app/api/auth/[...nextauth]/route.ts`. Credentials provider only for now (email/password), JWT session strategy — deliberately **no** `@auth/prisma-adapter` (its schema doesn't map to our domain `User`, and its peer range doesn't cover Prisma 7 yet); `authorize()` calls `verify-credentials.ts`, which queries the `users` table directly. `password.ts` hashes with Node's built-in `scrypt` (no extra dependency). `register-user.ts` does the signup insert (with `passwordHash`) and relies on the DB's unique `email` constraint (catches Prisma error `P2002`) rather than a check-then-insert race. `types.d.ts` augments `@auth/core/types`/`@auth/core/jwt` (not `"next-auth"` — those types are re-exported, not declared there, so augmenting `"next-auth"` silently no-ops) to carry `timezone`/`role` on `User`/`Session`/`JWT`. Magic-link (Email provider) is not implemented yet — it will need real token/adapter storage, unlike Credentials. `admin-emails.ts` (`isConfiguredAdminEmail`, pure — parses `ADMIN_EMAILS` from env on every call, no memoization, so it's freely stubbable in tests) and `sync-admin-role.ts` (`syncConfiguredAdminRole`, the one function allowed to write a role) implement admin promotion — see the `src/app/` bullet below for the behavior.
- `src/app/` — Next.js App Router routes/pages. `/admin/*` (accounts list, tasks list with all-time log stats) is gated by `src/app/admin/layout.tsx`, which redirects to `/login` if unauthenticated and to `/` if `session.user.role !== "admin"`. Admin promotion is config-driven: `authorize()` in `auth.ts` calls `syncConfiguredAdminRole` right after `verifyCredentials` succeeds, which promotes the account to `admin` if its email is in the `ADMIN_EMAILS` env var (comma-separated, case-insensitive) and it isn't already — **promotion only, never automatic demotion** (removing an email from `ADMIN_EMAILS`, or clearing the var entirely by mistake, never strips an existing admin's role; that's deliberate — see `sync-admin-role.ts`'s tests for the exact contract). Demoting someone is still a manual `UPDATE users SET role = 'user' WHERE email = ...`. Because this runs inside `authorize()`, it covers both existing accounts (promoted on next login) and brand-new signups (the signup form calls `signIn` immediately after `registerUser`, so promotion happens on that auto-login — `register-user.ts` itself never sets `role`, it stays on Prisma's `@default(user)`). Role is still baked into the JWT only at sign-in (`auth.ts`'s `jwt` callback only reads `user.role` when `user` is present), so a freshly-promoted account must sign out and back in before `/admin` and the "Back-office" link (in `daily-log-board.tsx`'s footer) reflect it — same caveat as before, `ADMIN_EMAILS` doesn't change that.
- `src/components/` — UI: `task-input`, `feedback-message`, `task-list-item`, `daily-counter`, `celebration-animation`, `sign-out-button`. Animations use `motion` (Framer Motion) — e.g. zoom-in-out on log, positive-message rotation.

Never write domain/application code that imports Prisma or Next.js types directly — repository interfaces are the seam; concrete Prisma repositories implement them in `src/infrastructure`.

`daily-log-board.tsx` drives the main page with real optimistic UI: `useOptimistic` + `useTransition` wrap the `logTaskAction`/`removeTodayLogAction` Server Actions (which call `refresh()` from `next/cache` server-side to revalidate). Two lessons learned the hard way here, worth keeping in mind before touching this file or adding similar optimistic flows elsewhere:
  - The optimistic placeholder and the server-confirmed item must share the same identity/key. `LoggedTask.id` is the task's normalized `labelKey`, *not* the database task id — the database id doesn't exist yet when the optimistic entry is created, so keying on it causes the optimistic and confirmed items to be treated as two different list entries (briefly rendering both) instead of one item updating in place.
  - `AnimatePresence`/`exit` animations on list items got stuck mid-animation (ghost DOM nodes lingering after the item should be gone) when combined with the optimistic-update → `refresh()` → re-render cycle — likely two commits landing close enough together to desync Framer Motion's presence tracking. `TaskListItem` and the list wrapper intentionally have no `exit`/`AnimatePresence`, only mount-in (`initial`/`animate`) and `layout`, which don't have this failure mode. `DailyCounter` had the analogous bug with `AnimatePresence` + `key={count}` remounting (two numbers stuck on screen at once) — fixed by switching to a single persistent node pulsed via `useAnimation()` on `count` change instead of a mount/unmount transition.

### Testing approach

TDD for the domain and application layers: write the Vitest test first (red), then implement (green). Vitest + Testing Library cover unit/domain logic and synchronous components (async Server Components aren't supported by Vitest — use Playwright e2e for those). Playwright e2e (`e2e/log-task.spec.ts`, `e2e/admin.spec.ts`) covers full flows: signup → log a task → delete → sign out/in, unauthenticated redirect, and admin access control (non-admin redirected, admin can reach `/admin/accounts` and `/admin/tasks`).

Tests live under `tests/`, mirroring the `src/` tree (e.g. `src/domain/task/task.entity.ts` ↔ `tests/domain/task/task.entity.test.ts`) — not colocated next to the source file. Import from source via the `@/*` alias (e.g. `@/domain/task/task.entity`), not relative paths.

`src/infrastructure/prisma/*.repository.ts` are covered by integration tests (`tests/infrastructure/prisma/`) that run against the real local Postgres (`docker compose up -d`, migrated) rather than mocks — these files start with `// @vitest-environment node` since they don't need jsdom. Each test file cleans up only the rows it created, scoped by a per-file email suffix (e.g. `@task-repo.test.local`) deleted `afterEach`, so parallel test files sharing the same DB don't clobber each other.

`e2e/*.spec.ts` do **not** import the app's Prisma client (`@/infrastructure/prisma/client` or the generated client) — Playwright's TS transform can't handle the generated client's ESM-only `import.meta` syntax (`SyntaxError: Cannot use 'import.meta' outside a module`). For DB setup/cleanup in e2e specs, use the `pg` package directly with a raw query instead (see `e2e/log-task.spec.ts`); `playwright.config.ts` loads `.env` via `dotenv/config` so `DATABASE_URL` is available there. This also keeps e2e tests properly black-box (driving the app through the browser, not reaching into its internals).

## Hosting constraint

Self-hosted only (Docker/Portainer or OVH) — **never Vercel or Vercel-specific APIs**. This is a deliberate, non-negotiable choice by the project owner, not an oversight. `next.config.ts` sets `output: "standalone"` for this reason; the `Dockerfile` is a standard multi-stage standalone build.

### Deployment

`docker-compose.yml` (dev-only: just Postgres, for `npm run dev`) and `docker-compose.prod.yml` (full stack: Postgres + a one-shot `migrate` job + the app) are separate files — don't conflate them. `Dockerfile` has three targets: `builder` (full `node_modules`, runs `prisma generate` against a dummy build-time `DATABASE_URL` then `next build`), `migrator` (= `builder` + `CMD npx prisma migrate deploy`), and `runner` (slim, `output: standalone` only, `CMD node server.js`). `migrator` deliberately reuses the full `builder` environment rather than cherry-picking the Prisma CLI into a slim image — the CLI needs `@prisma/engines` and other files that are easy to miss copying individually, confirmed by hitting exactly that `MODULE_NOT_FOUND` while building this out.

**`AUTH_TRUST_HOST=true` is required at runtime** (set in `docker-compose.prod.yml`) — without it, Auth.js v5 rejects every request with `UntrustedHost` as soon as the app isn't running on Vercel (which sets this automatically). Confirmed by actually running the built image against the real Postgres container, not just by building it — the image built fine and only failed at request time.

Both compose files pin an explicit top-level `name:` (`my-achievments` for dev, `myachievments-prod` for the deploy stack). Without it, Compose derives the project name from the directory — the same directory for both files — so they'd resolve to the same project, network, and **volume**. Concretely: running `docker compose -f docker-compose.prod.yml up` would silently reuse dev's already-initialized `postgres-data` volume instead of creating its own, so `POSTGRES_PASSWORD` from `.env` would have no effect (Postgres only applies `POSTGRES_USER`/`POSTGRES_PASSWORD` on first init of an empty data directory) and `migrate` would fail with a Postgres auth error (`P1000`) against credentials that look right but don't match what's actually in the (dev's) volume. Hit this for real, not hypothetically — fixed by pinning distinct names, not by telling people to remember `-p`.

`public/` has no real assets (favicon is served from `src/app/favicon.ico` via the App Router convention) but is kept with a tracked `.gitkeep` — Docker's `COPY --from=builder /app/public ./public` fails outright if the directory doesn't exist, and git doesn't track empty directories.

### CI/CD

`.github/workflows/ci.yml` runs 4 jobs in parallel on **every PR regardless of base branch** (`pull_request` has no `branches:` filter — deliberate, so a stacked PR targeting an unmerged feature branch still gets checked, not just PRs targeting `main`/`develop`) and on push to `main`/`develop`: `lint`, `build` (needs a dummy `DATABASE_URL` for `prisma generate`, same trick as the Dockerfile), `unit-tests` and `e2e` (both spin up a real `postgres:16-alpine` service container, run `prisma generate` **and** `prisma migrate deploy` against it before testing — no mocks, matching how the test suite already works locally; the generate step was missing at first and every DB-touching test failed with `Cannot find module './generated/client'` since that directory is gitignored and only exists after generation — caught by an actual failed CI run, then reproduced locally by deleting `src/infrastructure/prisma/generated/` before fixing it).

**Branch protection** (GitHub → repo Settings → Branches → add a rule for each of `develop` and `main`): enable "Require status checks to pass before merging" and select all 4 job names. Those names only appear in the picker after the workflow has run at least once on a PR/branch — merge the PR that introduces `ci.yml` first, then go configure the rule. Claude can't do this step itself (no `gh` CLI/token in this environment, and it's a repo-admin setting anyway) — it's a one-time manual step.

**Continuous deploy of `develop`**: Portainer here is on a local network/VPN, not reachable from GitHub's hosted runners, so this does *not* use a GitHub Actions → Portainer webhook. Instead, Portainer's own Git-polling ("GitOps updates") pulls from the repo on an interval — outbound-only, no inbound exposure needed:
1. Portainer → Stacks → Add stack → **Repository** as the build method.
2. Repository URL: this repo; Reference: `refs/heads/develop`; Compose path: `docker-compose.prod.yml`.
3. Enable **GitOps updates**, mechanism **Polling**, interval e.g. 5 minutes.
4. Set the stack's environment variables (`POSTGRES_PASSWORD`, `AUTH_SECRET`, `APP_PORT`, `ADMIN_EMAILS`, etc. — see `.env.example`) in the stack's env var UI, not a committed file.

Because `develop` is protected (previous point), whatever Portainer picks up has already passed CI — deployment safety comes from the merge gate, not from Portainer re-running checks. If low-latency/on-push deploys are wanted later instead of polling, the alternative is a self-hosted GitHub Actions runner on the same network as Portainer (can reach it directly) — not set up, since it's meaningfully more infra than polling for not much benefit at this scale.

## Commits & branching

- Claude never runs `git commit` (or anything that creates a commit, e.g. `git rebase --continue`, `git merge --no-edit`). Committing is the user's action.
- At the end of a coding session, give the commit message as a ready-to-paste `git commit -m "..."` command line — don't just describe the message.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/): `<type>[optional scope]: <description>` (types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`).
- Branch names follow [Conventional Branch](https://conventionalbranch.org/): `main` and `develop` are the only bare names; all other work lives on `feature/…`, `bugfix/…`, `hotfix/…`, `release/…`, or `chore/…` (kebab-case description).
- `main` is protected — no direct commits, no direct pushes.
- Every feature lives on its own `feature/…` branch and merges into `develop`, never straight into `main`.
