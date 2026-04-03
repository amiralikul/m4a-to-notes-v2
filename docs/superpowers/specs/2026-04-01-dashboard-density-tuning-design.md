# Dashboard Density Tuning Design

**Date:** 2026-04-01

**Goal:** Refine the unified dashboard workspace so the transcription rail is wider and the upload area is significantly more compact without losing drag-and-drop behavior or upload progress visibility.

## Context

This is a focused follow-up to the unified dashboard workspace redesign in `2026-03-31-dashboard-workspace-redesign-design.md`.

The first pass solved the master-detail layout, but two density issues remain:

- the left transcription rail feels too narrow for filenames, badges, and preview text
- the top upload area occupies too much vertical space relative to the rest of the workspace

## Decision

Adjust the unified dashboard layout with two targeted changes:

- increase the desktop transcription rail width from `280px` to `320px`
- replace the tall upload dropzone with a compact toolbar-style upload rail above the workspace

The upload rail remains a drag-and-drop target, but it should read as a compact command surface rather than a large empty canvas.

## Scope

In scope:

- widen the desktop transcription rail
- reduce the visual height of the upload section by roughly half
- keep drag-and-drop behavior active across the compact upload rail
- move upload progress feedback into a slim tray below the rail
- adjust spacing, chip placement, icon sizing, and supporting text to fit the denser upload layout
- add regression coverage for the widened desktop rail and compact upload rail

Out of scope:

- changing upload business logic
- changing upload limits, supported formats, or diarization behavior
- redesigning the upload progress semantics
- changing mobile information hierarchy beyond the necessary responsive adaptations

## Layout Changes

### Desktop Sidebar Width

The dashboard workspace grid should change from:

- `lg:grid-cols-[280px_minmax(0,1fr)]`

to:

- `lg:grid-cols-[320px_minmax(0,1fr)]`

This is a desktop-only proportion change. The main reading pane continues to use `minmax(0, 1fr)` so it absorbs the remaining space without layout instability.

### Upload Rail

The upload section remains above the workspace as a full-width bar.

The new upload rail should:

- be visibly compact, roughly `88-96px` tall on desktop
- keep drag-and-drop active across the full rail
- contain a concise label and supporting copy
- include a clear primary upload button
- retain the supported format and max-size chips inside the same rail
- use a stronger active drag state without increasing height

The rail should feel like a dashboard toolbar, not a hero block.

## Upload Progress Tray

Upload progress should move into a separate slim tray directly below the compact rail.

### Visibility

- hidden when there are no current-session upload rows to show
- visible when a file is uploading, processing, completed, or errored in the current session

### Row Design

Each row should present:

- filename
- compact status icon and status text
- thin progress bar
- percentage or concise status copy
- existing remove or retry actions where supported

The tray should be denser than the current stacked upload cards:

- smaller padding
- tighter vertical rhythm
- less empty space
- enough clarity for multiple concurrent uploads

## Interaction Rules

### Drag and Drop

- the entire compact upload rail remains a valid drop target
- drag-over feedback should intensify border/background styling but not expand the component

### Upload CTA

- the explicit upload button remains the clearest action in the rail
- the supporting copy should reinforce that users can either browse or drop files

### Progress Handling

- the upload rail itself stays visually stable while uploads progress
- progress rows appear below it instead of causing the rail to grow into a large container

## Responsive Behavior

On smaller screens:

- the upload rail remains above the workspace
- the progress tray stacks below it naturally
- the sidebar still collapses above the main reading pane as already defined in the dashboard workspace spec

Only the desktop sidebar width increases. Mobile should preserve the existing single-column flow.

## Testing

Add or update regression coverage for:

- the desktop dashboard grid using `320px` for the sidebar column
- the compact upload rail variant replacing the tall dropzone footprint
- the upload progress tray rendering as a separate dense section below the rail
- the existing drag-and-drop affordance remaining present in the compact rail

## Risks

- compressing the upload area too far could make drag-and-drop feel hidden if the CTA hierarchy is weak
- moving progress rows into a slimmer tray requires careful spacing so multi-file uploads remain scannable
- widening the left rail must not make the right reading pane feel cramped on common laptop widths

## Implementation Notes

- prefer re-composition of the existing `FileUpload` component over introducing a second upload surface
- keep the compact upload rail and progress tray as part of the same upload system, not separate flows
- preserve the existing upload states and mutation logic; this is a layout and presentation change, not a behavior rewrite
