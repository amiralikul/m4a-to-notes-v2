import { z } from "zod";
import type {
	FlexibleSummaryData,
	LegacySummaryData,
	TranscriptionSummaryData,
} from "@/db/schema";

export const legacySummaryResultSchema = z.object({
	summary: z.string().min(1),
	keyPoints: z.array(z.string().min(1)).min(1),
	actionItems: z.array(
		z.object({
			task: z.string().min(1),
			owner: z.string().optional(),
			dueDate: z.string().optional(),
		}),
	),
	keyTakeaways: z.array(z.string().min(1)).min(1),
});

const summaryRichItemSchema = z.object({
	text: z.string().min(1),
	owner: z.string().nullable().optional(),
	dueDate: z.string().nullable().optional(),
});

const summarySectionSchema = z.object({
	key: z.string().min(1),
	label: z.string().min(1),
	items: z.union([
		z.array(z.string().min(1)),
		z.array(summaryRichItemSchema),
	]),
});

export const flexibleSummaryResultSchema = z.object({
	contentType: z.string().min(1),
	summary: z.string().min(1),
	sections: z.array(summarySectionSchema).min(1),
});

/**
 * Parse summary data that may be in either legacy or flexible format.
 * Tries flexible first, falls back to legacy.
 */
export function parseSummaryResult(data: unknown): TranscriptionSummaryData {
	const flexibleResult = flexibleSummaryResultSchema.safeParse(data);
	if (flexibleResult.success) {
		return flexibleResult.data as FlexibleSummaryData;
	}

	return legacySummaryResultSchema.parse(data) as LegacySummaryData;
}
