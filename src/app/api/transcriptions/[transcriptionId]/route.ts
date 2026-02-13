import { auth } from "@clerk/nextjs/server";
import { transcriptionsService } from "@/services";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ transcriptionId: string }> },
) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { transcriptionId } = await params;
	const transcription = await transcriptionsService.findById(transcriptionId);

	if (!transcription || transcription.userId !== userId) {
		return Response.json(
			{ error: "Transcription not found" },
			{ status: 404 },
		);
	}

	const status = await transcriptionsService.getStatus(transcriptionId);
	return Response.json(status);
}
