import type { db } from "@/db";
import type { createTestDb } from "@/test/db";

export type ProductionDatabase = typeof db;
export type TestDatabase = ReturnType<typeof createTestDb>;
export type AppDatabase = ProductionDatabase | TestDatabase;
