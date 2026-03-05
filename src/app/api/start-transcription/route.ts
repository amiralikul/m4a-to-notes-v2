import { z } from "zod";
import { route } from "@/lib/route";
import { TRIAL_ERROR_CODES } from "@/lib/trial-errors";
import { TranscriptionStatus } from "@/services/transcriptions";
import {
	getUtcDayKey,
	TRIAL_DAILY_LIMIT,
} from "@/lib/trial-identity";
import {
	actorsService,
	transcriptionChunksService,
	transcriptionsService,
	trialUsageService,
	workflowService,
} from "@/services";
import { logger } from "@/lib/logger";

const transcriptionChunkInputSchema = z.object({
	chunkIndex: z.number().int().min(0),
	blobUrl: z.url(),
	startMs: z.number().int().min(0),
	endMs: z.number().int().gt(0),
});

const startTranscriptionBodySchema = z
	.object({
		blobUrl: z.url().optional(),
		chunks: z.array(transcriptionChunkInputSchema).min(1).optional(),
		filename: z.string(),
		enableDiarization: z.boolean().optional().default(false),
	})
	.superRefine((body, ctx) => {
		const hasBlobUrl = Boolean(body.blobUrl);
		const hasChunks = Boolean(body.chunks);

		if (!hasBlobUrl && !hasChunks) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Provide either blobUrl or chunks",
				path: ["blobUrl"],
			});
		}

		if (hasBlobUrl && hasChunks) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Provide either blobUrl or chunks, not both",
				path: ["chunks"],
			});
		}

		if (hasChunks && body.enableDiarization) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Diarization is not supported for chunked uploads",
				path: ["enableDiarization"],
			});
		}

		if (body.chunks) {
			const seen = new Set<number>();
			for (const chunk of body.chunks) {
				if (seen.has(chunk.chunkIndex)) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: "Chunk indices must be unique",
						path: ["chunks"],
					});
					break;
				}
				seen.add(chunk.chunkIndex);

				if (chunk.endMs <= chunk.startMs) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: "Chunk endMs must be greater than startMs",
						path: ["chunks"],
					});
					break;
				}
			}
		}
	});

export const POST = route({
	auth: "optional",
	body: startTranscriptionBodySchema,
	handler: async ({ userId, actorId, body }) => {
		let resolvedActorId: string | null = actorId;

		if (userId) {
			resolvedActorId = await actorsService.getOrCreateForUser(userId);
		} else if (resolvedActorId) {
			const consumed = await trialUsageService.consumeSlot(
				resolvedActorId,
				getUtcDayKey(),
			);
			if (!consumed) {
				return Response.json(
					{
						error: `Daily free limit reached (${TRIAL_DAILY_LIMIT} files/day).`,
						code: TRIAL_ERROR_CODES.DAILY_LIMIT_REACHED,
					},
					{ status: 429 },
				);
			}
		}

		const isChunked = Boolean(body.chunks);
		const primaryAudioKey = body.blobUrl ?? body.chunks?.[0]?.blobUrl;

		const transcriptionId = await transcriptionsService.create({
			audioKey: primaryAudioKey!,
			filename: body.filename,
			source: "web",
			userId: userId ?? undefined,
			ownerId: resolvedActorId ?? undefined,
			userMetadata: {
				...(userId ? { userId } : {}),
				actorId: resolvedActorId,
				uploadMode: isChunked ? "chunked" : "single",
				chunkCount: body.chunks?.length ?? 0,
			},
			enableDiarization: body.enableDiarization,
		});

		if (body.chunks?.length) {
			await transcriptionChunksService.createMany(
				transcriptionId,
				body.chunks,
			);
		}

		await workflowService.startTranscription(transcriptionId);

		logger.info("Transcription started", {
			transcriptionId,
			userId,
			actorId: resolvedActorId,
			filename: body.filename,
			uploadMode: isChunked ? "chunked" : "single",
			chunkCount: body.chunks?.length ?? 0,
		});

		return Response.json(
			{ transcriptionId, status: TranscriptionStatus.PENDING },
			{ status: 201 },
		);
	},
});
