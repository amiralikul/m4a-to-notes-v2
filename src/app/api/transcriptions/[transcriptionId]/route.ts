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
	const transcription = await transcriptionsService.findById(transcriptionId);
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

	const status = await transcriptionsService.getStatus(transcriptionId);
	return Response.json(status);
}
