import { auth } from "@clerk/nextjs/server";
import { resolveActorIdentity } from "@/lib/trial-identity";
import { actorsService, transcriptionsService } from "@/services";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
	const { userId } = await auth();
	let actorId: string | null = null;

	try {
		const url = new URL(request.url);
		const limit = Math.min(
			Number(url.searchParams.get("limit") || "50"),
			50,
		);

		if (!userId) {
			const identity = await resolveActorIdentity();
			actorId = identity.actorId;
			await actorsService.ensureActor(actorId);
		}
		const resolvedActorId = actorId as string;

		const [transcriptions, total] = await Promise.all([
			userId
				? transcriptionsService.findByUserId(userId, limit)
				: transcriptionsService.findByActorId(resolvedActorId, limit),
			userId
				? transcriptionsService.countByUserId(userId)
				: transcriptionsService.countByActorId(resolvedActorId),
		]);

		return Response.json({
			transcriptions: transcriptions.map((t) => ({
				id: t.id,
				filename: t.filename,
				status: t.status,
				progress: t.progress,
				preview: t.preview,
				summaryStatus: t.summaryStatus,
				summaryUpdatedAt: t.summaryUpdatedAt,
				createdAt: t.createdAt,
				completedAt: t.completedAt,
				audioKey: t.audioKey,
			})),
			total,
		});
	} catch (error) {
		logger.error("Failed to list transcriptions", {
			userId,
			actorId,
			error: getErrorMessage(error),
		});
		return Response.json(
			{ error: "Failed to list transcriptions" },
			{ status: 500 },
		);
	}
}
