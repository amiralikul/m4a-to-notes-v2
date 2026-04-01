# Rename Transcription Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a user-editable transcription display name that appears across history, dashboard, and detail views while preserving the original uploaded filename.

**Architecture:** Persist a nullable `displayName` on `transcriptions`, expose it in all read models that drive title rendering, and add an owner-scoped rename mutation under the existing `/api/me/transcriptions/[transcriptionId]` route family. UI surfaces should render `displayName ?? filename` and share the same inline rename interaction so cache updates stay consistent between dashboard queries and viewer-history queries.

**Tech Stack:** Next.js App Router, TypeScript, React 19, TanStack Query, Drizzle ORM, Zod, Vitest

---

## File Structure

**Create:**
- `drizzle/<next>_add_transcription_display_name.sql`
- `src/app/api/__tests__/me-transcription-rename-route.test.ts`
- `src/app/api/__tests__/transcription-detail-route.test.ts`
- `src/components/transcription-title-editor.tsx`
- `src/components/__tests__/transcription-title-utils.test.ts`
- `src/components/__tests__/transcription-title-editor.test.tsx`
- `src/components/__tests__/file-upload-history-title.test.tsx`
- `src/app/dashboard/__tests__/list-page-title.test.tsx`
- `src/app/dashboard/__tests__/detail-page-title.test.tsx`
- `src/hooks/use-transcription-rename.ts`
- `src/hooks/__tests__/use-transcription-rename.test.tsx`
- `src/lib/transcription-rename-cache.ts`
- `src/lib/__tests__/transcription-rename-cache.test.ts`

