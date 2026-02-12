import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "@/test/db";
import { createTestLogger } from "@/test/setup";
import { UsersService } from "../users";

describe("UsersService", () => {
	let service: UsersService;

	beforeEach(() => {
		const db = createTestDb();
		const logger = createTestLogger();
		service = new UsersService(db, logger);
	});

	describe("get", () => {
		it("returns null for non-existent user", async () => {
			const result = await service.get("user_123");
			expect(result).toBeNull();
		});

		it("throws for empty userId", async () => {
			await expect(service.get("")).rejects.toThrow("User ID is required");
		});
	});

	describe("set", () => {
		it("creates user entitlements", async () => {
			const result = await service.set("user_1", {
				plan: "pro",
				status: "active",
				features: ["transcription"],
				limits: { dailyTranscriptions: 100 },
			});

			expect(result.userId).toBe("user_1");
			expect(result.plan).toBe("pro");
			expect(result.status).toBe("active");
			expect(result.features).toEqual(["transcription"]);
		});

		it("upserts on conflict", async () => {
			await service.set("user_1", {
				plan: "free",
				status: "none",
				features: [],
				limits: {},
			});

			const updated = await service.set("user_1", {
				plan: "pro",
				status: "active",
				features: ["transcription"],
				limits: { dailyTranscriptions: 100 },
			});

			expect(updated.plan).toBe("pro");
			expect(updated.status).toBe("active");
		});

		it("validates plan values", async () => {
			await expect(
				service.set("user_1", {
					plan: "invalid_plan",
					status: "active",
					features: [],
					limits: {},
				}),
			).rejects.toThrow("Invalid plan");
		});

		it("validates status values", async () => {
			await expect(
				service.set("user_1", {
					plan: "free",
					status: "invalid_status",
					features: [],
					limits: {},
				}),
			).rejects.toThrow("Invalid status");
		});
	});

	describe("getWithDefaults (#14)", () => {
		it("returns in-memory defaults without DB write", async () => {
			const result = await service.getWithDefaults("new_user");

			expect(result.userId).toBe("new_user");
			expect(result.plan).toBe("free");
			expect(result.status).toBe("none");
			expect(result.features).toEqual([]);
			expect(result.limits).toEqual({});

			// Verify no DB write occurred
			const dbResult = await service.get("new_user");
			expect(dbResult).toBeNull();
		});

		it("returns existing entitlements when present", async () => {
			await service.set("user_1", {
				plan: "pro",
				status: "active",
				features: ["transcription"],
				limits: {},
			});

			const result = await service.getWithDefaults("user_1");
			expect(result.plan).toBe("pro");
			expect(result.status).toBe("active");
		});
	});

	describe("hasAccess", () => {
		it("grants basic access to all users", async () => {
			const result = await service.hasAccess("new_user", "basic");
			expect(result).toBe(true);
		});

		it("denies pro access to free users", async () => {
			const result = await service.hasAccess("new_user", "pro");
			expect(result).toBe(false);
		});

		it("grants pro access to active pro users", async () => {
			await service.set("user_1", {
				plan: "pro",
				status: "active",
				features: [],
				limits: {},
			});

			const result = await service.hasAccess("user_1", "pro");
			expect(result).toBe(true);
		});

		it("grants pro access to business users", async () => {
			await service.set("user_1", {
				plan: "business",
				status: "active",
				features: [],
				limits: {},
			});

			const result = await service.hasAccess("user_1", "pro");
			expect(result).toBe(true);
		});

		it("denies pro access to canceled pro users", async () => {
			await service.set("user_1", {
				plan: "pro",
				status: "canceled",
				features: [],
				limits: {},
			});

			const result = await service.hasAccess("user_1", "pro");
			expect(result).toBe(false);
		});

		it("denies business access to pro users", async () => {
			await service.set("user_1", {
				plan: "pro",
				status: "active",
				features: [],
				limits: {},
			});

			const result = await service.hasAccess("user_1", "business");
			expect(result).toBe(false);
		});
	});

	describe("delete", () => {
		it("deletes user entitlements", async () => {
			await service.set("user_1", {
				plan: "pro",
				status: "active",
				features: [],
				limits: {},
			});

			await service.delete("user_1");
			const result = await service.get("user_1");
			expect(result).toBeNull();
		});
	});
});
