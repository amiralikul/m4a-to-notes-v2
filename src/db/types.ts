import type { db } from "@/db";
import type { createTestDb } from "@/test/db";

export type AppDatabase = typeof db | ReturnType<typeof createTestDb>;
