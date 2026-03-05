import { z } from "zod";

function sanitizeListItem(value: string): string {
	return value
		.replace(/^\s*[-*•●▪◦‣∙]+\s*/, "")
		.replace(/^\s*\d+[\).\-\s]+/, "")
		.trim();
}

function normalizeListValue(raw: unknown): unknown {
	if (Array.isArray(raw)) {
		return raw
			.map((item) => (typeof item === "string" ? sanitizeListItem(item) : ""))
			.filter((item) => item.length > 0);
	}

	if (typeof raw === "string") {
		return raw
			.split(/\r?\n+/)
			.map(sanitizeListItem)
			.filter((item) => item.length > 0);
	}

	return raw;
}

function listSchema(minItems = 1) {
	return z.preprocess(
		normalizeListValue,
		z.array(z.string().min(1)).min(minItems),
	);
}

const oneWeekPlanSchema = z.object({
	day: z.number().int().min(1).max(7),
	title: z.string().min(1),
	tasks: listSchema(1),
});

export const jobFitResultSchema = z.object({
	compatibilityScore: z.number().int().min(0).max(100),
	compatibilitySummary: z.string().min(1),
	strengths: listSchema(1),
	gaps: listSchema(1),
	interviewQuestions: listSchema(3),
	interviewPreparation: listSchema(1),
	oneWeekPlan: z.array(oneWeekPlanSchema).length(7),
});
