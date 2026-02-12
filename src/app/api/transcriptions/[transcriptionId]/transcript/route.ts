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
	const transcription =
		await transcriptionsService.findById(transcriptionId);

	if (!transcription) {
		return Response.json(
			{ error: "Transcription not found" },
			{ status: 404 },
		);
	}

	if (!transcription.transcriptText) {
		return Response.json(
			{ error: "Transcript not yet available" },
			{ status: 404 },
		);
	}

	return new Response(transcription.transcriptText, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Content-Disposition": `attachment; filename="${transcription.filename.replace(/\.[^.]+$/, "")}.txt"`,
		},
	});
}
