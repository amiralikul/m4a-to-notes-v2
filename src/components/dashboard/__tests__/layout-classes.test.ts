import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DASHBOARD_WORKSPACE_GRID_CLASS } from "../layout-classes";

describe("dashboard layout classes", () => {
	it("locks the desktop workspace rail to 320px", () => {
		expect(DASHBOARD_WORKSPACE_GRID_CLASS).toContain(
			"lg:grid-cols-[320px_minmax(0,1fr)]",
		);
	});

	it("opts the dashboard workspace into the compact upload rail", () => {
		const source = readFileSync(
			new URL("../dashboard-workspace.tsx", import.meta.url),
			"utf8",
		);

		expect(source).toContain('variant="dashboardCompact"');
	});
});
