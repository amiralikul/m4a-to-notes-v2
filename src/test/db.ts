import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { migrate } from "drizzle-orm/libsql/migrator";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@/db/schema";

const TEST_DB_DIRS = new WeakMap<object, string>();

export async function createTestDb() {
	const testDir = await mkdtemp(join(tmpdir(), "m4a-to-notes-test-db-"));
	const client = createClient({
		url: `file:${join(testDir, "test.db")}`,
	});
	const db = drizzle({ client, schema });

	await db.$client.execute("PRAGMA foreign_keys = ON");
	await migrate(db, { migrationsFolder: join(process.cwd(), "drizzle") });

	TEST_DB_DIRS.set(db, testDir);

	return db;
}

export async function cleanupTestDb(db: Awaited<ReturnType<typeof createTestDb>>) {
	const testDir = TEST_DB_DIRS.get(db);

	db.$client.close();

	if (testDir) {
		await rm(testDir, { recursive: true, force: true });
		TEST_DB_DIRS.delete(db);
	}
}
