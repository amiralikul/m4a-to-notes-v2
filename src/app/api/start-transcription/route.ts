import { auth } from "@clerk/nextjs/server";
import { inngest } from "@/inngest/client";
import { INNGEST_EVENTS } from "@/inngest/events";
import { transcriptionsService } from "@/services";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { blobUrl, filename } = (await request.json()) as {
			blobUrl: string;
			filename: string;
		};

		if (!blobUrl || !filename) {
			return Response.json(
				{ error: "blobUrl and filename are required" },
				{ status: 400 },
			);
		}

		const transcriptionId = await transcriptionsService.create({
			audioKey: blobUrl,
			filename,
			source: "web",
			userId,
			userMetadata: { userId },
		});

		await inngest.send({
			name: INNGEST_EVENTS.TRANSCRIPTION_REQUESTED,
			data: { transcriptionId },
		});

		logger.info("Transcription started", {
			transcriptionId,
			userId,
			filename,
		});

		return Response.json(
			{ transcriptionId, status: "pending" },
			{ status: 201 },
		);
	} catch (error) {
		logger.error("Failed to start transcription", {
			userId,
			error: getErrorMessage(error),
		});
		return Response.json(
			{ error: "Failed to start transcription" },
			{ status: 500 },
		);
	}
}
