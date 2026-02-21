export const SUPPORTED_AUDIO_FORMATS_TEXT =
	"FLAC, MP3, MP4, MPEG, MPGA, M4A, OGG, WAV, WebM";

export const AUDIO_LIMITS = {
	MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB (Groq URL transcription limit on paid tier)
	MAX_FILENAME_LENGTH: 255,
	VALID_MIME_TYPES: [
		"audio/flac",
		"audio/x-flac",
		"audio/mp3",
		"audio/mpga",
		"audio/mpeg",
		"audio/mp4",
		"video/mp4",
		"audio/m4a",
		"audio/x-m4a",
		"audio/ogg",
		"application/ogg",
		"audio/wav",
		"audio/wave",
		"audio/x-wav",
		"audio/webm",
		"video/webm",
	] as readonly string[],
	VALID_EXTENSIONS: [
		".flac",
		".mp3",
		".mp4",
		".mpeg",
		".mpga",
		".m4a",
		".ogg",
		".wav",
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
