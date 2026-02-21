import { z } from "zod";

export const summaryResultSchema = z.object({
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
