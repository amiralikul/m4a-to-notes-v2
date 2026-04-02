import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

describe("TabsTrigger", () => {
	it("styles the active tab using Radix data-state selectors", () => {
		const html = renderToStaticMarkup(
			<Tabs value="summary">
				<TabsList>
					<TabsTrigger value="summary">Summary</TabsTrigger>
					<TabsTrigger value="transcript">Transcript</TabsTrigger>
				</TabsList>
			</Tabs>,
		);

		expect(html).toContain("data-[state=active]:bg-background");
		expect(html).toContain("data-[state=active]:text-foreground");
	});
});
