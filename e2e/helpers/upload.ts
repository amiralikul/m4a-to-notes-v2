import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { put } from "@vercel/blob";

const FIXTURE_PATH = resolve(__dirname, "../fixtures/test-audio.m4a");

export async function uploadTestFixture(): Promise<string> {
	const fileBuffer = readFileSync(FIXTURE_PATH);
	const blob = await put(`e2e-test/test-audio-${Date.now()}.m4a`, fileBuffer, {
		access: "public",
		contentType: "audio/mp4",
	});
	return blob.url;
}
