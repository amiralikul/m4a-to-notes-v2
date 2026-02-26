import { route } from "@/lib/route";
import { transcriptionsService } from "@/services";

function mapTranscription(t: {
	id: string;
	filename: string;
	status: string;
	progress: number | null;
	preview: string | null;
	summaryStatus: string | null;
	summaryUpdatedAt: string | null;
	createdAt: string | null;
	completedAt: string | null;
	audioKey: string | null;
}) {
	return {
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
	};
}

export const GET = route({
	auth: "optional",
	handler: async ({ userId, actorId, request }) => {
		const url = new URL(request.url);
		const parsedLimit = Number.parseInt(
			url.searchParams.get("limit") ?? "",
			10,
		);
		const limit =
			Number.isFinite(parsedLimit) && parsedLimit > 0
				? Math.min(parsedLimit, 50)
				: 50;

		if (userId) {
			const [transcriptions, total] = await Promise.all([
				transcriptionsService.findByUserId(userId, limit),
				transcriptionsService.countByUserId(userId),
			]);

			return {
				transcriptions: transcriptions.map(mapTranscription),
				total,
			};
		}

		if (actorId) {
			const [transcriptions, total] = await Promise.all([
				transcriptionsService.findByActorId(actorId, limit),
				transcriptionsService.countByActorId(actorId),
			]);

			return {
				transcriptions: transcriptions.map(mapTranscription),
				total,
			};
		}

		return { transcriptions: [], total: 0 };
	},
});
