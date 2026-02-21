import { NonRetriableError } from "inngest";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import {
	brightDataService,
	jobFitAiService,
	jobAnalysesService,
} from "@/services";
import { inngest } from "../client";
import { INNGEST_EVENTS } from "../events";
import {
	JobAnalysisStatus,
	JobSourceType,
} from "@/services/job-analyses";

const MAX_SCRAPE_POLL_ATTEMPTS = 18;
const SCRAPE_POLL_DELAY = "8s";

export const processJobAnalysis = inngest.createFunction(
	{
		id: "process-job-analysis",
		retries: 2,
		concurrency: {
			limit: 5,
		},
		onFailure: async ({ event, error }) => {
			const analysisId = event.data.event.data.analysisId;
			try {
				await jobAnalysesService.markFailed(
					analysisId,
					"MAX_RETRIES_EXCEEDED",
					getErrorMessage(error),
				);
			} catch (dbError) {
				logger.error("Failed to mark job analysis as failed in onFailure", {
					analysisId,
					error: getErrorMessage(dbError),
				});
			}
		},
	},
	{ event: INNGEST_EVENTS.JOB_ANALYSIS_REQUESTED },
	async ({ event, step }) => {
		const { analysisId } = event.data;

		const analysis = await step.run("load-analysis", async () => {
			const result = await jobAnalysesService.findById(analysisId);
			if (!result) {
				throw new NonRetriableError(`Job analysis not found: ${analysisId}`);
			}
			return result;
		});

		if (analysis.status === JobAnalysisStatus.COMPLETED) {
			return {
				status: "skipped",
				reason: "already-completed",
				analysisId,
			};
		}

		await step.run("mark-analysis-processing", async () => {
			if (analysis.status !== JobAnalysisStatus.PROCESSING) {
				await jobAnalysesService.markProcessing(analysisId);
			}
		});

		let resolvedJobDescription = analysis.resolvedJobDescription;

		if (analysis.jobSourceType === JobSourceType.URL) {
			if (!analysis.jobUrl) {
				throw new NonRetriableError(
					`Missing job URL for analysis ${analysisId}`,
				);
			}

			let snapshotId = analysis.brightDataSnapshotId;
			if (!snapshotId) {
				snapshotId = await step.run("trigger-linkedin-job-scrape", async () => {
					const createdSnapshotId =
						await brightDataService.triggerLinkedinJobScrape(analysis.jobUrl as string);
					await jobAnalysesService.updateSnapshot(analysisId, createdSnapshotId);
					return createdSnapshotId;
				});
			}

			let isReady = false;
			for (let attempt = 1; attempt <= MAX_SCRAPE_POLL_ATTEMPTS; attempt += 1) {
				const status = await step.run(
					`poll-brightdata-progress-${attempt}`,
					async () => brightDataService.getSnapshotProgress(snapshotId as string),
				);

				if (status === "ready") {
					isReady = true;
					break;
				}

				if (status === "failed" || status === "error") {
					throw new NonRetriableError(
						`Bright Data scrape failed for snapshot ${snapshotId}`,
					);
				}

				await step.sleep(`wait-for-brightdata-${attempt}`, SCRAPE_POLL_DELAY);
			}

			if (!isReady) {
				throw new Error(
					`Bright Data scrape did not complete after ${MAX_SCRAPE_POLL_ATTEMPTS} polls`,
				);
			}

			const rawSnapshot = await step.run("fetch-brightdata-snapshot", async () =>
				brightDataService.getSnapshot(snapshotId),
			);

			resolvedJobDescription = await step.run(
				"extract-job-description",
				async () => brightDataService.extractJobDescription(rawSnapshot),
			);

			await step.run("save-scrape-output", async () => {
				await jobAnalysesService.saveResolvedJobDescription(
					analysisId,
					resolvedJobDescription as string,
					rawSnapshot,
				);
			});
		} else {
			resolvedJobDescription = analysis.jobDescriptionInput;
		}

		if (!resolvedJobDescription || !resolvedJobDescription.trim()) {
			throw new NonRetriableError("Job description is empty after preparation");
		}

		const result = await step.run("analyze-resume-fit", async () =>
			jobFitAiService.analyzeResumeMatch({
				resumeText: analysis.resumeText,
				jobDescription: resolvedJobDescription as string,
			}),
		);

		await step.run("save-analysis-result", async () => {
			await jobAnalysesService.markCompleted(
				analysisId,
				result,
				jobFitAiService.provider,
				jobFitAiService.model,
			);
		});

		return {
			status: "completed",
			analysisId,
			compatibilityScore: result.compatibilityScore,
		};
	},
);
