# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workspace Overview

**AudioScribe** — an audio transcription SaaS that converts M4A files to text via OpenAI Whisper, with a web app and Telegram bot. This workspace contains three related projects:

| Directory | What | Stack |
|---|---|---|
| `m4a-to-notes/` | V1 backend | Cloudflare Workers, Hono, Grammy, Drizzle/Turso, R2 |
| `m4a-to-notes-frontend/` | V1 frontend | Next.js 15, React 19, Clerk, Paddle, Tailwind 4, shadcn/ui |
| `m4a-to-notes-v2/` | **V2 unified app** | Next.js 16, React 19, Inngest, Vercel Blob, Drizzle/Turso |

**V2 is the active codebase.** It consolidates the split V1 backend+frontend into a single Next.js app, replacing Cloudflare Workers with Next.js API routes and Inngest for background jobs, and Vercel Blob for file storage.

## Commands

### m4a-to-notes-v2 (primary)
```bash
npm run dev              # Dev server (Turbopack, port 3000)
npm run dev:staging      # Dev with staging env vars
npm run build            # Runs migrations then builds
npm run type-check       # tsc --noEmit (run after code changes)
npm run test             # vitest run (all tests)
npm run test:watch       # vitest in watch mode
npx vitest run src/services/__tests__/transcriptions.test.ts  # single test file
npm run lint             # ESLint
npm run db:generate      # Drizzle schema codegen (prefer: npx drizzle-kit generate --name <descriptive_name>)
npm run db:migrate       # Run Drizzle migrations
npm run db:studio        # Drizzle Studio GUI
npx inngest-cli@latest dev  # Local Inngest dev server
```

### m4a-to-notes (V1 backend)
```bash
npm run dev              # wrangler dev --local (port 8787)
npm run type-check       # tsc --noEmit
npm run check            # Biome lint + format check
npm run check:fix        # Biome auto-fix
npm run db:migrate:local # Drizzle migrations (local Turso)
npm run db:migrate:prod  # Drizzle migrations (prod Turso)
```

### m4a-to-notes-frontend (V1 frontend)
```bash
npm run dev              # Next.js dev with Turbopack (port 3000)
npm run build            # Production build
npm run check            # Biome lint + format check
npm run check:fix        # Biome auto-fix
```

## V2 Architecture

### API Routes (`src/app/api/`)
All backend logic lives in Next.js API routes: `upload/`, `start-transcription/`, `transcriptions/`, `me/`, `validate-purchase/`, `health/`, `telegram/`, `webhook/` (Paddle + Clerk), `inngest/`, `paddle/`.

### Background Jobs
V2 uses **Inngest** for async workflows. Client at `src/inngest/client.ts` (app id: `m4a-to-notes-v2`), events in `src/inngest/events.ts`, functions registered in `src/app/api/inngest/route.ts`.

Functions in `src/inngest/functions/`:
- `process-transcription.ts` — audio → text via Whisper, triggers summary
- `process-summary.ts` — text → structured summary via GPT
- `process-translation.ts` — translates transcript + summary to target language

**Pattern**: Each function uses step-based execution, `onFailure` DLQ handler to mark DB records as failed, idempotency keys, and concurrency limits.

### Service Layer (`src/services/`)
Class-based services instantiated as singletons in `src/services/index.ts`:
- `TranscriptionsService` — DB CRUD for transcription records
- `TranslationsService` — DB CRUD for translation records
- `UsersService` — User entitlements management
- `ActorsService` — Anonymous actor identity management
- `TrialUsageService` — Daily trial usage tracking
- `ConversationService` — Telegram conversation state
- `AiService` — Whisper transcription, GPT summaries, translation
- `StorageService` — Vercel Blob upload/download
- `WorkflowService` — Dispatches Inngest events (transcription, summary, translation)

### Database
Turso (managed SQLite) with Drizzle ORM. Schema at `src/db/schema.ts`, connection at `src/db/index.ts` (singleton pattern using globalThis for dev). Tables: `transcriptions`, `translations`, `actors`, `trialDailyUsage`, `billingSubscriptions`, `userEntitlements`, `conversations`, `jobs` (deprecated).

### Auth & Middleware
Clerk middleware at `src/proxy.ts` (not `src/middleware.ts`). Excludes `/api/inngest`, `/api/webhook`, `/api/telegram`, `/api/health` from Clerk session parsing.

**Dual-identity pattern**: Signed-in users are identified by `userId` (Clerk). Anonymous/trial users get an `ownerId` (actor ID from cookie). API routes check both: `userId ? transcription.userId === userId : transcription.ownerId === actorId`. Translation features are signed-in only.

### Testing
Vitest with in-memory SQLite (`better-sqlite3`) for database tests. Test helpers at `src/test/db.ts` (creates in-memory DB with schema) and `src/test/setup.ts` (silent logger). Tests live in `__tests__/` directories next to source files.

## Code Conventions

- **Imports**: Use `@/` path alias (maps to `src/`)
- **Formatting**: Biome with tabs, double quotes (all three projects share this via `biome.json`)
- **Linting**: V2 uses ESLint + Biome; V1 backend/frontend use Biome only
- **Components**: shadcn/ui in `src/components/ui/`, custom components alongside
- **Naming**: kebab-case files, PascalCase components, camelCase functions/variables
- **TypeScript**: Strict mode enabled in V2
- **Styling**: Tailwind CSS 4, use `cn()` utility for conditional classes
- **Migrations**: Always use `npx drizzle-kit generate --name <descriptive_name>` instead of `npm run db:generate` so migration files have readable names (e.g. `0013_add_translations_table.sql`)
