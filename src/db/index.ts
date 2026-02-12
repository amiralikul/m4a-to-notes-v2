import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
	db: ReturnType<typeof drizzle> | undefined;
};

function createDb() {
	const url = process.env.TURSO_DATABASE_URL;
	if (!url) {
		throw new Error("TURSO_DATABASE_URL is not set");
	}
	const client = createClient({
		url,
		authToken: process.env.TURSO_AUTH_TOKEN,
	});
	return drizzle({ client, schema });
}

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
