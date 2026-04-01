import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DashboardUploadRail } from "../dashboard-upload-rail";

describe("DashboardUploadRail", () => {
	it("renders a compact toolbar-style upload rail for the dashboard", () => {
		const html = renderToStaticMarkup(
			<DashboardUploadRail
				isDragOver={false}
				onBrowseClick={() => {}}
				formatsLabel="9 formats supported"
				maxSizeLabel="Max 1 GB per file"
			/>,
		);

		expect(html).toContain("Add a recording");
		expect(html).toContain(
			"Drag audio here or browse to add another file without leaving the workspace.",
		);
		expect(html).toContain("Upload files");
		expect(html).toContain("9 formats supported");
		expect(html).toContain("Max 1 GB per file");
		expect(html).toContain("min-h-[5.5rem]");
		expect(html).not.toContain("py-16");
	});
});
