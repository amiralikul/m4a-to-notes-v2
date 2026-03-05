# Audio Chunker Service

Standalone microservice for large-audio chunking.

## What it does

- Accepts one audio file (`multipart/form-data`, field name: `audio`)
- Splits audio into overlapping chunks using native `ffmpeg`
- Re-encodes chunks to `audio/flac` (`16kHz`, mono)
- Uploads chunks to Vercel Blob
- Returns a chunk manifest compatible with `/api/start-transcription` (`chunks[]`)

## API

### `GET /health`

Returns service health.

### `POST /chunk`

`multipart/form-data`:

- `audio` (required): audio file up to `1GB`
- `chunkSeconds` (optional): default `600`
- `overlapSeconds` (optional): default `10`

Response:

```json
{
  "jobId": "uuid",
  "filename": "meeting.m4a",
  "chunkCount": 12,
  "totalDurationMs": 7200000,
  "chunkSeconds": 600,
  "overlapSeconds": 10,
  "chunks": [
    {
      "chunkIndex": 0,
      "blobUrl": "https://...",
      "startMs": 0,
      "endMs": 600000,
      "sizeBytes": 1234567,
      "contentType": "audio/flac"
    }
  ]
}
```

## Environment

- `BLOB_READ_WRITE_TOKEN` or `M4A_TO_NOTES_READ_WRITE_TOKEN` (required)
- `PORT` (optional, default `8080`)
- `ALLOWED_ORIGINS` (optional, comma-separated CORS origins)
- `LOG_LEVEL` (optional, default `info`)

## Local dev

```bash
cd services/audio-chunker
npm install
npm run dev
```

## Deploy

Use the included `Dockerfile` on Render/Railway/Fly.
Make sure `ffmpeg` is available in the runtime image.
