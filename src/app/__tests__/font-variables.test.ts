import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("font variable wiring", () => {
	it("maps Tailwind font tokens to explicit runtime font variables", () => {
		const globalsSource = readFileSync(
			new URL("../globals.css", import.meta.url),
			"utf8",
		);
		const layoutSource = readFileSync(
			new URL("../layout.tsx", import.meta.url),
			"utf8",
		);

		expect(globalsSource).toContain("--font-sans: var(--font-dm-sans);");
		expect(globalsSource).toContain("--font-mono: var(--font-geist-mono);");
		expect(globalsSource).toContain("--font-dm-sans:");
		expect(globalsSource).toContain("--font-geist-mono:");
		expect(globalsSource).not.toContain("--font-sans: var(--font-sans);");
		expect(layoutSource).not.toContain('variable:"--font-sans"');
		expect(layoutSource).not.toContain('variable: "--font-sans"');
	});
});
