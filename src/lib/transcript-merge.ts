export interface TranscriptChunkText {
	chunkIndex: number;
	text: string;
}

const WORD_BOUNDARY_RE = /\s+/u;
const COMBINING_MARK_RE = /\p{M}+/gu;
const NON_ALNUM_RE = /[^\p{L}\p{N}]+/gu;

function normalizeToken(token: string): string {
	return token
		.normalize("NFKC")
		.toLowerCase()
		.replace(COMBINING_MARK_RE, "")
		.replace(NON_ALNUM_RE, "");
}

function findWordOverlap(
	leftWords: string[],
	rightWords: string[],
	maxWords = 80,
	minWords = 3,
): number {
	const maxOverlap = Math.min(leftWords.length, rightWords.length, maxWords);

	for (let overlap = maxOverlap; overlap >= minWords; overlap--) {
		let allMatch = true;
		for (let i = 0; i < overlap; i++) {
			const left = normalizeToken(leftWords[leftWords.length - overlap + i]);
			const right = normalizeToken(rightWords[i]);
			if (!left || !right || left !== right) {
				allMatch = false;
				break;
			}
		}
		if (allMatch) return overlap;
	}

	return 0;
}

export function mergeChunkTranscripts(chunks: TranscriptChunkText[]): string {
	if (chunks.length === 0) return "";

	const sorted = [...chunks]
		.sort((a, b) => a.chunkIndex - b.chunkIndex)
		.map((chunk) => chunk.text.trim())
		.filter(Boolean);

	if (sorted.length === 0) return "";
	if (sorted.length === 1) return sorted[0];

	const MAX_TAIL = 80;
	const parts: string[] = [sorted[0]];
	let tailWords = sorted[0].split(WORD_BOUNDARY_RE).filter(Boolean).slice(-MAX_TAIL);

	for (let i = 1; i < sorted.length; i++) {
		const rightText = sorted[i];
		const rightWords = rightText.split(WORD_BOUNDARY_RE).filter(Boolean);

		const overlap = findWordOverlap(tailWords, rightWords);
		if (overlap > 0) {
			const suffix = rightWords.slice(overlap);
			if (suffix.length > 0) {
				parts.push(suffix.join(" "));
				tailWords = tailWords.concat(suffix).slice(-MAX_TAIL);
			}
		} else {
			parts.push(rightText);
			tailWords = rightWords.slice(-MAX_TAIL);
		}
	}

	return parts.join(" ");
}
