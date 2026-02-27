import { auth } from "@clerk/nextjs/server";
import { resolveActorIdentity } from "@/lib/trial-identity";
import { actorsService } from "@/services";
import { isAppError, getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { type z, ZodError } from "zod";

// --- Auth context types ---

export type OwnerIdentity =
	| { userId: string; actorId: string | null }
	| { userId: null; actorId: string };

type RequiredAuthContext = { userId: string };
type OptionalAuthContext = { userId: string | null; actorId: string | null };
type NoneAuthContext = Record<string, never>;

type AuthContext<TAuth extends AuthMode> = TAuth extends "required"
	? RequiredAuthContext
	: TAuth extends "optional"
		? OptionalAuthContext
		: NoneAuthContext;

// --- Route config types ---

type AuthMode = "required" | "optional" | "none";

type HandlerContext<
	TAuth extends AuthMode,
	TParams,
	TBody,
> = AuthContext<TAuth> & {
	request: Request;
	params: TParams;
	body: TBody;
};

interface RouteConfig<
	TAuth extends AuthMode,
	TParams = undefined,
	TBody = undefined,
> {
	auth: TAuth;
	params?: z.ZodType<TParams>;
	body?: z.ZodType<TBody>;
	handler: (
		ctx: HandlerContext<TAuth, TParams, TBody>,
	) => Promise<Response | object>;
}

type NextRouteHandler = (
	request: Request,
	context?: { params: Promise<Record<string, string>> },
) => Promise<Response>;

// --- Builder ---

export function route<
	TAuth extends AuthMode,
	TParams = undefined,
	TBody = undefined,
>(config: RouteConfig<TAuth, TParams, TBody>): NextRouteHandler {
	return async (request, nextContext) => {
		try {
			// 1. Resolve auth
			let authContext: AuthContext<TAuth>;

			if (config.auth === "required") {
				const { userId } = await auth();
				if (!userId) {
					return Response.json(
						{ error: "Unauthorized" },
						{ status: 401 },
					);
				}
				authContext = { userId } as AuthContext<TAuth>;
			} else if (config.auth === "optional") {
				const { userId } = await auth();
				let actorId: string | null = null;
				if (!userId) {
					const identity = await resolveActorIdentity();
					actorId = identity.actorId;
					await actorsService.ensureActor(actorId);
				}
				authContext = { userId, actorId } as AuthContext<TAuth>;
			} else {
				authContext = {} as AuthContext<TAuth>;
			}

			// 2. Validate params
			let params: TParams = undefined as TParams;
			if (config.params) {
				const rawParams = nextContext?.params
					? await nextContext.params
					: {};
				const result = config.params.safeParse(rawParams);
				if (!result.success) {
					return Response.json(
						{
							error: "Invalid parameters",
							details: result.error.issues,
						},
						{ status: 400 },
					);
				}
				params = result.data;
			}

			// 3. Validate body
			let body: TBody = undefined as TBody;
			if (config.body) {
				let rawBody: unknown;
				try {
					rawBody = await request.json();
				} catch {
					return Response.json(
						{ error: "Invalid JSON" },
						{ status: 400 },
					);
				}
				const result = config.body.safeParse(rawBody);
				if (!result.success) {
					return Response.json(
						{
							error: "Validation failed",
							details: result.error.issues,
						},
						{ status: 400 },
					);
				}
				body = result.data;
			}

			// 4. Call handler
			const handlerResult = await config.handler({
				...authContext,
				request,
				params,
				body,
			});

			// 5. Return response
			if (handlerResult instanceof Response) {
				return handlerResult;
			}
			return Response.json(handlerResult);
		} catch (error) {
			// 6. Error boundary
			if (isAppError(error)) {
				if (error.statusCode >= 500) {
					logger.error(error.message, {
						error: getErrorMessage(error),
						stack: error.stack,
						url: request.url,
						method: request.method,
					});
				}
				return Response.json(
					{ error: error.message },
					{ status: error.statusCode },
				);
			}

			if (error instanceof ZodError) {
				return Response.json(
					{ error: "Validation failed", details: error.issues },
					{ status: 400 },
				);
			}

			logger.error("Unhandled route error", {
				error: getErrorMessage(error),
				stack: error instanceof Error ? error.stack : undefined,
				errorType: error instanceof Error ? error.constructor.name : typeof error,
				url: request.url,
				method: request.method,
			});
			return Response.json(
				{ error: "Internal server error" },
				{ status: 500 },
			);
		}
	};
}
