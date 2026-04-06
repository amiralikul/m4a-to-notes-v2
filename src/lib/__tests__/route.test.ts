import { describe, it, expect, vi, beforeEach } from "vitest";
import { z, ZodError } from "zod";

vi.mock("@/lib/auth-server", () => ({
	getServerSession: vi.fn(),
}));

vi.mock("@/lib/trial-identity", () => ({
	resolveActorIdentity: vi.fn(),
}));

vi.mock("@/services", () => ({
	actorsService: {
		ensureActor: vi.fn(),
	},
}));

vi.mock("@/lib/logger", () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	},
}));

import { route } from "../route";
import { getServerSession } from "@/lib/auth-server";
import { resolveActorIdentity } from "@/lib/trial-identity";
import { actorsService } from "@/services";
import { NotFoundError, ForbiddenError, ValidationError } from "../errors";

const mockGetServerSession = vi.mocked(getServerSession);
const mockResolveActorIdentity = vi.mocked(resolveActorIdentity);
const mockEnsureActor = vi.mocked(actorsService.ensureActor);

function makeSession(userId: string) {
	return {
		user: {
			id: userId,
			email: `${userId}@test.com`,
			name: "Test User",
		},
		session: {
			id: "sess_1",
			userId,
		},
	} as Awaited<ReturnType<typeof getServerSession>>;
}

function makeRequest(body?: unknown): Request {
	if (body !== undefined) {
		return new Request("http://localhost/test", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});
	}
	return new Request("http://localhost/test");
}

function makeContext(params: Record<string, string>) {
	return { params: Promise.resolve(params) };
}

