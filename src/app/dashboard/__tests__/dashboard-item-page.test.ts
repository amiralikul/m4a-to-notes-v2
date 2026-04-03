import { describe, expect, it, vi } from "vitest";

const redirect = vi.fn();

vi.mock("next/navigation", () => ({
	redirect: (url: string) => redirect(url),
}));

describe("DashboardItemPage", () => {
	it("redirects /dashboard/[id] to the canonical workspace URL", async () => {
		const Page = (await import("../[id]/page")).default;

		await Page({ params: Promise.resolve({ id: "tr_1" }) } as never);

		expect(redirect).toHaveBeenCalledWith("/dashboard?item=tr_1");
	});
});
