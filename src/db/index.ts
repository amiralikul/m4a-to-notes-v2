import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { env } from "@/env";

const globalForDb = globalThis as unknown as {
	db: ReturnType<typeof drizzle> | undefined;
};

function createDb() {
	if (!env.TURSO_DATABASE_URL) {
		throw new Error("TURSO_DATABASE_URL is not set");
	}

	const client = createClient({
		url: env.TURSO_DATABASE_URL,
		authToken: env.TURSO_AUTH_TOKEN,
	});
	return drizzle({ client, schema });
}

export const db = globalForDb.db ?? createDb();

if (env.NODE_ENV !== "production") globalForDb.db = db;
