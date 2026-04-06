import type { db } from "@/db";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import type * as schema from "@/db/schema";

export type ProductionDatabase = typeof db;
export type TestDatabase = BaseSQLiteDatabase<"sync", unknown, typeof schema>;
export type AppDatabase = ProductionDatabase | TestDatabase;
