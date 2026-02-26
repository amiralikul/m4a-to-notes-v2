const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

interface ApiClient {
	get(path: string): Promise<Response>;
	post(path: string, body: unknown): Promise<Response>;
}

export function createApiClient(cookieHeader: string): ApiClient {
	const headers: Record<string, string> = {
		cookie: cookieHeader,
		"content-type": "application/json",
	};

	return {
		get(path: string) {
			return fetch(`${BASE_URL}${path}`, { headers });
		},
		post(path: string, body: unknown) {
			return fetch(`${BASE_URL}${path}`, {
				method: "POST",
				headers,
				body: JSON.stringify(body),
			});
		},
	};
}
