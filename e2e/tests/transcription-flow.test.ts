import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createSignedActorCookie } from "../helpers/auth";
import { createApiClient } from "../helpers/api-client";
import { uploadTestFixture, deleteBlob } from "../helpers/upload";
import { pollUntilComplete } from "../helpers/polling";

describe("Transcription Flow (E2E)", () => {
	let blobUrl: string;

	beforeAll(async () => {
		blobUrl = await uploadTestFixture();
	}, 30_000);

	afterAll(async () => {
		if (blobUrl) {
			try {
				await deleteBlob(blobUrl);
			} catch (error) {
				console.error(
					`[e2e cleanup] Failed to delete blob ${blobUrl}:`,
					error,
				);
			}
		}
	});

	it("should transcribe audio and generate summary", async () => {
		const { cookieHeader } = createSignedActorCookie();
		const api = createApiClient(cookieHeader);

		const startRes = await api.post("/api/start-transcription", {
			blobUrl,
			filename: "test-audio.m4a",
		});

		const startBody = await startRes.json();
		expect(
			startRes.status,
			`Start transcription failed: ${JSON.stringify(startBody)}`,
		).toBe(201);
		const { transcriptionId } = startBody;
		expect(transcriptionId).toBeDefined();

		const result = await pollUntilComplete(
			api.get.bind(api),
			transcriptionId,
		);

		expect(result.status).toBe("completed");
		expect(result.preview).toBeTruthy();
		expect(typeof result.preview).toBe("string");
	});
});
