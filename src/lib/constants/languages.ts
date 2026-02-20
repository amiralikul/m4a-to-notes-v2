export const SUPPORTED_LANGUAGES = {
	en: "English",
	es: "Spanish",
	fr: "French",
	de: "German",
	ru: "Russian",
	zh: "Chinese",
	ja: "Japanese",
	ko: "Korean",
	ar: "Arabic",
	pt: "Portuguese",
	it: "Italian",
	tr: "Turkish",
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

export function isValidLanguage(code: string): code is LanguageCode {
	return code in SUPPORTED_LANGUAGES;
}