**Modify:**
- `src/db/schema.ts`
- `src/services/transcriptions.ts`
- `src/services/__tests__/transcriptions.test.ts`
- `src/app/api/me/transcriptions/[transcriptionId]/route.ts`
- `src/app/api/me/transcriptions/route.ts`
- `src/app/api/__tests__/me-transcriptions-route.test.ts`
- `src/app/api/transcriptions/[transcriptionId]/detail/route.ts`
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/[id]/page.tsx`
- `src/components/file-upload.tsx`
- `src/components/transcription-title-utils.ts`
- `src/hooks/use-transcription-rename.ts`
- `src/lib/query-keys.ts`

**Relevant existing tests/docs to consult while implementing:**
- `src/app/api/__tests__/me-transcription-delete-route.test.ts`
- `src/test/db.ts`
- `src/lib/query-keys.ts`
- `docs/superpowers/specs/2026-03-20-rename-transcription-design.md`

### Task 1: Add persisted `displayName` support to the transcription model

**Files:**
- Modify: `src/db/schema.ts`
- Modify: `src/services/transcriptions.ts`
- Modify: `src/services/__tests__/transcriptions.test.ts`
- Create: `drizzle/<next>_add_transcription_display_name.sql`

- [ ] **Step 1: Write the failing service test for renaming**

Add tests in `src/services/__tests__/transcriptions.test.ts` that:
- create a transcription with `filename: "meeting.m4a"`
- call a new service method that sets `displayName` to `"Team Sync"`
- assert the updated row has `displayName === "Team Sync"`
- assert `filename` is still `"meeting.m4a"`

Add a second test that proves `findById`, `findByIdForOwner`, or detail/list helpers expose the stored `displayName`.

- [ ] **Step 2: Run the targeted service test to verify RED**

Run: `npm run test -- src/services/__tests__/transcriptions.test.ts`

Expected: FAIL because `displayName` and/or the rename service method do not exist yet.

- [ ] **Step 3: Add the schema field and minimal service support**

Implement only what is needed to pass the new tests:
- add nullable `displayName` to `transcriptions` in `src/db/schema.ts`
- add a focused service method such as `renameForOwner` or `updateDisplayName` in `src/services/transcriptions.ts`
- keep `filename` untouched when renaming
- ensure existing read methods return the new field naturally through the typed row

Generate the migration with:

```bash
npx drizzle-kit generate --name add_transcription_display_name
```

Confirm the generated SQL adds a nullable `display_name` column.

- [ ] **Step 4: Run the targeted service test to verify GREEN**

Run: `npm run test -- src/services/__tests__/transcriptions.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts src/services/transcriptions.ts src/services/__tests__/transcriptions.test.ts drizzle
git commit -m "add transcription display name"
```

### Task 2: Add an owner-scoped rename API and read-model coverage

**Files:**
- Modify: `src/app/api/me/transcriptions/[transcriptionId]/route.ts`
- Modify: `src/app/api/me/transcriptions/route.ts`
- Modify: `src/app/api/transcriptions/[transcriptionId]/detail/route.ts`
- Create: `src/app/api/__tests__/me-transcription-rename-route.test.ts`
- Modify: `src/app/api/__tests__/me-transcriptions-route.test.ts`
- Create: `src/app/api/__tests__/transcription-detail-route.test.ts`

- [ ] **Step 1: Write the failing route tests for rename**

Add `src/app/api/__tests__/me-transcription-rename-route.test.ts` with cases for:
- signed-out owner can rename their own transcription via `PATCH /api/me/transcriptions/[transcriptionId]`
- signed-in owner can rename their own transcription
- whitespace-only title returns `400`
- missing/non-owned transcription returns `404`

Mirror the mocking style from `src/app/api/__tests__/me-transcription-delete-route.test.ts`.

- [ ] **Step 2: Extend list/detail read-model tests before implementation**

Update `src/app/api/__tests__/me-transcriptions-route.test.ts` so the mocked rows include `displayName`, and assert the response includes it for both signed-in and signed-out flows.

Create `src/app/api/__tests__/transcription-detail-route.test.ts` and assert that `GET /api/transcriptions/[transcriptionId]/detail` returns `displayName` alongside `filename` for an owned transcription.

- [ ] **Step 3: Run the targeted API tests to verify RED**

Run:

```bash
npm run test -- src/app/api/__tests__/me-transcription-rename-route.test.ts src/app/api/__tests__/me-transcriptions-route.test.ts src/app/api/__tests__/transcription-detail-route.test.ts
```

Expected: FAIL because `PATCH` does not exist and list/detail mapping does not expose `displayName`.

- [ ] **Step 4: Implement the minimal API changes**

In `src/app/api/me/transcriptions/[transcriptionId]/route.ts`:
- add `PATCH` with `auth: "optional"`
- parse `{ displayName: string }` with Zod
- trim input
- reject empty trimmed values with a `400` response
- load by owner identity using `findByIdForOwner`
- persist the new `displayName`
- return the updated transcription payload

In `src/app/api/me/transcriptions/route.ts`:
- include `displayName` in `mapTranscription`

In `src/app/api/transcriptions/[transcriptionId]/detail/route.ts` and/or the underlying service detail shape:
- ensure the response includes `displayName`

- [ ] **Step 5: Run the targeted API tests to verify GREEN**

Run:

```bash
npm run test -- src/app/api/__tests__/me-transcription-rename-route.test.ts src/app/api/__tests__/me-transcriptions-route.test.ts src/app/api/__tests__/transcription-detail-route.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/api/me/transcriptions/[transcriptionId]/route.ts src/app/api/me/transcriptions/route.ts src/app/api/transcriptions/[transcriptionId]/detail/route.ts src/app/api/__tests__/me-transcription-rename-route.test.ts src/app/api/__tests__/me-transcriptions-route.test.ts src/app/api/__tests__/transcription-detail-route.test.ts
git commit -m "add transcription rename api"
```

### Task 3: Add a shared inline title editor for rename interactions

**Files:**
- Create: `src/components/transcription-title-editor.tsx`
- Create: `src/components/transcription-title-utils.ts`
- Create: `src/components/__tests__/transcription-title-utils.test.ts`
- Create: `src/components/__tests__/transcription-title-editor.test.tsx`

- [ ] **Step 1: Write the failing title-resolution test**

Create `src/components/transcription-title-utils.ts` with a tiny pure helper such as `getTranscriptionTitle(displayName, filename)`, then write `src/components/__tests__/transcription-title-utils.test.ts` first with exact assertions for:
- returns `filename` when `displayName` is `null`
- returns trimmed `displayName` when present
- never returns an empty string when `filename` exists

- [ ] **Step 2: Run the targeted helper test to verify RED**

Run: `npm run test -- src/components/__tests__/transcription-title-utils.test.ts`

Expected: FAIL because the helper does not exist yet.

- [ ] **Step 3: Implement the minimal shared editor**

Create a small client component that:
- consumes the shared title helper for display
- optionally shows the original filename as secondary metadata when it differs
- supports inline edit/save/cancel
- trims before save
- surfaces inline validation and mutation errors
- remains presentation-only; mutation wiring stays in page/container code
- is required to be reused by dashboard list, dashboard detail, and homepage history so the edit pattern does not drift

Use this explicit prop contract:
- `displayName: string | null`
- `filename: string`
- `isPending?: boolean`
- `errorMessage?: string | null`
- `onSave: (nextDisplayName: string) => Promise<void> | void`
- `onCancel?: () => void`
- `className?: string`

Ownership boundary:
- the editor receives `displayName` and `filename`, and computes the resolved read-mode title internally via `getTranscriptionTitle(displayName, filename)`; do not pass a pre-resolved title prop
- containers own fetching, mutation state, cache invalidation, and server error strings
- the editor owns local `isEditing` state, input state seeded from the resolved title, trim-before-save behavior, client-side empty validation, save button disabled state derived from `isPending`, invoking `onSave`, and invoking optional `onCancel` when the user exits edit mode without saving

- [ ] **Step 4: Run the targeted helper test to verify GREEN**

Run: `npm run test -- src/components/__tests__/transcription-title-utils.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/components/transcription-title-editor.tsx src/components/transcription-title-utils.ts src/components/__tests__/transcription-title-utils.test.ts src/components/__tests__/transcription-title-editor.test.tsx
git commit -m "add transcription title editor"
```

### Task 4: Wire rename through dashboard, detail, and homepage history

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/dashboard/[id]/page.tsx`
- Modify: `src/components/file-upload.tsx`
- Create: `src/hooks/use-transcription-rename.ts`
- Create: `src/hooks/__tests__/use-transcription-rename.test.tsx`
- Modify: `src/lib/query-keys.ts` only if existing keys need helper additions
- Create: `src/lib/transcription-rename-cache.ts`
- Create: `src/lib/__tests__/transcription-rename-cache.test.ts`
- Reuse: `src/components/transcription-title-editor.tsx`
- Reuse: `src/components/transcription-title-utils.ts`
- Create: `src/components/__tests__/file-upload-history-title.test.tsx`
- Create: `src/app/dashboard/__tests__/list-page-title.test.tsx`
- Create: `src/app/dashboard/__tests__/detail-page-title.test.tsx`

