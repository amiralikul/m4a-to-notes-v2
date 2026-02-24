# LiteLLM Cost Tracking Implementation Plan

## 1. Deploy LiteLLM Proxy
- Deploy LiteLLM as a separate service with Postgres (required for persistent spend logs and usage APIs).
- Pin a recent stable version (customer usage docs reference `v1.80.8+`).
- Configure `master_key`, `database_url`, and health checks.

## 2. Configure Model Aliases in LiteLLM
- Create `config.yaml` aliases aligned to app workflows:
  - `summary`
  - `translation`
  - `job-fit`
  - `telegram-chat`
  - `transcription-groq`
  - `transcription-openai`
- Map aliases to current models:
  - `gpt-5-mini`
  - `claude-haiku-4-5`
  - `gpt-4o`
  - `groq/whisper-large-v3`
  - `whisper-1`
- For transcription aliases, set `model_info.mode: audio_transcription`.
- Add custom pricing only when a model/variant mismatch requires it.

## 3. Add App Configuration
- Add env vars:
  - `LITELLM_ENABLED`
  - `LITELLM_BASE_URL`
  - `LITELLM_API_KEY`
  - per-workflow model alias env vars
- Add a single config helper (for example, `src/services/ai/litellm.config.ts`) to centralize parsing/defaults.

## 4. Route AI Calls Through LiteLLM
- Update these files to use LiteLLM base URL + key:
  - `src/services/ai/providers/openai.client.ts`
  - `src/services/ai/providers/anthropic.client.ts`
  - `src/services/ai/text-ai.service.ts`
  - `src/services/ai/transcription-ai.service.ts`
  - `src/services/chat.ts`
  - `src/services/index.ts`
- Keep direct-provider fallback behind `LITELLM_ENABLED` for rollback safety.
- Pass user/customer attribution on requests where available (`user` or `x-litellm-customer-id`).

## 5. Cost Visibility (MVP)
- Use LiteLLM as source of truth for spend:
  - `/global/spend/report`
  - `/user/daily/activity`
  - `/spend/logs`
- Validate response headers for debugging and reconciliation:
  - `x-litellm-response-cost`
  - `x-litellm-call-id`

## 6. Optional Phase: Persist Cost in Turso
- If you need product-side analytics, add `llm_cost_events` table in your DB.
- Add an Inngest sync job to ingest from LiteLLM `/spend/logs`.
- Join cost records to internal objects (`transcriptionId`, `analysisId`, workflow, model alias).

## 7. Testing and Rollout
- Update tests around provider initialization and routing:
  - `src/services/__tests__/ai.services.test.ts`
  - affected Inngest tests
- Staging verification checklist:
  - Execute one request per workflow.
  - Confirm spend appears in LiteLLM.
  - Confirm attribution and model alias mapping.
- Roll out gradually in production behind `LITELLM_ENABLED`.

## Open Decisions
1. LiteLLM-only reporting, or LiteLLM + Turso mirrored cost data?
2. Per-user attribution only, or per-workflow/per-object attribution as well?
3. Keep Groq URL-based transcription flow, or standardize on file upload through proxy?

## References
- https://docs.litellm.ai/docs/proxy/cost_tracking
- https://docs.litellm.ai/docs/proxy/virtual_keys
- https://docs.litellm.ai/docs/proxy/customer_usage
- https://docs.litellm.ai/docs/audio_transcription
- https://docs.litellm.ai/docs/proxy/response_headers
- https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json
