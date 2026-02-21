import { z } from "zod";
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
		resumeText: z.string().trim().min(50),
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

export async function POST(request: Request) {
	let payload: z.infer<typeof createAnalysisSchema>;

	try {
		payload = createAnalysisSchema.parse(await request.json());
	} catch (error) {
		return Response.json(
			{ error: `Invalid request: ${getErrorMessage(error)}` },
			{ status: 400 },
		);
	}

	try {
		if (
			payload.jobUrl &&
			!brightDataService.isSupportedLinkedinJobUrl(payload.jobUrl)
		) {
			return Response.json(
				{
					error:
						"Only LinkedIn job URLs are supported for MVP (linkedin.com/jobs/view/...)",
				},
				{ status: 400 },
			);
		}

		const analysisId = await jobAnalysesService.create({
			resumeText: payload.resumeText,
			jobSourceType: payload.jobUrl ? JobSourceType.URL : JobSourceType.TEXT,
			jobUrl: payload.jobUrl,
			jobDescriptionInput: payload.jobDescription,
		});

		await workflowService.requestJobAnalysis(analysisId);

		return Response.json(
			{
				analysisId,
				status: "queued",
			},
			{ status: 202 },
		);
	} catch (error) {
		logger.error("Failed to create job analysis", {
			error: getErrorMessage(error),
		});
		return Response.json(
			{ error: "Failed to create analysis" },
			{ status: 500 },
		);
	}
}
