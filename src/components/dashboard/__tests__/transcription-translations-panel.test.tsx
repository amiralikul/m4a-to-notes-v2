import { isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { SelectGroup } from "@/components/ui/select";
import { TranscriptionTranslationsPanel } from "../transcription-translations-panel";

function containsElementType(node: ReactNode, type: unknown): boolean {
	if (Array.isArray(node)) {
		return node.some((child) => containsElementType(child, type));
	}

	if (!isValidElement(node)) {
		return false;
	}

	const element = node as ReactElement<{ children?: ReactNode }>;

	if (element.type === type) {
		return true;
	}

	return containsElementType(element.props.children, type);
}

describe("TranscriptionTranslationsPanel", () => {
	it("wraps language options in SelectGroup for proper select spacing", () => {
		const tree = TranscriptionTranslationsPanel({
			translations: [],
			availableLanguages: [
				["es", "Spanish"],
				["fr", "French"],
			],
			selectedLanguage: "",
			onSelectedLanguageChange: vi.fn(),
		});

		expect(containsElementType(tree, SelectGroup)).toBe(true);
	});
});
