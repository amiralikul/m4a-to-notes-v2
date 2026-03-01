export const SUPPORTED_AUDIO_FORMATS_TEXT =
	"FLAC, MP3, MP4, MPEG, MPGA, M4A, OGG, WAV, WebM";

export const AUDIO_LIMITS = {
	MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB (Groq URL transcription limit on paid tier) //FIXME
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
