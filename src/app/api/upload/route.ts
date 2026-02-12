import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { auth } from "@clerk/nextjs/server";
import { AUDIO_LIMITS } from "@/lib/validation";

export async function POST(request: Request) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = (await request.json()) as HandleUploadBody;

	const jsonResponse = await handleUpload({
		body,
		request,
		onBeforeGenerateToken: async (pathname) => {
			return {
				allowedContentTypes: [...AUDIO_LIMITS.VALID_MIME_TYPES],
				maximumSizeInBytes: AUDIO_LIMITS.MAX_FILE_SIZE,
				addRandomSuffix: true,
				pathname: `audio/${userId}/${pathname}`,
			};
		},
		onUploadCompleted: async () => {
			// Optional: log upload completion
		},
	});

	return Response.json(jsonResponse);
}
