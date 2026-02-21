import { auth } from "@clerk/nextjs/server";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { jobAnalysesService } from "@/services";

export async function GET(
	_request: Request,
	context: { params: Promise<{ analysisId: string }> },
) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { analysisId } = await context.params;

	try {
		const analysis = await jobAnalysesService.findByIdForUser(
			analysisId,
			userId,
		);
		if (!analysis) {
			return Response.json({ error: "Analysis not found" }, { status: 404 });
		}

		return Response.json({
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
		});
	} catch (error) {
		logger.error("Failed to get job analysis", {
			analysisId,
			userId,
			error: getErrorMessage(error),
		});
		return Response.json(
			{ error: "Failed to fetch analysis" },
			{ status: 500 },
		);
	}
}
