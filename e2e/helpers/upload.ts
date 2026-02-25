import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { del, put } from "@vercel/blob";

const FIXTURE_PATH = resolve(__dirname, "../fixtures/test-audio.m4a");

const blobToken =
	process.env.BLOB_READ_WRITE_TOKEN ||
	process.env.M4A_TO_NOTES_READ_WRITE_TOKEN;

export async function uploadTestFixture(): Promise<string> {
	const fileBuffer = readFileSync(FIXTURE_PATH);
	const blob = await put(`e2e-test/test-audio-${Date.now()}.m4a`, fileBuffer, {
		access: "public",
		contentType: "audio/mp4",
		token: blobToken,
	});
	return blob.url;
}

export async function deleteBlob(url: string): Promise<void> {
	await del(url, { token: blobToken });
}