- [ ] **Step 1: Write the failing UI-facing test for a real consuming surface**

Create `src/components/__tests__/transcription-title-editor.test.tsx` and make it fail first with concrete assertions for:
- read mode shows resolved title from `displayName ?? filename`
- edit mode is entered from the rename affordance
- save calls `onSave` with trimmed input
- whitespace-only input shows validation and does not call `onSave`
- cancel exits edit mode and restores read mode

Also create `src/components/__tests__/file-upload-history-title.test.tsx` and make it fail first against a real surface by asserting that the homepage history card in `FileUpload`:
- renders `displayName` when present
- falls back to `filename` when `displayName` is null
- wires the shared editor rename affordance for a history item

Create `src/app/dashboard/__tests__/list-page-title.test.tsx` and make it fail first against the actual `src/app/dashboard/page.tsx` page by asserting that a rendered dashboard list row:
- renders `displayName` when present
- falls back to `filename` when `displayName` is null
- shows the shared editor rename affordance

Create `src/app/dashboard/__tests__/detail-page-title.test.tsx` and make it fail first against the actual `src/app/dashboard/[id]/page.tsx` page by asserting that the rendered page header:
- renders `displayName` when present
- falls back to `filename` when `displayName` is null
- shows the shared editor rename affordance

Create `src/hooks/__tests__/use-transcription-rename.test.tsx` and make it fail first around the actual rename success path by asserting that the shared rename hook:
- sends `PATCH /api/me/transcriptions/[id]`
- passes the trimmed `displayName`
- after a successful response, invalidates or refetches `transcriptionKeys.list()`
- invalidates or refetches `transcriptionKeys.detail(id)`
- invalidates or refetches `viewerTranscriptionKeys.lists()`

Keep `src/lib/__tests__/transcription-rename-cache.test.ts` as the narrow unit test for the extracted invalidation helper, but do not treat it as sufficient on its own. The hook test is the required mutation/container test for cache refresh behavior.

These consuming-surface and cache tests are required. Do not treat the helper test or the editor-isolated test as sufficient for Task 4.

- [ ] **Step 2: Run the targeted UI-related tests to verify RED**

Run at minimum:

