export function getTranscriptionTitle(
	displayName: string | null,
	filename: string,
): string {
	const trimmedDisplayName = displayName?.trim();
	if (trimmedDisplayName) {
		return trimmedDisplayName;
	}

	return filename;
}
