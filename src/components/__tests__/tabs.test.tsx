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

	it("uses valid orientation selectors so layout sizing classes apply", () => {
		const html = renderToStaticMarkup(
			<Tabs value="summary">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="summary">Summary</TabsTrigger>
					<TabsTrigger value="transcript">Transcript</TabsTrigger>
				</TabsList>
			</Tabs>,
		);

		expect(html).toContain("data-[orientation=horizontal]:flex-col");
		expect(html).toContain("group-data-[orientation=horizontal]/tabs:h-10");
		expect(html).toContain("group-data-[orientation=vertical]/tabs:w-full");
		expect(html).not.toContain("data-horizontal:flex-col");
		expect(html).not.toContain("group-data-horizontal/tabs:h-9");
		expect(html).not.toContain("group-data-vertical/tabs:w-full");
	});
});
