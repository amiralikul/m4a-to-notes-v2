# Repository Guidelines

## Project Structure & Module Organization
- `src/app/`: Next.js App Router pages and API routes (`*/page.tsx`, `*/route.ts`).
- `src/components/`: shared UI and feature components; low-level primitives live in `src/components/ui/`.
- `src/services/`: business logic (transcriptions, billing, chat, storage) with colocated tests in `src/services/__tests__/`.
- `src/db/`: Drizzle schema and DB wiring; SQL migrations are generated into `drizzle/`.
- `src/inngest/`: background job client/events and functions.
- `src/test/`: shared test helpers (in-memory DB, logger setup).
- `public/`: static assets. High-level design notes live in `ARCHITECTURE.md`.

## Build, Test, and Development Commands
- `npm run dev`: start local dev server with Turbopack.
- `npm run build`: run DB migrations, then create a production build.
- `npm run start`: serve the production build.
- `npm run lint`: run ESLint (`eslint-config-next` + TypeScript rules).
- `npm run type-check`: strict TypeScript check without emit.
- `npm run test`: run Vitest once.
- `npm run test:watch`: run Vitest in watch mode.
- `npm run db:generate` / `npm run db:migrate`: generate/apply Drizzle migrations.

## Coding Style & Naming Conventions
- Language: TypeScript with `strict` mode.
- Formatting conventions follow `biome.json`: tabs for indentation, double quotes, import organization enabled.
- Use `@/` path alias for imports from `src/`.
- Naming: React components in PascalCase (`file-upload.tsx` exports `FileUpload`), hooks as `use-*`, tests as `*.test.ts`.
- Keep API route handlers in `route.ts` files under `src/app/api/...`.

## Testing Guidelines
- Framework: Vitest (`environment: node`, `globals: true`).
- Keep tests near modules in `__tests__/` folders (example: `src/lib/__tests__/validation.test.ts`).
- Reuse `src/test/db.ts` for DB-backed tests and `src/test/setup.ts` for logger setup.
- Run `npm run test` before opening a PR; include regression tests for service logic and route guards.

## Commit & Pull Request Guidelines
- Match existing history: short, imperative, lowercase subjects (e.g., `fix vercel blob issue`, `add concurrency limit`).
- Keep commits focused by concern (UI, API, migrations, background jobs).
- PRs should include: what changed, why, test evidence (`npm run test`, `npm run lint`), and screenshots for UI pages.
- Call out schema or env var changes explicitly and link related issues/tasks.

## Security & Configuration Tips
- Never commit secrets. Use local env files (`.env.development`, `.env.production.local`).
- Drizzle/Turso commands require `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
- Validate webhook/auth changes carefully (`src/app/api/webhook/*`, Clerk, LemonSqueezy).
