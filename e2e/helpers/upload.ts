import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { del, put } from "@vercel/blob";

const FIXTURE_PATH = resolve(__dirname, "../fixtures/test-audio.m4a");

function getBlobToken(): string {
	const token =
		process.env.BLOB_READ_WRITE_TOKEN ||
		process.env.M4A_TO_NOTES_READ_WRITE_TOKEN;
	if (!token) {
		throw new Error(
			"BLOB_READ_WRITE_TOKEN or M4A_TO_NOTES_READ_WRITE_TOKEN env var is required for e2e tests",
		);
	}
	return token;
}

export async function uploadTestFixture(): Promise<string> {
	const token = getBlobToken();
	const fileBuffer = readFileSync(FIXTURE_PATH);
	const blob = await put(`e2e-test/test-audio-${Date.now()}.m4a`, fileBuffer, {
		access: "public",
		contentType: "audio/mp4",
		token,
	});
	return blob.url;
}

export async function deleteBlob(url: string): Promise<void> {
	await del(url, { token: getBlobToken() });
}
