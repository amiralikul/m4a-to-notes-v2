import { route } from "@/lib/route";
import { transcriptionsService, translationsService } from "@/services";
import type { Transcription } from "@/db/schema";

function mapTranscription(
	t: Transcription,
	translationCounts: Map<string, number>,
) {
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
		enableDiarization: t.enableDiarization,
		translationCount: translationCounts.get(t.id) ?? 0,
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

			const translationCounts =
				await translationsService.countByTranscriptionIds(
					transcriptions.map((t) => t.id),
				);

			return {
				transcriptions: transcriptions.map((t) =>
					mapTranscription(t, translationCounts),
				),
				total,
			};
		}

		if (actorId) {
			const [transcriptions, total] = await Promise.all([
				transcriptionsService.findByActorId(actorId, limit),
				transcriptionsService.countByActorId(actorId),
			]);

			const translationCounts =
				await translationsService.countByTranscriptionIds(
					transcriptions.map((t) => t.id),
				);

			return {
				transcriptions: transcriptions.map((t) =>
					mapTranscription(t, translationCounts),
				),
				total,
			};
		}

		return { transcriptions: [], total: 0 };
	},
});
