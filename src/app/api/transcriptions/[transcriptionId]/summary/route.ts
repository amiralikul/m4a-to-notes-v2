import { auth } from "@clerk/nextjs/server";
import { transcriptionsService } from "@/services";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ transcriptionId: string }> },
) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	let transcriptionId: string | undefined;
	try {
		const resolvedParams = await params;
		transcriptionId = resolvedParams.transcriptionId;
		const transcription =
			await transcriptionsService.findById(transcriptionId);

		if (!transcription || transcription.userId !== userId) {
			return Response.json(
				{ error: "Transcription not found" },
				{ status: 404 },
			);
		}

		if (!transcription.summaryStatus || transcription.summaryStatus === "pending") {
			return Response.json(
				{ error: "Summary not yet available" },
				{ status: 404 },
			);
		}

		return Response.json({
			transcriptionId: transcription.id,
			summaryStatus: transcription.summaryStatus,
			summaryData: transcription.summaryData,
			summaryError: transcription.summaryError,
			summaryProvider: transcription.summaryProvider,
			summaryModel: transcription.summaryModel,
			summaryUpdatedAt: transcription.summaryUpdatedAt,
		});
	} catch (error) {
		logger.error("Failed to fetch summary", {
			userId,
			transcriptionId,
			error: getErrorMessage(error),
		});
		return Response.json(
			{ error: "Failed to fetch summary" },
			{ status: 500 },
		);
	}
}
