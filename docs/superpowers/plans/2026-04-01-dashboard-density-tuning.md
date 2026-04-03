# Dashboard Density Tuning Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Widen the desktop transcription rail to `320px` and replace the tall dashboard upload dropzone with a compact toolbar rail plus a separate progress tray, while preserving drag-and-drop and existing upload logic.

**Architecture:** Keep the existing dashboard workspace and upload business logic intact, but extract the layout-critical dashboard-specific pieces into smaller, testable units. The desktop grid width should be locked through a shared layout constant, and the compact upload experience should be introduced as an explicit `FileUpload` variant used only by the unified dashboard workspace.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Vitest

---

### Task 1: Lock in the Desktop Dashboard Layout Classes

**Files:**
- Create: `src/components/dashboard/layout-classes.ts`
- Create: `src/components/dashboard/__tests__/layout-classes.test.ts`
- Modify: `src/components/dashboard/dashboard-workspace.tsx`
- Modify: `src/components/dashboard/transcription-sidebar.tsx`
- Modify: `src/components/dashboard/__tests__/transcription-sidebar.test.tsx`

- [ ] **Step 1: Write the failing layout test**

Create `src/components/dashboard/__tests__/layout-classes.test.ts` that imports the new desktop grid class constant and expects it to include `lg:grid-cols-[320px_minmax(0,1fr)]`.

- [ ] **Step 2: Run the new test to verify it fails**

Run: `npx vitest run src/components/dashboard/__tests__/layout-classes.test.ts`
Expected: FAIL because the desktop grid width is still `280px` or the constant does not exist yet.

- [ ] **Step 3: Introduce the shared layout constants**

Create `src/components/dashboard/layout-classes.ts` with small exported constants for:
- the dashboard workspace grid class
- the sidebar scroll container class
- the sidebar scroll content class

Keep the existing anti-clipping sidebar classes from the current working tree (`max-h`, `pr-4`, `w-full`, `min-w-0`) and update the desktop grid constant to `320px`.

- [ ] **Step 4: Wire the constants into the dashboard components**

Update `src/components/dashboard/dashboard-workspace.tsx` to use the shared desktop grid class constant instead of the inline `280px` class string.

Update `src/components/dashboard/transcription-sidebar.tsx` to use the shared sidebar scroll constants so the current clipping fix and the new width tuning live in one place.

- [ ] **Step 5: Expand the sidebar regression coverage**

Update `src/components/dashboard/__tests__/transcription-sidebar.test.tsx` so it continues asserting the viewport-based height and gutter classes, but now reads them from the shared constants rather than hard-coding multiple copies of the same strings.

- [ ] **Step 6: Run the focused dashboard layout tests**

Run: `npx vitest run src/components/dashboard/__tests__/layout-classes.test.ts src/components/dashboard/__tests__/transcription-sidebar.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/dashboard/layout-classes.ts src/components/dashboard/__tests__/layout-classes.test.ts src/components/dashboard/dashboard-workspace.tsx src/components/dashboard/transcription-sidebar.tsx src/components/dashboard/__tests__/transcription-sidebar.test.tsx
git commit -m "tune dashboard sidebar density"
```

### Task 2: Extract the Compact Dashboard Upload Rail

**Files:**
- Create: `src/components/file-upload/dashboard-upload-rail.tsx`
- Create: `src/components/file-upload/dashboard-upload-progress-tray.tsx`
- Create: `src/components/file-upload/__tests__/dashboard-upload-rail.test.tsx`
- Create: `src/components/file-upload/__tests__/dashboard-upload-progress-tray.test.tsx`
- Modify: `src/components/file-upload.tsx`

- [ ] **Step 1: Write the failing compact rail test**

Create `src/components/file-upload/__tests__/dashboard-upload-rail.test.tsx` that renders the new presentational rail component with `renderToStaticMarkup()` and expects:
- compact upload copy
- a browse/upload button
- the format and max-size chips in the same rail
- a compact class footprint rather than the tall `py-16` hero layout

- [ ] **Step 2: Write the failing progress tray test**

Create `src/components/file-upload/__tests__/dashboard-upload-progress-tray.test.tsx` that renders the new presentational tray component and expects:
- slim row-based upload status output
- a thin progress bar
- filename + status + percentage in the row
- retry/remove affordances only where supported by the row state

- [ ] **Step 3: Run the two new tests to verify they fail**

Run: `npx vitest run src/components/file-upload/__tests__/dashboard-upload-rail.test.tsx src/components/file-upload/__tests__/dashboard-upload-progress-tray.test.tsx`
Expected: FAIL because the new compact components do not exist yet.

- [ ] **Step 4: Implement the compact dashboard upload rail**

