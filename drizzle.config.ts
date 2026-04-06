import { defineConfig } from "drizzle-kit";
import { z } from "zod";

const drizzleEnv = z
	.object({
		TURSO_DATABASE_URL: z.string().min(1),
		TURSO_AUTH_TOKEN: z.string().min(1),
	})
	.parse(process.env);

export default defineConfig({
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dialect: "turso",
	dbCredentials: {
		url: drizzleEnv.TURSO_DATABASE_URL,
		authToken: drizzleEnv.TURSO_AUTH_TOKEN,
	},
});
