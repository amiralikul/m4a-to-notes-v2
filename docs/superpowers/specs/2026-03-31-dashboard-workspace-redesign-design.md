# Dashboard Workspace Redesign Design

**Date:** 2026-03-31

**Goal:** Replace the current split list/detail dashboard flow with a single workspace that keeps transcription history on the left and the selected transcription content on the right.

## Problem

The current dashboard experience is split across two separate pages:

- `/dashboard` shows a list of transcription cards
- `/dashboard/[id]` shows the selected transcription detail view

That split creates unnecessary navigation for a workflow that is naturally master-detail. Users upload, scan recent items, open one transcription, and move between summary, transcript, and related actions. The current transition between pages makes the dashboard feel more like a set of disconnected screens than a working surface.

## Decision

Redesign `/dashboard` as a single editorial-style workspace with:

- a full-width upload rail at the top
- a persistent transcription history rail on the left
- a larger reading canvas on the right for the selected transcription
- tabs inside the reading canvas: `Summary`, `Transcript`, `Chat`

Selection is synchronized through the URL using `/dashboard?item=<id>` so the workspace remains refresh-safe and linkable without keeping a second full dashboard experience.

The visual direction is `A. Wide reading workspace`: calm, content-first, and summary-forward.

## Scope

In scope:

- unify dashboard list and detail behavior into one `/dashboard` workspace
- preserve deep-linking by syncing the selected transcription through `?item=`
- default the selected content tab to `Summary`
- show `Chat` as a placeholder tab with non-functional empty-state content
- preserve existing transcription actions, summary rendering, transcript rendering, diarization display, and translation controls inside the new workspace
- redirect legacy `/dashboard/[id]` links into the unified workspace
- add regression coverage for selection, redirects, delete-reselection, and tab state rendering

Out of scope:

- implementing real transcript chat
- changing upload/transcription business logic
- adding new search, filtering, sorting, or bulk management features
- redesigning unrelated public pages
- changing summary or translation generation behavior

## URL and Routing

### Canonical Route

The canonical dashboard route becomes:

- `/dashboard`
- optional selected item via `/dashboard?item=<transcriptionId>`

### Selection Rules

- if `item` exists and resolves to a transcription in the loaded list, that transcription is selected
- if `item` is missing, select the most recent transcription when one exists
- "most recent" means the first transcription in the dashboard list ordered by `createdAt` descending
- if `item` is invalid or no longer available, fall back to the most recent available transcription and normalize the URL with replace-style navigation rather than pushing a new history entry
- if the user has no transcriptions, the right pane renders the empty state

### Legacy Route Compatibility

`/dashboard/[id]` remains only as a compatibility route. It should redirect to:

- `/dashboard?item=<id>`

This preserves existing links while removing the separate dashboard detail experience.

## Workspace Layout

### Top Upload Rail

The upload surface stays at the top of the dashboard and remains the primary action. The redesign should reuse the existing `FileUpload` behavior rather than create a new upload flow.

Visually, the uploader should read as a wide top rail integrated into the dashboard shell rather than a standalone block dropped between unrelated sections.

### Left History Rail

The left rail is a compact, scrollable transcription list at roughly desktop sidebar width. It replaces the current stack of full cards with denser selectable items.

Each item should show:

- resolved title or filename
- status badges
- created date/time
- short preview text when available

The selected item must be visually obvious without overwhelming the list. Processing and failed items remain selectable.

### Right Reading Canvas

The right pane is the main reading workspace for the selected transcription. It should feel like one coherent surface, not several unrelated stacked cards.

The reading canvas contains:

1. a compact header with title, status, badges, and actions
2. a tab row for `Summary`, `Transcript`, and `Chat`
3. the audio player directly under the tabs
4. the main content panel below

## Component Composition

### Page Shell

Create a single client workspace entry on `/dashboard` that owns:

- list fetching
- selected transcription resolution
- query-param syncing
- two-column layout

### Left Rail

Extract a focused sidebar component for the history rail. It should render a dense selectable list rather than full-width dashboard cards.

Recommended responsibilities:

- render list loading, error, and empty states
- show compact item metadata
- emit selection changes

### Right Pane

Extract a workspace pane component for the selected transcription.

