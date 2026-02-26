import { AssemblyAI } from "assemblyai";
import type { DiarizationSegment } from "@/db/schema";
import { getErrorMessage } from "@/lib/errors";
import type { Logger } from "@/lib/logger";

export interface AssemblyAiServiceConfig {
	apiKey: string;
}

export type AssemblyAiResult =
	| { status: "completed"; text: string; segments: DiarizationSegment[] | null }
	| { status: "queued" | "processing" }
	| { status: "error"; error: string };

export class AssemblyAiService {
	private client: AssemblyAI | null = null;
	private readonly apiKey: string;
	private readonly logger: Logger;

	constructor(config: AssemblyAiServiceConfig, logger: Logger) {
		this.apiKey = config.apiKey;
		this.logger = logger;
	}

	async submit(audioUrl: string): Promise<string> {
		this.logger.info("Submitting audio to AssemblyAI", { audioUrl });

		const startTime = Date.now();

		try {
			const transcript = await this.getClient().transcripts.submit({
				audio: audioUrl,
				speaker_labels: true,
				speech_models: ["universal-2" as "universal"],
			});

			const duration = Date.now() - startTime;

			this.logger.info("AssemblyAI job submitted", {
				jobId: transcript.id,
				duration: `${duration}ms`,
			});

			return transcript.id;
		} catch (error) {
			const duration = Date.now() - startTime;
			this.logger.error("Failed to submit to AssemblyAI", {
				error: getErrorMessage(error),
				duration: `${duration}ms`,
				audioUrl,
			});
			throw error;
		}
	}

	async getTranscript(jobId: string): Promise<AssemblyAiResult> {
		this.logger.info("Polling AssemblyAI transcript", { jobId });

		try {
			const transcript = await this.getClient().transcripts.get(jobId);

			if (transcript.status === "completed") {
				const segments: DiarizationSegment[] | null =
					transcript.utterances && transcript.utterances.length > 0
						? transcript.utterances.map((u) => ({
								speaker: u.speaker,
								text: u.text,
								start: u.start,
								end: u.end,
							}))
						: null;

				this.logger.info("AssemblyAI transcription completed", {
					jobId,
					textLength: transcript.text?.length ?? 0,
					segmentCount: segments?.length ?? 0,
				});

				return {
					status: "completed",
					text: transcript.text ?? "",
					segments,
				};
			}

			if (transcript.status === "error") {
				this.logger.error("AssemblyAI transcription failed", {
					jobId,
					error: transcript.error,
				});

				return {
					status: "error",
					error: transcript.error ?? "Unknown AssemblyAI error",
				};
			}

			this.logger.info("AssemblyAI transcription in progress", {
				jobId,
				status: transcript.status,
			});

			return { status: transcript.status as "queued" | "processing" };
		} catch (error) {
			this.logger.error("Failed to poll AssemblyAI", {
				jobId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	private getClient(): AssemblyAI {
		if (!this.apiKey) {
			throw new Error("Missing ASSEMBLYAI_API_KEY");
		}

		if (!this.client) {
			this.client = new AssemblyAI({ apiKey: this.apiKey });
		}

		return this.client;
	}
}
