export function buildJobFitPrompt(input: {
	resumeText: string;
	jobDescription: string;
}): string {
	return [
		"Compare this resume against the job description.",
		"Return only JSON matching this schema:",
		`{
  "compatibilityScore": number 0-100,
  "compatibilitySummary": string,
  "strengths": string[],
  "gaps": string[],
  "interviewQuestions": string[],
  "interviewPreparation": string[],
  "oneWeekPlan": [{"day":1-7,"title":"string","tasks":["string"]}]
}`,
		"Rules:",
		"- Evidence-based score.",
		"- Exactly 7 oneWeekPlan entries (days 1-7).",
		"- Keep arrays concise and practical.",
		"- strengths, gaps, interviewQuestions, interviewPreparation, and oneWeekPlan[].tasks must be JSON arrays, never newline strings.",
		"- No markdown, no extra keys.",
		"",
		"Resume:",
		input.resumeText,
		"",
		"Job description:",
		input.jobDescription,
	].join("\n");
}
