import { del, put } from "@vercel/blob";
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";

const blobToken =
	process.env.BLOB_READ_WRITE_TOKEN ||
	process.env.M4A_TO_NOTES_READ_WRITE_TOKEN;

export class StorageService {
	async uploadContent(
		pathname: string,
		content: string | ArrayBuffer | Blob,
		contentType: string,
	): Promise<string> {
		try {
			const blob = await put(pathname, content, {
				access: "public",
				contentType,
				token: blobToken,
			});

			logger.info("Content uploaded to Vercel Blob", {
				pathname,
				contentType,
				url: blob.url,
			});

			return blob.url;
		} catch (error) {
			logger.error("Failed to upload content to Vercel Blob", {
				pathname,
				contentType,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async downloadContent(blobUrl: string): Promise<ArrayBuffer> {
		try {
			const response = await fetch(blobUrl);
			if (!response.ok) {
				throw new Error(
					`Failed to download blob: ${response.status} ${response.statusText}`,
				);
			}

			const content = await response.arrayBuffer();

			logger.info("Content downloaded from Vercel Blob", {
				blobUrl,
				size: content.byteLength,
			});

			return content;
		} catch (error) {
			logger.error("Failed to download content from Vercel Blob", {
				blobUrl,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async deleteObject(blobUrl: string): Promise<void> {
		try {
			await del(blobUrl, { token: blobToken });

			logger.info("Object deleted from Vercel Blob", { blobUrl });
		} catch (error) {
			logger.error("Failed to delete object from Vercel Blob", {
				blobUrl,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}
}
