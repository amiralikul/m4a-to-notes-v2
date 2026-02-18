import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/test/db";
import { createTestLogger } from "@/test/setup";
import { TrialUsageService } from "../trial-usage";

describe("TrialUsageService", () => {
	let service: TrialUsageService;

	beforeEach(() => {
		const db = createTestDb();
		const logger = createTestLogger();
		service = new TrialUsageService(db, logger);
	});

	it("returns full daily quota for new anon id", async () => {
		const remaining = await service.getRemaining("anon-1", "2026-02-16");
		expect(remaining).toBe(3);
	});

	it("consumes up to three slots and then blocks further usage", async () => {
		const dayKey = "2026-02-16";

		expect(await service.consumeSlot("anon-1", dayKey)).toBe(true);
		expect(await service.getRemaining("anon-1", dayKey)).toBe(2);

		expect(await service.consumeSlot("anon-1", dayKey)).toBe(true);
		expect(await service.getRemaining("anon-1", dayKey)).toBe(1);

		expect(await service.consumeSlot("anon-1", dayKey)).toBe(true);
		expect(await service.getRemaining("anon-1", dayKey)).toBe(0);

		expect(await service.consumeSlot("anon-1", dayKey)).toBe(false);
		expect(await service.getRemaining("anon-1", dayKey)).toBe(0);
	});

	it("tracks each UTC day independently", async () => {
		expect(await service.consumeSlot("anon-1", "2026-02-16")).toBe(true);
		expect(await service.getRemaining("anon-1", "2026-02-16")).toBe(2);
		expect(await service.getRemaining("anon-1", "2026-02-17")).toBe(3);
	});
});
