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
	const status = await transcriptionsService.getStatus(transcriptionId);

	if (!status) {
		return Response.json(
			{ error: "Transcription not found" },
			{ status: 404 },
		);
	}

	return Response.json(status);
}
