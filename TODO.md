# TODO

## Transcription Quality

- [ ] Add `language` parameter to Whisper API calls — biggest accuracy win. Without it, Whisper auto-detects language from the first 30s, causing hallucinations (e.g. mixed English/German). Either hardcode `"en"` or make configurable per-request for multilingual Telegram users.
- [ ] Set `temperature: 0` for deterministic output — default behavior auto-increases temperature based on log probability, introducing randomness.
- [ ] Add `prompt` parameter support (max 224 tokens) — guide spelling of domain-specific terms and maintain consistent punctuation/style. Must match audio language.
- [ ] Consider `response_format: "verbose_json"` for quality monitoring — gives per-segment `avg_logprob`, `no_speech_prob`, `compression_ratio` metrics. Useful for detecting low-confidence segments.
- [ ] Evaluate `whisper-large-v3` (non-turbo) — ~1-2% better WER at the cost of slower inference. Could be offered as a "high quality" option.
- [ ] Preprocess audio to 16kHz mono before upload — Groq downsamples internally anyway, doing it client-side reduces upload size and latency.

## Performance

- [ ] Pass Vercel Blob URL directly to Groq via `url` parameter — Groq accepts a `url` string instead of `file` upload. Skips downloading the blob into memory in the Inngest function, reducing latency and memory usage. Requires changing `transcribeAudio(buffer)` to `transcribeAudioUrl(blobUrl)` and updating the Inngest function to skip the download step. Blob cleanup still needed after transcription.

## Product Features

### High Impact

- [ ] **Speaker Diarization** (Pro) — Identify who said what in multi-speaker recordings. AssemblyAI offers it at ~$0.02/hr on top of transcription. Strong Pro differentiator. Requires storing structured transcript data (not just plain text).
- [ ] **AI Summary & Key Points** — Post-process transcripts with GPT-4o to generate summary, action items, and key takeaways. Add as an Inngest `step.run()` after transcription. High value for meeting recordings.
- [ ] **Search & Filter on Dashboard** — Full-text search over transcript content + filename, date range filtering. Dashboard becomes unusable as transcriptions accumulate without this.
- [ ] **Additional Export Formats** (SRT, VTT, DOCX) — Requires `verbose_json` from Whisper for timestamps first (see Transcription Quality section). SRT/VTT high-demand for video creators, DOCX for business users.

### Medium Impact

- [ ] **Transcript Editor** — Let users correct transcription errors in-browser. Simple contenteditable on the transcript view, saves corrected text back via API.
- [ ] **Batch Upload** — Allow uploading multiple files at once. Extend upload component to a queue with parallel Inngest events.
- [ ] **Folders / Tags** — Let users organize transcriptions. A `tags` JSON column or `folders` table. Makes dashboard scalable beyond 20-30 items.
- [ ] **Audio Playback in Dashboard** — Embed `<audio>` player to listen to recordings alongside transcript. Blob URLs are already public.
- [ ] **Transcription Language Selection** — Let users specify language upfront instead of relying on Whisper auto-detect. Dropdown on upload form, pass to API. Improves accuracy.
- [ ] **Copy to Clipboard** — Add "Copy" button next to "Download Transcript". Small effort, big UX win.
- [ ] **Usage Stats on Dashboard** — Show monthly usage (e.g. 2/3 free transcriptions used). Data already in DB, just needs a query + UI card.

### Longer Term

- [ ] **Real-time Streaming Transcription** — Show words appearing live via Groq/Deepgram streaming API. Requires WebSocket/SSE infrastructure.
- [ ] **Vocabulary & Prompt Customization** (Pro) — Whisper supports a `prompt` parameter for domain-specific terms. Let Pro users set custom vocabulary per-request.
- [ ] **Team / Workspace Collaboration** — Shared workspace for multiple users. Requires `workspaces` table and invitation system. Good for B2B.
- [ ] **Webhooks / API Access** (Developer Tier) — Public API for programmatic integration. Internal API already exists, needs auth tokens and docs.
- [ ] **Email Notifications** — Notify users when transcription completes. Clerk has email addresses, use Resend or similar.