Recommended internal composition:

- `WorkspaceHeader`
- `Tabs`
- audio player region
- content panels

### Content Reuse

The redesign should reuse working content components and logic where possible:

- `SummaryRenderer` stays the summary presentation layer
- existing transcript and diarization rendering patterns stay intact
- existing translation controls remain in the selected transcription workspace when available
- `AudioPlayer` remains the playback component

`Chat` is a placeholder panel only. It should look intentional and aligned with the tabs, but it must not introduce backend or AI chat behavior in this redesign.

### shadcn Composition

Use existing shadcn/ui primitives for structure and states instead of custom layout-only markup where components already fit the need.

Expected primitives include:

- `Card`
- `Tabs`
- `Badge`
- `Button`
- `ScrollArea`
- `Separator`
- `Skeleton`
- `Empty` when appropriate

The redesign should preserve the app's established patterns and tokens instead of introducing a separate visual system.

## Behavior and States

### Tab Behavior

- `Summary` is the default tab for every newly selected transcription
- no per-user or per-session tab persistence is required
- switching selected transcription resets the active tab to `Summary`

### Loading Behavior

- the list and selected detail should be able to resolve independently
- the dashboard should not block the entire page on selected-item detail loading
- the right pane may show a skeleton or status-first placeholder while the selected transcription data is loading

### Processing and Failed Items

- pending and processing items remain selectable from the left rail
- the right pane should show current status and any available preview content
- summary sections must show loading, failed, or unavailable states using existing summary status fields

### Empty States

- no transcriptions: the right pane shows the dashboard empty state and the left rail remains structurally present or gracefully minimized based on implementation ergonomics
- no selected item after deletion: select the next most recent remaining item
- no remaining items after deletion: fall back to the empty dashboard state

### Actions

Primary item actions live in the right pane header, not duplicated in the left rail:

- download transcript
- open/download audio where available
- delete transcription
- translation actions when supported by the selected item state

## Data Flow

1. `/dashboard` loads the transcription list.
2. The page resolves the selected item from `?item=` or falls back to the most recent transcription.
3. The left rail renders the full list with the selected item highlighted.
4. The right pane loads the selected transcription detail and related summary/translation data.
5. Selecting a different item updates the URL and refreshes the right pane content without leaving the page.
6. Deleting the selected item optimistically removes it and promotes the next valid item into selection.

Relevant cache families remain the existing transcription query groups. The redesign should reuse current React Query invalidation patterns instead of creating a parallel data layer.

## Error Handling

- list fetch failures should appear in the history rail region with a retry action
- selected transcription fetch failures should stay local to the right pane
- summary and translation failures should remain local to their panels
- deleting a transcription should keep optimistic behavior but restore prior state if the mutation fails

The redesign should avoid a single page-level error state that collapses the entire workspace for local failures.

## Responsive Behavior

Desktop is the primary target and should use the two-column workspace.

On smaller screens:

- the history rail should collapse above the reading pane rather than remain a cramped side column
- the selected item still controls the content below
- the reading pane keeps the same top-to-bottom order: header, tabs, audio player, content

The mobile layout should be a stacked version of the same model, not a separate experience.

## Testing

Add or update coverage for:

- default selection when no `item` query param is provided
- selection driven by `?item=<id>`
- invalid `item` fallback behavior
- redirect from `/dashboard/[id]` to `/dashboard?item=<id>`
- deleting the selected item reselects the next available transcription
- empty-state behavior when the final transcription is removed
- summary, transcript, and placeholder chat tab rendering states

## Risks

- The current dashboard list page and detail page likely duplicate some rendering and action logic; the redesign needs careful extraction to avoid moving bugs into the new workspace shell.
- URL-synced selection must not create loops between router updates and client state.
- Translation controls currently live in the detail page and may need focused extraction so they fit the new right-pane composition cleanly.

## Implementation Notes

- Favor composition and extraction over full rewrites of content logic.
- Preserve the existing API surface unless a focused route or query adjustment is strictly needed for workspace ergonomics.
- Keep `/dashboard/[id]` as a redirect shim only, not a second maintained UI.
- Summary remains the default-value surface for the redesign; the workspace hierarchy should visually support that decision.
