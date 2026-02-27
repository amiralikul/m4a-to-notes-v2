import { z } from "zod";
import { route } from "@/lib/route";
import { NotFoundError } from "@/lib/errors";
import { jobAnalysesService } from "@/services";

export const GET = route({
	auth: "required",
	params: z.object({ analysisId: z.string() }),
	handler: async ({ userId, params }) => {
		const analysis = await jobAnalysesService.findByIdForUser(
			params.analysisId,
			userId,
		);
		if (!analysis) throw new NotFoundError("Analysis not found");

		return {
			analysisId: analysis.id,
			status: analysis.status,
			jobSourceType: analysis.jobSourceType,
			jobUrl: analysis.jobUrl,
			compatibilityScore: analysis.compatibilityScore,
			result: analysis.resultData,
			error: analysis.errorMessage
				? {
						code: analysis.errorCode,
						message: analysis.errorMessage,
					}
				: null,
			createdAt: analysis.createdAt,
			startedAt: analysis.startedAt,
			completedAt: analysis.completedAt,
			updatedAt: analysis.updatedAt,
		};
	},
});