```bash
npm run test -- src/components/__tests__/transcription-title-editor.test.tsx src/components/__tests__/file-upload-history-title.test.tsx src/app/dashboard/__tests__/list-page-title.test.tsx src/app/dashboard/__tests__/detail-page-title.test.tsx src/hooks/__tests__/use-transcription-rename.test.tsx src/lib/__tests__/transcription-rename-cache.test.ts
```

Expected: FAIL because the dashboard/homepage consuming surfaces still render `filename` directly and the rename mutation/cache invalidation flow does not yet exist.

- [ ] **Step 3: Implement rename wiring with minimal duplication**

In `src/app/dashboard/page.tsx`:
- extend `TranscriptionItem` with `displayName`
- replace direct title rendering with `TranscriptionTitleEditor`
- use a shared `useTranscriptionRename` hook for the rename mutation
- ensure successful rename updates the UI via the shared invalidation helper

In `src/app/dashboard/[id]/page.tsx`:
- extend `TranscriptionDetail` with `displayName`
- replace the direct header title with `TranscriptionTitleEditor`
- use the same `useTranscriptionRename` hook

In `src/components/file-upload.tsx`:
- extend `PreviousTranscription` with `displayName`
- replace direct title rendering with `TranscriptionTitleEditor`
- use the same `useTranscriptionRename` hook for history cards

In `src/hooks/use-transcription-rename.ts`:
- extract the shared rename mutation so all three consuming surfaces use the same success path
- perform the `PATCH` request
- trim the submitted name before sending
- call the shared invalidation helper after success
- expose a minimal API such as `{ rename, isPending, errorMessage, clearError }`

In `src/lib/transcription-rename-cache.ts`:
- extract a tiny helper that accepts `queryClient` and `transcriptionId`
- invalidate the dashboard list/detail queries and viewer-history lists in one place
- keep this helper small and testable so cache behavior is not duplicated across three surfaces

Keep transcript downloads using `filename`.

- [ ] **Step 4: Run the targeted UI-related tests to verify GREEN**

Run the same targeted test file(s) from Step 2.

Expected: PASS

- [ ] **Step 5: Run focused lint/type-check on touched UI files**

Run:

```bash
npm run type-check
npm run lint
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/page.tsx src/app/dashboard/[id]/page.tsx src/components/file-upload.tsx src/components/transcription-title-editor.tsx src/components/transcription-title-utils.ts src/components/__tests__/transcription-title-utils.test.ts src/components/__tests__/transcription-title-editor.test.tsx src/components/__tests__/file-upload-history-title.test.tsx src/app/dashboard/__tests__/list-page-title.test.tsx src/app/dashboard/__tests__/detail-page-title.test.tsx src/hooks/use-transcription-rename.ts src/hooks/__tests__/use-transcription-rename.test.tsx src/lib/query-keys.ts src/lib/transcription-rename-cache.ts src/lib/__tests__/transcription-rename-cache.test.ts
git commit -m "wire transcription rename ui"
```

### Task 5: Final verification

**Files:**
- No new files expected

- [ ] **Step 1: Run the full targeted test suite**

Run:

```bash
npm run test -- src/services/__tests__/transcriptions.test.ts src/app/api/__tests__/me-transcriptions-route.test.ts src/app/api/__tests__/me-transcription-rename-route.test.ts src/app/api/__tests__/transcription-detail-route.test.ts src/components/__tests__/transcription-title-utils.test.ts src/components/__tests__/transcription-title-editor.test.tsx src/components/__tests__/file-upload-history-title.test.tsx src/app/dashboard/__tests__/list-page-title.test.tsx src/app/dashboard/__tests__/detail-page-title.test.tsx src/hooks/__tests__/use-transcription-rename.test.tsx src/lib/__tests__/transcription-rename-cache.test.ts
```

Expected: PASS

- [ ] **Step 2: Run the full project verification required before completion**

Run:

```bash
npm run type-check
npm run lint
npm run test
```

Expected: PASS

- [ ] **Step 3: Commit verification-safe final adjustments**

If any verification fixes were required:

```bash
git add <touched-files>
git commit -m "polish transcription rename flow"
```

- [ ] **Step 4: Prepare execution handoff notes**

Summarize:
- migration file name actually generated
- whether component-level UI tests were added or replaced with narrower helper coverage
- any remaining manual QA worth doing in browser for inline rename behavior