Create `src/components/file-upload/dashboard-upload-rail.tsx` as a presentational component that:
- stays full-width
- remains drag-and-drop active
- uses a toolbar-style height around `88-96px`
- shows concise label/copy, primary upload CTA, and support chips
- changes drag-over styling without growing in height

- [ ] **Step 5: Implement the compact upload progress tray**

Create `src/components/file-upload/dashboard-upload-progress-tray.tsx` as a presentational component that renders dense progress rows below the rail.

Each row should expose:
- filename
- compact status icon/text
- a thin progress bar
- short progress/status text
- retry/remove actions via props from the parent

- [ ] **Step 6: Run the new component tests**

Run: `npx vitest run src/components/file-upload/__tests__/dashboard-upload-rail.test.tsx src/components/file-upload/__tests__/dashboard-upload-progress-tray.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/file-upload/dashboard-upload-rail.tsx src/components/file-upload/dashboard-upload-progress-tray.tsx src/components/file-upload/__tests__/dashboard-upload-rail.test.tsx src/components/file-upload/__tests__/dashboard-upload-progress-tray.test.tsx
git commit -m "extract compact dashboard upload rail"
```

### Task 3: Wire the Compact Upload Variant into FileUpload

**Files:**
- Modify: `src/components/file-upload.tsx`
- Modify: `src/components/dashboard/dashboard-workspace.tsx`
- Test: `src/components/file-upload/__tests__/dashboard-upload-rail.test.tsx`
- Test: `src/components/file-upload/__tests__/dashboard-upload-progress-tray.test.tsx`
- Test: `src/components/dashboard/__tests__/layout-classes.test.ts`

- [ ] **Step 1: Add a dashboard-specific FileUpload variant prop**

Modify `src/components/file-upload.tsx` to accept a new prop such as:

```ts
variant?: "default" | "dashboardCompact";
```

Default it to `"default"` so non-dashboard usage remains unchanged.

- [ ] **Step 2: Replace the tall dashboard hero with the compact rail**

In `src/components/file-upload.tsx`, when `variant === "dashboardCompact"`:
- render the compact rail instead of the tall dashed hero card
- keep the same drag/drop handlers and file input wiring
- move the current-session upload rows into the new slim progress tray below the rail
- preserve upload settings dialog, polling, retries, and deletion behavior

- [ ] **Step 3: Keep the default upload surface intact**

Leave the existing tall upload surface as the `"default"` variant so no unrelated upload entry point changes behavior accidentally.

- [ ] **Step 4: Opt the dashboard into the compact variant**

Update `src/components/dashboard/dashboard-workspace.tsx` so the top rail becomes:

```tsx
<FileUpload showHistory={false} variant="dashboardCompact" />
```

- [ ] **Step 5: Run the focused regression set**

Run: `npx vitest run src/components/dashboard/__tests__/layout-classes.test.ts src/components/dashboard/__tests__/transcription-sidebar.test.tsx src/components/file-upload/__tests__/dashboard-upload-rail.test.tsx src/components/file-upload/__tests__/dashboard-upload-progress-tray.test.tsx`
Expected: PASS

- [ ] **Step 6: Run type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/file-upload.tsx src/components/dashboard/dashboard-workspace.tsx
git commit -m "compact dashboard upload rail"
```

### Task 4: Final Visual Verification and Cleanup

**Files:**
- Verify only: `src/components/dashboard/dashboard-workspace.tsx`
- Verify only: `src/components/file-upload.tsx`
- Verify only: `src/components/dashboard/transcription-sidebar.tsx`

- [ ] **Step 1: Start the app from the main checkout**

Run: `npm run dev`
Expected: Next.js dev server starts from `/Users/amir/projects/personal/m4a-to-notes-v2`

- [ ] **Step 2: Verify the dashboard proportions in the browser**

Check `/dashboard` and confirm:
- the left transcription rail is visually wider
- the upload rail is about half the old vertical footprint
- drag-and-drop still highlights the compact rail
- upload progress appears in the slim tray below the rail
- the right pane still has comfortable reading width on desktop

- [ ] **Step 3: Capture any spacing-only follow-up**

If a purely visual spacing tweak is still needed after the first pass, keep it limited to padding/gap/icon/text sizing in the compact rail or tray. Do not reopen upload logic or dashboard data flow.

- [ ] **Step 4: Run the final verification set**

Run:

```bash
npx vitest run src/components/dashboard/__tests__/layout-classes.test.ts src/components/dashboard/__tests__/transcription-sidebar.test.tsx src/components/file-upload/__tests__/dashboard-upload-rail.test.tsx src/components/file-upload/__tests__/dashboard-upload-progress-tray.test.tsx
npm run type-check
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard src/components/file-upload
git commit -m "polish dashboard density tuning"
```
