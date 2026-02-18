import { auth } from "@clerk/nextjs/server";
import { resolveActorIdentity } from "@/lib/trial-identity";
import { actorsService, transcriptionsService } from "@/services";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ transcriptionId: string }> },
) {
	const { userId } = await auth();
	const actorId = userId ? null : (await resolveActorIdentity()).actorId;
	if (actorId) {
		await actorsService.ensureActor(actorId);
	}

	const { transcriptionId } = await params;
	const transcription =
		await transcriptionsService.findById(transcriptionId);
	const transcriptionActorId =
		typeof transcription?.ownerId === "string"
			? transcription.ownerId
			: null;
	const isOwner = userId
		? transcription?.userId === userId
		: transcriptionActorId === actorId;

	if (!transcription || !isOwner) {
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
