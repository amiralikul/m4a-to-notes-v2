import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { auth } from "@clerk/nextjs/server";
import { AUDIO_LIMITS } from "@/lib/validation";

export async function POST(request: Request) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = (await request.json()) as HandleUploadBody;

	try {
		const jsonResponse = await handleUpload({
			body,
			request,
			onBeforeGenerateToken: async () => {
				return {
					allowedContentTypes: [...AUDIO_LIMITS.VALID_MIME_TYPES],
					maximumSizeInBytes: AUDIO_LIMITS.MAX_FILE_SIZE,
					addRandomSuffix: true,
				};
			},
			onUploadCompleted: async () => {
				// Note: this callback does not work on localhost
			},
		});

		return Response.json(jsonResponse);
	} catch (error) {
		return Response.json(
			{ error: error instanceof Error ? error.message : "Upload failed" },
			{ status: 400 },
		);
	}
}
