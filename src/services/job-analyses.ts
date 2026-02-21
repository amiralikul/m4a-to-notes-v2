import { desc, eq } from "drizzle-orm";
import type {
	InsertJobAnalysis,
	JobAnalysis,
	JobAnalysisResultData,
	UpdateJobAnalysis,
} from "@/db/schema";
import { jobAnalyses } from "@/db/schema";
import { getErrorMessage } from "@/lib/errors";
import type { Logger } from "@/lib/logger";

export const JobAnalysisStatus = {
	QUEUED: "queued",
	PROCESSING: "processing",
	COMPLETED: "completed",
	FAILED: "failed",
} as const;

export type JobAnalysisStatusType =
	(typeof JobAnalysisStatus)[keyof typeof JobAnalysisStatus];

export const JobSourceType = {
	URL: "url",
	TEXT: "text",
} as const;

export type JobSourceTypeValue = (typeof JobSourceType)[keyof typeof JobSourceType];

type Database = Parameters<typeof eq>[0] extends never
	? never
	: // biome-ignore lint: needed for generic DB type
		any;

export class JobAnalysesService {
	constructor(
		private db: Database,
		private logger: Logger,
	) {}

	async create(input: {
		resumeText: string;
		jobSourceType: JobSourceTypeValue;
		jobUrl?: string;
		jobDescriptionInput?: string;
	}): Promise<string> {
		const analysisId = crypto.randomUUID();
		const now = new Date().toISOString();
		const payload: InsertJobAnalysis = {
			id: analysisId,
			status: JobAnalysisStatus.QUEUED,
			jobSourceType: input.jobSourceType,
			jobUrl: input.jobUrl,
			resumeText: input.resumeText,
			jobDescriptionInput: input.jobDescriptionInput,
			createdAt: now,
			updatedAt: now,
		};

		try {
			await this.db.insert(jobAnalyses).values(payload);
			this.logger.info("Job analysis created", {
				analysisId,
				jobSourceType: input.jobSourceType,
				hasJobUrl: Boolean(input.jobUrl),
			});
			return analysisId;
		} catch (error) {
			this.logger.error("Failed to create job analysis", {
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async findById(id: string): Promise<JobAnalysis | null> {
		try {
			const rows = await this.db
				.select()
				.from(jobAnalyses)
				.where(eq(jobAnalyses.id, id))
				.limit(1);
			return rows[0] ?? null;
		} catch (error) {
			this.logger.error("Failed to find job analysis", {
				id,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async update(id: string, updates: UpdateJobAnalysis): Promise<JobAnalysis> {
		const existing = await this.findById(id);
		if (!existing) {
			throw new Error(`Job analysis not found: ${id}`);
		}

		try {
			const rows = await this.db
				.update(jobAnalyses)
				.set(updates)
				.where(eq(jobAnalyses.id, id))
				.returning();
			return rows[0] as JobAnalysis;
		} catch (error) {
			this.logger.error("Failed to update job analysis", {
				id,
				updates: Object.keys(updates),
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async markProcessing(id: string): Promise<JobAnalysis> {
		return this.update(id, {
			status: JobAnalysisStatus.PROCESSING,
			startedAt: new Date().toISOString(),
		});
	}

	async markFailed(id: string, errorCode: string, errorMessage: string): Promise<JobAnalysis> {
		return this.update(id, {
			status: JobAnalysisStatus.FAILED,
			errorCode,
			errorMessage,
			completedAt: new Date().toISOString(),
		});
	}

	async markCompleted(
		id: string,
		result: JobAnalysisResultData,
		modelProvider: string,
		modelName: string,
	): Promise<JobAnalysis> {
		return this.update(id, {
			status: JobAnalysisStatus.COMPLETED,
			resultData: result,
			compatibilityScore: result.compatibilityScore,
			modelProvider,
			modelName,
			errorCode: null,
			errorMessage: null,
			completedAt: new Date().toISOString(),
		});
	}

	async updateSnapshot(id: string, snapshotId: string): Promise<JobAnalysis> {
		return this.update(id, {
			brightDataSnapshotId: snapshotId,
		});
	}

	async saveResolvedJobDescription(
		id: string,
		resolvedJobDescription: string,
		brightDataRawPayload: unknown,
	): Promise<JobAnalysis> {
		return this.update(id, {
			resolvedJobDescription,
			brightDataRawPayload,
		});
	}

	async listRecent(limit = 50): Promise<JobAnalysis[]> {
		try {
			return await this.db
				.select()
				.from(jobAnalyses)
				.orderBy(desc(jobAnalyses.createdAt))
				.limit(limit);
		} catch (error) {
			this.logger.error("Failed to list job analyses", {
				error: getErrorMessage(error),
			});
			throw error;
		}
	}
}
