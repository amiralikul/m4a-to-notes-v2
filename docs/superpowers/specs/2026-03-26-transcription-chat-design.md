# Transcription Chat Design

**Date:** 2026-03-26

**Goal:** Let signed-in users chat with a completed transcription in a persistent ChatGPT-style interface, using Anthropic for streamed answers that can quote the transcript and render assistant replies as Markdown.

## Problem

The product already supports transcription, summaries, translations, and a detail page for a single transcription, but it does not let users ask follow-up questions against a transcript. The repository contains partial AI infrastructure, including Anthropic and the Vercel AI SDK, but there is no first-class web chat data model, no retrieval path over transcript chunks for question answering, and no UI surface for a persistent chat thread.

The feature needs to support:

- signed-in users only
- one persistent chat thread per transcription in v1
- indefinite message retention
- streamed responses in the UI
- transcript quotes when the assistant makes transcript-based claims or when the user asks for quotes
- assistant replies rendered as Markdown
- general world knowledge as supplemental context when helpful

## Decision

Add a SQL-backed chat subsystem scoped to a single transcription and user, use Anthropic through the Vercel AI SDK for streaming, and retrieve relevant transcript chunks on each turn without introducing a vector database in v1.

The system should be structurally extensible to multiple chats per transcription later. To preserve that path, chat state must not be stored as a single JSON blob on `transcriptions`. Instead, v1 should introduce dedicated chat and message tables, while enforcing one chat thread per `(transcriptionId, userId)` through schema or service constraints.

## Scope

In scope:

- signed-in-only chat access from the transcription detail page
- one persistent chat thread per transcription per user
- database-backed thread and message persistence
- streamed Anthropic responses through a new chat API route
- transcript-chunk retrieval for grounding
- quoted transcript evidence in transcript-based answers when relevant
- Markdown rendering for assistant replies
- regression tests for authorization, persistence, retrieval, and route behavior

Out of scope:

- anonymous or actor-based chat access
- multiple user-selectable threads per transcription
- cross-transcription or workspace-wide search/chat
- embeddings or vector database infrastructure
- citation click-through UI beyond human-readable quotes and timestamps
- message editing, retry branching, or chat sharing
- usage limits, billing gates, or moderation workflows

## Research Notes

Current external references, verified on 2026-03-26:

- Vercel AI Elements provides composable chat UI primitives built for the AI SDK, including conversation and prompt-input components: https://elements.ai-sdk.dev/
- Vercel AI SDK documentation recommends persisting the `useChat` message format and supports streaming chat patterns in UI routes: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence
- Anthropic model documentation currently lists `Claude Sonnet 4.6` as the general-purpose balanced model and describes current context-window and model family guidance: https://platform.claude.com/docs/en/about-claude/models/overview

Repository context:

- Anthropic provider factory already exists in [src/services/ai/providers/anthropic.client.ts](/Users/amir/projects/personal/m4a-to-notes-v2/src/services/ai/providers/anthropic.client.ts)
- the transcription detail surface already exists in [src/app/dashboard/[id]/page.tsx](/Users/amir/projects/personal/m4a-to-notes-v2/src/app/dashboard/[id]/page.tsx)
- transcript chunks with timestamps already exist in [src/db/schema.ts](/Users/amir/projects/personal/m4a-to-notes-v2/src/db/schema.ts)

## UX Design

### Entry Point

Add a chat card to the transcription detail page below the transcript and summary sections in [src/app/dashboard/[id]/page.tsx](/Users/amir/projects/personal/m4a-to-notes-v2/src/app/dashboard/[id]/page.tsx).

### Behavior

- Chat is shown only to signed-in users.
- Chat is shown only for completed transcriptions.
- On first load, the UI loads or creates the single persistent thread for that transcription and user.
- The assistant streams tokens as the reply is generated.
- Assistant messages render as Markdown.
- User messages render as plain text.
- The empty state can suggest prompt starters such as:
  - "Summarize the main decisions"
  - "What did they say about pricing?"
  - "Quote what was said about deadlines"

### Markdown Rendering

Assistant replies should be rendered with:

- `react-markdown`
- `remark-gfm`

V1 should not render raw HTML from model output. The renderer should support common chat Markdown features such as paragraphs, emphasis, lists, tables, blockquotes, and code spans/blocks.

## Data Model

### New Tables

Add `transcription_chats`:

- `id TEXT PRIMARY KEY`
- `transcription_id TEXT NOT NULL` references `transcriptions.id` with cascade delete
- `user_id TEXT NOT NULL` references `users.id` with cascade delete
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Indexes and constraints:

- unique index on `(transcription_id, user_id)` for v1 single-thread behavior
- index on `user_id`
- index on `updated_at`

Add `chat_messages`:

- `id TEXT PRIMARY KEY`
- `chat_id TEXT NOT NULL` references `transcription_chats.id` with cascade delete
- `role TEXT NOT NULL` with values `user | assistant`
- `parts TEXT NOT NULL` as JSON, storing the persisted AI SDK/UI message content representation used by the app
- `quoted_chunks TEXT NULL` as JSON array of `{chunkId, startMs, endMs, text}` for assistant messages when retrieval context should be retained for auditing/debugging
- `created_at TEXT NOT NULL`

Indexes:

- index on `chat_id`
- index on `(chat_id, created_at)`

### Extensibility

This schema supports multiple chats per transcription later without redesigning the message table. Supporting multi-thread chat later should require only:

- removing the unique `(transcription_id, user_id)` constraint
- optionally adding `title` and `archived_at` columns to `transcription_chats`
- adding a thread list and picker in the UI

## API Design

Add new signed-in route handlers under:

- `/api/transcriptions/[transcriptionId]/chat`

### `GET /api/transcriptions/[transcriptionId]/chat`

Responsibilities:

- require signed-in auth
- verify the transcription belongs to the signed-in user
- reject incomplete or failed transcriptions for chat usage
- load the existing single chat thread or create it if absent
- return thread metadata and persisted messages in chronological order

### `POST /api/transcriptions/[transcriptionId]/chat`

Responsibilities:

- require signed-in auth
- verify the transcription belongs to the signed-in user
- accept the latest user message from the client
- persist the user message before generation begins
- retrieve relevant transcript chunks for the turn
- call Anthropic through the Vercel AI SDK and stream the assistant reply
- persist the final assistant message and quoted chunk metadata when streaming completes

The API contract should align with the AI SDK’s chat flow rather than inventing a custom frontend protocol unless the current `ai` package version requires a small adapter layer.

### Future-compatible optional route

`DELETE /api/transcriptions/[transcriptionId]/chat` is not required for v1, but the service boundaries should make it straightforward to add later for a “clear conversation” action.

## Service Design

### Chat Persistence Service

Add a new service responsible for:

- creating or loading the single chat for a transcription and user
- listing messages for a chat
- appending user and assistant messages
- deleting messages later if the product adds a clear-history action

This service should own database concerns only, not retrieval or prompting.

### Transcript Retrieval Service

Add a retrieval service over `transcription_chunks` that:

- fetches chunks for the target transcription
- ranks chunks against the latest user message
- returns the top chunks with text and timestamps

V1 ranking strategy:

- lexical matching against the user’s latest turn
- boosts for exact phrase overlap
- optional boost for chunks referenced in recent assistant citations if that context is available
- configurable cap on the number of returned chunks

If no chunk result is usable and the transcript is short enough, the service may fall back to scanning trimmed `transcriptText`. This fallback should stay bounded to avoid prompt explosion.

### Anthropic Chat Service

Add a dedicated chat-generation service that:

- prepares the system prompt
- transforms persisted chat history into the format required by the AI SDK/provider
- injects retrieved transcript chunks into the prompt context
- streams the response
- returns the final assistant message for persistence

This logic should not reuse the legacy OpenAI-only helper in [src/services/chat.ts](/Users/amir/projects/personal/m4a-to-notes-v2/src/services/chat.ts), which is scoped to a different flow and API shape.

## Prompting Rules

System behavior requirements:

- answer conversationally and concisely by default
- use transcript quotes when making transcript-specific claims and when the user explicitly requests quotes
- use timestamps whenever quotes come from transcript chunks that include time boundaries
- clearly separate transcript-grounded claims from general knowledge when both appear in the answer
- explicitly say when the transcript does not contain enough support for a claim
- never fabricate transcript quotes or timestamps

The prompt should frame transcript evidence as primary for questions about the recording, while allowing general world knowledge as supplemental explanation.

## Data Flow

1. Signed-in user opens a completed transcription detail page.
2. Client loads thread state from `GET /api/transcriptions/[transcriptionId]/chat`.
3. If no thread exists, the server creates it and returns an empty message list.
4. User submits a prompt.
5. Client sends the prompt to `POST /api/transcriptions/[transcriptionId]/chat`.
6. Server validates ownership and transcription readiness.
7. Server persists the user message.
8. Server retrieves relevant transcript chunks.
9. Server calls Anthropic with chat history plus retrieved transcript context.
10. Server streams the assistant reply to the client.
11. After stream completion, server persists the assistant message and any quoted chunk metadata.
12. On later visits, the same thread reloads from persisted storage.

## Authorization

- Chat routes must require an authenticated session.
- The transcription must belong to `session.user.id`.
- Anonymous owner access via `actorId` is intentionally excluded from v1.
- Accessing another user’s transcription should return the same not-found/forbidden pattern used by adjacent owner-scoped routes.

## Error Handling

- incomplete, pending, processing, or failed transcriptions should not allow chat generation
- empty user messages should return `400`
- unauthorized requests should return `401`
- missing or non-owned transcriptions should return the app’s standard not-found/forbidden response shape
- provider failures should return a standard app error payload and leave previously persisted messages intact
- if assistant persistence fails after a streamed reply completes, the error should be logged with enough context to reconcile the thread manually if needed

## Dependencies

Add:

- `react-markdown`
- `remark-gfm`

No vector database or embeddings dependency should be added in v1.

## Testing

### Service and Route Tests

- signed-in users can load or create a chat for their own completed transcription
- users cannot access chat for another user’s transcription
- chat is rejected for non-completed transcriptions
- one chat is reused for repeated requests to the same transcription
- user messages persist before generation
- assistant messages persist after successful streaming completion
- retrieval returns bounded relevant chunks with timestamps

### UI Tests

- chat card renders only for signed-in users on completed transcriptions
- assistant messages render Markdown safely
- streaming state is visible in the UI
- previously persisted history loads on revisit

## Risks

- lexical retrieval may miss semantically related chunks for fuzzy questions; this is acceptable for v1 but may require embeddings later
- the AI SDK’s current message persistence conventions may require an adapter if the app stores a narrower internal message shape
- streaming persistence needs careful handling so partial responses do not create duplicate assistant messages on retries

## Implementation Notes

- Prefer reusing existing route helpers and service patterns already used by other transcription APIs.
- Keep the chat service separate from summary/translation services; this is a different workload and prompt shape.
- The initial model choice should come from Anthropic env configuration rather than hardcoding a model in the route.
- Keep the database schema and service API neutral enough that multiple threads can be enabled later without rewriting message persistence.
