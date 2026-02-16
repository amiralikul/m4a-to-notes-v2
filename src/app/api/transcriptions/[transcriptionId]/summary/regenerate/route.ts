import { auth } from "@clerk/nextjs/server";
import { inngest } from "@/inngest/client";
import { INNGEST_EVENTS } from "@/inngest/events";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { transcriptionsService } from "@/services";
import { TranscriptionStatus } from "@/services/transcriptions";

export async function POST(
	_request: Request,
	{ params }: { params: Promise<{ transcriptionId: string }> },
) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { transcriptionId } = await params;

	try {
		const transcription =
			await transcriptionsService.findById(transcriptionId);

		if (!transcription || transcription.userId !== userId) {
			return Response.json(
				{ error: "Transcription not found" },
				{ status: 404 },
			);
		}

		if (
			transcription.status !== TranscriptionStatus.COMPLETED ||
			!transcription.transcriptText
		) {
			return Response.json(
				{
					error:
						"Cannot regenerate summary until transcription is completed",
				},
				{ status: 400 },
			);
		}

		await transcriptionsService.markSummaryPending(transcriptionId);

		await inngest.send({
			name: INNGEST_EVENTS.TRANSCRIPTION_COMPLETED,
			data: { transcriptionId },
		});

		return Response.json(
			{
				status: "queued",
				transcriptionId,
				summaryStatus: "pending",
			},
			{ status: 202 },
		);
	} catch (error) {
		logger.error("Failed to queue summary regeneration", {
			userId,
			transcriptionId,
			error: getErrorMessage(error),
		});

		return Response.json(
			{ error: "Failed to queue summary regeneration" },
			{ status: 500 },
		);
	}
}
