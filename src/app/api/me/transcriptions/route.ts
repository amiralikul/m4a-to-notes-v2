import { auth } from "@clerk/nextjs/server";
import { transcriptionsService } from "@/services";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const url = new URL(request.url);
		const limit = Math.min(
			Number(url.searchParams.get("limit") || "50"),
			50,
		);

		const [transcriptions, total] = await Promise.all([
			transcriptionsService.findByUserId(userId, limit),
			transcriptionsService.countByUserId(userId),
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
			error: getErrorMessage(error),
		});
		return Response.json(
			{ error: "Failed to list transcriptions" },
			{ status: 500 },
		);
	}
}
