import { describe, it, expect, beforeAll } from "vitest";
import { createSignedActorCookie } from "../helpers/auth";
import { createApiClient } from "../helpers/api-client";
import { uploadTestFixture } from "../helpers/upload";
import { pollUntilComplete } from "../helpers/polling";

describe("Transcription Flow (E2E)", () => {
	let blobUrl: string;

	beforeAll(async () => {
		blobUrl = await uploadTestFixture();
	}, 30_000);

	it("should transcribe audio and generate summary", async () => {
		const { cookieHeader } = createSignedActorCookie();
		const api = createApiClient(cookieHeader);

		const startRes = await api.post("/api/start-transcription", {
			blobUrl,
			filename: "test-audio.m4a",
		});

		expect(startRes.status).toBe(201);
		const { transcriptionId } = await startRes.json();
		expect(transcriptionId).toBeDefined();

		const result = await pollUntilComplete(api.get.bind(api), transcriptionId);

		expect(result.status).toBe("completed");
		expect(result.transcriptText).toBeTruthy();
		expect(typeof result.transcriptText).toBe("string");
	});

	it("should return 404 for transcription owned by different actor", async () => {
		const { cookieHeader: cookie1 } = createSignedActorCookie();
		const { cookieHeader: cookie2 } = createSignedActorCookie();
		const api1 = createApiClient(cookie1);
		const api2 = createApiClient(cookie2);

		const startRes = await api1.post("/api/start-transcription", {
			blobUrl,
			filename: "test-audio.m4a",
		});

		expect(startRes.status).toBe(201);
		const { transcriptionId } = await startRes.json();

		const res = await api2.get(`/api/transcriptions/${transcriptionId}`);
		expect(res.status).toBe(404);
	});
});
