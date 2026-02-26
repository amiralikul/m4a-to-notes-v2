import { z } from "zod";
import { route } from "@/lib/route";
import { ValidationError } from "@/lib/errors";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import {
	brightDataService,
	jobAnalysesService,
	workflowService,
} from "@/services";
import { JobSourceType } from "@/services/job-analyses";

const createAnalysisSchema = z
	.object({
		resumeText: z.string().trim().min(50).max(20_000),
		jobUrl: z.string().trim().url().optional(),
		jobDescription: z.string().trim().min(80).optional(),
	})
	.refine(
		(payload) =>
			(payload.jobUrl && !payload.jobDescription) ||
			(!payload.jobUrl && payload.jobDescription),
		{
			message: "Provide exactly one of jobUrl or jobDescription",
			path: ["jobUrl"],
		},
	);

export const POST = route({
	auth: "required",
	body: createAnalysisSchema,
	handler: async ({ userId, body }) => {
		if (
			body.jobUrl &&
			!brightDataService.isSupportedLinkedinJobUrl(body.jobUrl)
		) {
			throw new ValidationError(
				"Only LinkedIn job URLs are supported for MVP (linkedin.com/jobs/view/...)",
			);
		}

		const analysisId = await jobAnalysesService.create({
			userId,
			resumeText: body.resumeText,
			jobSourceType: body.jobUrl
				? JobSourceType.URL
				: JobSourceType.TEXT,
			jobUrl: body.jobUrl,
			jobDescriptionInput: body.jobDescription,
		});

		try {
			await workflowService.requestJobAnalysis(analysisId);
		} catch (workflowError) {
			try {
				await jobAnalysesService.markFailed(
					analysisId,
					"WORKFLOW_TRIGGER_FAILED",
					getErrorMessage(workflowError),
				);
			} catch (markFailedError) {
				logger.error(
					"Failed to mark analysis as failed after trigger error",
					{
						analysisId,
						error: getErrorMessage(markFailedError),
					},
				);
			}
			throw workflowError;
		}

		return Response.json(
			{
				analysisId,
				status: "queued",
			},
			{ status: 202 },
		);
	},
});
