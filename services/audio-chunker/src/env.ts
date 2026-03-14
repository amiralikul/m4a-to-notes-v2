import { z } from "zod";

const emptyStringToUndefined = (value: unknown) =>
	value === "" ? undefined : value;

const chunkerEnvSchema = z.object({
	LOG_LEVEL: z.string().min(1).default("info"),
	BLOB_READ_WRITE_TOKEN: z.preprocess(
		emptyStringToUndefined,
		z.string().min(1).optional(),
	),
	M4A_TO_NOTES_READ_WRITE_TOKEN: z.preprocess(
		emptyStringToUndefined,
		z.string().min(1).optional(),
	),
	ALLOWED_ORIGINS: z.preprocess(
		emptyStringToUndefined,
		z.string().min(1).optional(),
	),
	PORT: z.preprocess(emptyStringToUndefined, z.coerce.number().int().default(8080)),
});

export type ChunkerEnv = z.infer<typeof chunkerEnvSchema>;

export function getChunkerEnv(): ChunkerEnv {
	return chunkerEnvSchema.parse(process.env);
}
