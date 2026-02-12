export async function sendTelegramMessage(
	chatId: string | number,
	text: string,
	botToken: string,
): Promise<unknown> {
	const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			chat_id: chatId,
			text,
			parse_mode: "Markdown",
			disable_web_page_preview: true,
		}),
	});

	if (!response.ok) {
		const errorData = await response.text();
		throw new Error(
			`Telegram API error: ${response.status} - ${errorData}`,
		);
	}

	return response.json();
}

export async function sendTelegramDocument(
	chatId: string | number,
	document: string | ArrayBuffer,
	fileName: string,
	caption: string,
	botToken: string,
): Promise<unknown> {
	const url = `https://api.telegram.org/bot${botToken}/sendDocument`;

	const formData = new FormData();
	formData.append("chat_id", String(chatId));
	formData.append("caption", caption);

	const blob = new Blob([document], { type: "text/plain" });
	formData.append("document", blob, fileName);

	const response = await fetch(url, {
		method: "POST",
		body: formData,
	});

	if (!response.ok) {
		const errorData = await response.text();
		throw new Error(
			`Telegram API error: ${response.status} - ${errorData}`,
		);
	}

	return response.json();
}
