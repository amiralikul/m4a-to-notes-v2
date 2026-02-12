export const AUDIO_LIMITS = {
	MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB (Whisper API limit)
	MAX_FILENAME_LENGTH: 255,
	VALID_MIME_TYPES: [
		"audio/mp4",
		"audio/m4a",
		"audio/x-m4a",
		"audio/mpeg",
		"audio/wav",
		"audio/aac",
		"audio/ogg",
		"audio/webm",
	] as readonly string[],
	VALID_EXTENSIONS: [
		".m4a",
		".mp3",
		".wav",
		".ogg",
		".aac",
		".webm",
	] as readonly string[],
} as const;

export function validateAudioFile(file: {
	size: number;
	type: string;
	name: string;
}): { valid: boolean; error?: string } {
	if (file.size > AUDIO_LIMITS.MAX_FILE_SIZE) {
		return {
			valid: false,
			error: `File size exceeds ${AUDIO_LIMITS.MAX_FILE_SIZE / 1024 / 1024}MB limit`,
		};
	}

	const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
	const validType =
		AUDIO_LIMITS.VALID_MIME_TYPES.includes(file.type) ||
		AUDIO_LIMITS.VALID_EXTENSIONS.includes(ext);

	if (!validType) {
		return { valid: false, error: "Unsupported audio format" };
	}

	if (file.name.length > AUDIO_LIMITS.MAX_FILENAME_LENGTH) {
		return { valid: false, error: "Filename too long" };
	}

	return { valid: true };
}
