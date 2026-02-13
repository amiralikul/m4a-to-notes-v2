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
