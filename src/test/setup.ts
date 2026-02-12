import { Logger } from "@/lib/logger";

export function createTestLogger(): Logger {
	return new Logger("ERROR");
}
