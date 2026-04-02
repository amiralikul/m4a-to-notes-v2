import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("globals.css", () => {
	it("does not import the unresolved shadcn stylesheet", () => {
		const source = readFileSync(
			new URL("../globals.css", import.meta.url),
			"utf8",
		);

		expect(source).not.toContain('@import "shadcn/tailwind.css";');
	});
});
