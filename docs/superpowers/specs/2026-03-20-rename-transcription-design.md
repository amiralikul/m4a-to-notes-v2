# Rename Transcription Design

**Date:** 2026-03-20

**Goal:** Let users rename a transcription for display throughout the product without losing the original uploaded filename.

## Problem

Transcriptions currently expose a single `filename` field, and the UI renders that value directly in history and detail views. This couples the uploaded file name to the user-facing title and prevents users from organizing transcriptions with clearer names.

## Decision

Add a nullable `displayName` field to the transcription record and treat it as the canonical user-facing title. Keep `filename` unchanged as the original upload filename for provenance and export behavior.

UI title rendering must use:

- `displayName` when present
- `filename` as the fallback for existing records and untouched uploads

## Scope

In scope:

- Add persisted `displayName` support to the transcription model
- Add a rename API for an owned transcription
- Show the editable display name anywhere a transcription title is shown
- Provide rename controls in list and detail surfaces
- Validate rename input and preserve ownership checks
- Add regression tests for service/API behavior and UI fallback behavior

Out of scope:

- Changing transcript download filenames
- Bulk rename
- Search/filter by renamed title
- Telegram-specific rename flows

## Data Model

### Schema

Extend `transcriptions` with:

- `displayName TEXT NULL`

Migration behavior:

- Existing rows remain valid with `displayName = NULL`
- New rows may also default to `NULL`

### Semantics

- `filename` remains the immutable upload-origin name
- `displayName` is user-editable and may change over time
- An empty or whitespace-only rename is invalid

## API Design

Add an authenticated update endpoint for a specific transcription. The endpoint must:

- resolve the current owner identity using existing route helpers
- load the transcription via owner-scoped lookup
- reject updates for non-owned or missing records
- trim the incoming title
- reject empty values after trimming
- persist the new `displayName`
- return the updated transcription payload including `displayName`

The route should be separate from delete/status endpoints if that keeps responsibilities clearer in the current API layout.

## UI Design

### Surfaces

Rename must be supported anywhere users view a transcription today:

- homepage / uploader history cards
- dashboard transcription list
- dashboard transcription detail page

### Interaction

Use a consistent inline edit pattern:

- default state shows the resolved title (`displayName ?? filename`)
- user can enter edit mode from a rename affordance
- edit mode shows a text input prefilled with the current resolved title
- save triggers the rename mutation
- cancel exits edit mode without changes
- pending state disables duplicate submits
- validation or request failures show a clear inline error

### Display Rules

- all title labels render `displayName ?? filename`
- secondary metadata can continue to show the created date/status
- original filename should remain available where useful as metadata, but it should not replace the renamed display title

## Data Flow

1. User opens a list card or detail page.
2. UI renders `displayName ?? filename`.
3. User enters a new title and submits.
4. Client sends the trimmed title to the rename endpoint.
5. Server validates ownership and input, persists `displayName`, and returns the updated record.
6. Client updates or invalidates transcription queries so all visible surfaces reflect the new title.

## Error Handling

- Unauthorized or cross-owner requests return the existing not-found/forbidden shape used by adjacent routes.
- Empty titles return `400`.
- Server failures return the standard JSON error payload used by the app.
- UI keeps the previous title visible if save fails.

## Testing

### Service / Route

- successful rename updates only `displayName`
- rename keeps `filename` unchanged
- owner-scoped access is enforced
- empty and whitespace-only input is rejected

### UI

- title rendering falls back to `filename` when `displayName` is null
- title rendering prefers `displayName` when present
- successful rename updates visible title in list/detail flows

## Risks

- Current list/detail payload types may need coordinated updates so `displayName` is available everywhere.
- If list/detail UIs each implement rename separately, they can drift; a shared small rename control may reduce duplication.

## Implementation Notes

- Follow existing React Query invalidation patterns for transcription list/detail queries.
- Keep rename as a presentation concern only; do not repurpose it for export naming in this change.
