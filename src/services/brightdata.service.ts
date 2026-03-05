import { z } from "zod";
import { getErrorMessage } from "@/lib/errors";
import type { Logger } from "@/lib/logger";

const triggerResponseSchema = z.object({
	snapshot_id: z.string().min(1),
});

const progressResponseSchema = z.object({
	status: z.string().min(1),
});

const LINKEDIN_JOB_URL_REGEX =
	/^https?:\/\/(www\.)?linkedin\.com\/jobs\/view\/\d+/i;

export interface BrightDataServiceConfig {
	apiKey: string;
	datasetId: string;
	baseUrl?: string;
}

export class BrightDataService {
	private readonly apiKey: string;
	private readonly datasetId: string;
	private readonly baseUrl: string;
	private readonly logger: Logger;

	constructor(config: BrightDataServiceConfig, logger: Logger) {
		this.apiKey = config.apiKey;
		this.datasetId = config.datasetId;
		this.baseUrl = config.baseUrl || "https://api.brightdata.com/datasets/v3";
		this.logger = logger;
	}

	isSupportedLinkedinJobUrl(url: string): boolean {
		return LINKEDIN_JOB_URL_REGEX.test(url);
	}

	async triggerLinkedinJobScrape(url: string): Promise<string> {
		this.assertConfigured();

		const endpoint = `${this.baseUrl}/trigger?dataset_id=${encodeURIComponent(this.datasetId)}&include_errors=true&format=json`;
		const response = await fetch(endpoint, {
			method: "POST",
			headers: this.getHeaders(),
			body: JSON.stringify([{ url }]),
		});

		if (!response.ok) {
			const body = await response.text();
			throw new Error(
				`Bright Data trigger failed (${response.status}): ${body.slice(0, 500)}`,
			);
		}

		const payload = triggerResponseSchema.parse(await response.json());
		this.logger.info("Bright Data scrape triggered", {
			datasetId: this.datasetId,
			snapshotId: payload.snapshot_id,
		});
		return payload.snapshot_id;
	}

	async getSnapshotProgress(snapshotId: string): Promise<string> {
		this.assertConfigured();

		const endpoint = `${this.baseUrl}/progress/${encodeURIComponent(snapshotId)}`;
		const response = await fetch(endpoint, {
			method: "GET",
			headers: this.getHeaders(),
		});

		if (!response.ok) {
			const body = await response.text();
			throw new Error(
				`Bright Data progress failed (${response.status}): ${body.slice(0, 500)}`,
			);
		}

		const payload = progressResponseSchema.parse(await response.json());
		return payload.status.toLowerCase();
	}

	async getSnapshot(snapshotId: string): Promise<unknown[]> {
		this.assertConfigured();

		const endpoint = `${this.baseUrl}/snapshot/${encodeURIComponent(snapshotId)}?format=json`;
		const response = await fetch(endpoint, {
			method: "GET",
			headers: this.getHeaders(),
		});

		if (!response.ok) {
			const body = await response.text();
			throw new Error(
				`Bright Data snapshot failed (${response.status}): ${body.slice(0, 500)}`,
			);
		}

		const payload = await response.json();
		if (!Array.isArray(payload)) {
			throw new Error("Bright Data snapshot payload is not an array");
		}
		return payload;
	}

	extractJobDescription(snapshotItems: unknown[]): string {
		const firstItem = snapshotItems[0];
		if (!firstItem || typeof firstItem !== "object") {
			throw new Error("Bright Data snapshot is empty");
		}

		const item = firstItem as Record<string, unknown>;
		const candidates = [
			item.description,
			item.job_description,
			item.jobDescription,
			item.details,
			item.text,
			item.job_details,
		];

		for (const candidate of candidates) {
			if (typeof candidate === "string" && candidate.trim().length > 0) {
				return candidate.trim();
			}
		}

		try {
			return JSON.stringify(item);
		} catch (error) {
			throw new Error(
				`Failed to extract job description from Bright Data payload: ${getErrorMessage(error)}`,
			);
		}
	}

	private getHeaders(): Record<string, string> {
		return {
			Authorization: `Bearer ${this.apiKey}`,
			"Content-Type": "application/json",
		};
	}

	private assertConfigured(): void {
		if (!this.apiKey) {
			throw new Error("BRIGHTDATA_API_KEY is not configured");
		}
		if (!this.datasetId) {
			throw new Error("BRIGHTDATA_LINKEDIN_JOBS_DATASET_ID is not configured");
		}
	}
}
