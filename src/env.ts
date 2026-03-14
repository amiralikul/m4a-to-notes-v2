import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const emptyStringToUndefined = (value: unknown) =>
	value === "" ? undefined : value;

const optionalString = () =>
	z.preprocess(emptyStringToUndefined, z.string().min(1).optional());

const optionalInt = () =>
	z.preprocess(emptyStringToUndefined, z.coerce.number().int().optional());

export const env = createEnv({
	server: {
		NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
		TURSO_DATABASE_URL: optionalString(),
		TURSO_AUTH_TOKEN: optionalString(),
		LOG_LEVEL: z.enum(["ERROR", "WARN", "INFO", "DEBUG"]).default("INFO"),
		GOOGLE_CLIENT_ID: optionalString(),
		GOOGLE_CLIENT_SECRET: optionalString(),
		RESEND_API_KEY: optionalString(),
		AUTH_EMAIL_FROM: optionalString(),
		AUTH_EMAIL_APP_NAME: z.string().min(1).default("AudioScribe"),
		TRANSCRIPTION_PROVIDER: optionalString(),
		SUMMARY_PROVIDER: optionalString(),
		GROQ_API_KEY: optionalString(),
		OPENAI_API_KEY: optionalString(),
		SUMMARY_MODEL: optionalString(),
		BRIGHTDATA_API_KEY: optionalString(),
		BRIGHTDATA_LINKEDIN_JOBS_DATASET_ID: z
			.string()
			.min(1)
			.default("gd_lpfll7v5hcqtkxl6l"),
		ANTHROPIC_API_KEY: optionalString(),
		ANTHROPIC_MODEL: z.string().min(1).default("claude-haiku-4-5"),
		ANTHROPIC_MAX_RETRIES: optionalInt(),
		ANTHROPIC_MAX_ATTEMPTS: optionalInt(),
		ASSEMBLYAI_API_KEY: optionalString(),
		BLOB_READ_WRITE_TOKEN: optionalString(),
		M4A_TO_NOTES_READ_WRITE_TOKEN: optionalString(),
		TRIAL_COOKIE_SECRET: optionalString(),
		LEMONSQUEEZY_API_KEY: optionalString(),
		LEMONSQUEEZY_STORE_ID: optionalString(),
		LEMONSQUEEZY_WEBHOOK_SECRET: optionalString(),
	},
	client: {
		NEXT_PUBLIC_APP_URL: optionalString(),
		NEXT_PUBLIC_AUDIO_CHUNKER_URL: optionalString(),
		NEXT_PUBLIC_LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID: optionalString(),
		NEXT_PUBLIC_LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID: optionalString(),
	},
	runtimeEnv: {
		NODE_ENV: process.env.NODE_ENV,
		TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
		TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
		LOG_LEVEL: process.env.LOG_LEVEL,
		GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
		RESEND_API_KEY: process.env.RESEND_API_KEY,
		AUTH_EMAIL_FROM: process.env.AUTH_EMAIL_FROM,
		AUTH_EMAIL_APP_NAME: process.env.AUTH_EMAIL_APP_NAME,
		TRANSCRIPTION_PROVIDER: process.env.TRANSCRIPTION_PROVIDER,
		SUMMARY_PROVIDER: process.env.SUMMARY_PROVIDER,
		GROQ_API_KEY: process.env.GROQ_API_KEY,
		OPENAI_API_KEY: process.env.OPENAI_API_KEY,
		SUMMARY_MODEL: process.env.SUMMARY_MODEL,
		BRIGHTDATA_API_KEY: process.env.BRIGHTDATA_API_KEY,
		BRIGHTDATA_LINKEDIN_JOBS_DATASET_ID:
			process.env.BRIGHTDATA_LINKEDIN_JOBS_DATASET_ID,
		ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
		ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
		ANTHROPIC_MAX_RETRIES: process.env.ANTHROPIC_MAX_RETRIES,
		ANTHROPIC_MAX_ATTEMPTS: process.env.ANTHROPIC_MAX_ATTEMPTS,
		ASSEMBLYAI_API_KEY: process.env.ASSEMBLYAI_API_KEY,
		BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
		M4A_TO_NOTES_READ_WRITE_TOKEN: process.env.M4A_TO_NOTES_READ_WRITE_TOKEN,
		TRIAL_COOKIE_SECRET: process.env.TRIAL_COOKIE_SECRET,
		LEMONSQUEEZY_API_KEY: process.env.LEMONSQUEEZY_API_KEY,
		LEMONSQUEEZY_STORE_ID: process.env.LEMONSQUEEZY_STORE_ID,
		LEMONSQUEEZY_WEBHOOK_SECRET: process.env.LEMONSQUEEZY_WEBHOOK_SECRET,
		NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
		NEXT_PUBLIC_AUDIO_CHUNKER_URL: process.env.NEXT_PUBLIC_AUDIO_CHUNKER_URL,
		NEXT_PUBLIC_LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID:
			process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID,
		NEXT_PUBLIC_LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID:
			process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID,
	},
});