describe("route()", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("auth: required", () => {
		it("returns 401 when not signed in", async () => {
			mockGetServerSession.mockResolvedValue(null);

			const handler = route({
				auth: "required",
				handler: async () => ({ ok: true }),
			});

			const res = await handler(makeRequest());
			expect(res.status).toBe(401);
			expect(await res.json()).toEqual({ error: "Unauthorized" });
		});

		it("provides userId to handler when signed in", async () => {
			mockGetServerSession.mockResolvedValue(makeSession("user_123"));

			const handler = route({
				auth: "required",
				handler: async (ctx) => ({ userId: ctx.userId }),
			});

			const res = await handler(makeRequest());
			expect(res.status).toBe(200);
			expect(await res.json()).toEqual({ userId: "user_123" });
		});
	});

	describe("auth: optional", () => {
		it("resolves userId when signed in", async () => {
			mockGetServerSession.mockResolvedValue(makeSession("user_123"));

			const handler = route({
				auth: "optional",
				handler: async (ctx) => ({
					userId: ctx.userId,
					actorId: ctx.actorId,
				}),
			});

			const res = await handler(makeRequest());
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.userId).toBe("user_123");
			expect(data.actorId).toBeNull();
			expect(mockResolveActorIdentity).not.toHaveBeenCalled();
		});

		it("resolves actorId when not signed in", async () => {
			mockGetServerSession.mockResolvedValue(null);
			mockResolveActorIdentity.mockResolvedValue({ actorId: "actor_456" });
			mockEnsureActor.mockResolvedValue(undefined as never);

			const handler = route({
				auth: "optional",
				handler: async (ctx) => ({
					userId: ctx.userId,
					actorId: ctx.actorId,
				}),
			});

			const res = await handler(makeRequest());
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data.userId).toBeNull();
			expect(data.actorId).toBe("actor_456");
			expect(mockEnsureActor).toHaveBeenCalledWith("actor_456");
		});
	});

	describe("auth: none", () => {
		it("skips auth entirely", async () => {
			const handler = route({
				auth: "none",
				handler: async () => ({ ok: true }),
			});

			const res = await handler(makeRequest());
			expect(res.status).toBe(200);
			expect(mockGetServerSession).not.toHaveBeenCalled();
		});
	});

	describe("params validation", () => {
		it("validates and passes params to handler", async () => {
			mockGetServerSession.mockResolvedValue(makeSession("user_1"));

			const handler = route({
				auth: "required",
				params: z.object({ id: z.string() }),
				handler: async (ctx) => ({ id: ctx.params.id }),
			});

			const res = await handler(makeRequest(), makeContext({ id: "abc" }));
			expect(res.status).toBe(200);
			expect(await res.json()).toEqual({ id: "abc" });
		});

		it("returns 400 for invalid params", async () => {
			mockGetServerSession.mockResolvedValue(makeSession("user_1"));

			const handler = route({
				auth: "required",
				params: z.object({ id: z.string().uuid() }),
				handler: async () => ({ ok: true }),
			});

			const res = await handler(makeRequest(), makeContext({ id: "not-uuid" }));
			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body.error).toBe("Invalid parameters");
			expect(body.details).toBeDefined();
		});
	});

	describe("body validation", () => {
		it("validates and passes body to handler", async () => {
			mockGetServerSession.mockResolvedValue(makeSession("user_1"));

			const handler = route({
				auth: "required",
				body: z.object({ name: z.string() }),
				handler: async (ctx) => ({ name: ctx.body.name }),
			});

			const res = await handler(makeRequest({ name: "test" }));
			expect(res.status).toBe(200);
			expect(await res.json()).toEqual({ name: "test" });
		});

		it("returns 400 for invalid body", async () => {
			mockGetServerSession.mockResolvedValue(makeSession("user_1"));

			const handler = route({
				auth: "required",
				body: z.object({ name: z.string() }),
				handler: async () => ({ ok: true }),
			});

			const res = await handler(makeRequest({ name: 123 }));
			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body.error).toBe("Validation failed");
		});

		it("returns 400 for non-JSON body", async () => {
			mockGetServerSession.mockResolvedValue(makeSession("user_1"));

			const handler = route({
				auth: "required",
				body: z.object({ name: z.string() }),
				handler: async () => ({ ok: true }),
			});

			const req = new Request("http://localhost/test", {
				method: "POST",
				body: "not json",
			});
			const res = await handler(req);
			expect(res.status).toBe(400);
			expect(await res.json()).toEqual({ error: "Invalid JSON" });
		});
	});

	describe("response handling", () => {
		it("auto-wraps plain objects as JSON", async () => {
			mockGetServerSession.mockResolvedValue(makeSession("user_1"));

			const handler = route({
				auth: "required",
				handler: async () => ({ data: [1, 2, 3] }),
			});

			const res = await handler(makeRequest());
			expect(res.status).toBe(200);
			expect(res.headers.get("content-type")).toContain("application/json");
			expect(await res.json()).toEqual({ data: [1, 2, 3] });
		});

		it("passes through Response objects unchanged", async () => {
			mockGetServerSession.mockResolvedValue(makeSession("user_1"));

			const handler = route({
				auth: "required",
				handler: async () =>
					new Response("plain text", {
						status: 202,
						headers: { "Content-Type": "text/plain" },
					}),
			});

			const res = await handler(makeRequest());
			expect(res.status).toBe(202);
			expect(await res.text()).toBe("plain text");
		});
	});

	describe("error boundary", () => {
		it("maps AppError to its status code", async () => {
			mockGetServerSession.mockResolvedValue(makeSession("user_1"));

			const handler = route({
				auth: "required",
				handler: async () => {
					throw new NotFoundError("Transcription not found");
				},
			});

			const res = await handler(makeRequest());
			expect(res.status).toBe(404);
			expect(await res.json()).toEqual({
				error: "Transcription not found",
			});
		});

		it("maps ForbiddenError to 403", async () => {
			mockGetServerSession.mockResolvedValue(makeSession("user_1"));

			const handler = route({
				auth: "required",
				handler: async () => {
					throw new ForbiddenError();
				},
			});

			const res = await handler(makeRequest());
			expect(res.status).toBe(403);
			expect(await res.json()).toEqual({ error: "Forbidden" });
		});

		it("maps ValidationError to 400", async () => {
			mockGetServerSession.mockResolvedValue(makeSession("user_1"));

			const handler = route({
				auth: "required",
				handler: async () => {
					throw new ValidationError("Invalid input");
				},
			});

			const res = await handler(makeRequest());
			expect(res.status).toBe(400);
			expect(await res.json()).toEqual({ error: "Invalid input" });
		});

		it("maps thrown ZodError to 400", async () => {
			mockGetServerSession.mockResolvedValue(makeSession("user_1"));

			const handler = route({
				auth: "required",
				handler: async () => {
					const schema = z.object({ x: z.number() });
					schema.parse({ x: "not-a-number" });
					return { ok: true };
				},
			});

			const res = await handler(makeRequest());
			expect(res.status).toBe(400);
			const body = await res.json();
			expect(body.error).toBe("Validation failed");
			expect(body.details).toBeDefined();
		});

		it("maps unknown errors to 500", async () => {
			mockGetServerSession.mockResolvedValue(makeSession("user_1"));

			const handler = route({
				auth: "required",
				handler: async () => {
					throw new Error("unexpected");
				},
			});

			const res = await handler(makeRequest());
			expect(res.status).toBe(500);
			expect(await res.json()).toEqual({
				error: "Internal server error",
			});
		});
	});
});
