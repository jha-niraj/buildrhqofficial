// Minimal fetch-based OpenAI chat client (Workers-native - no Node SDK).
const OPENAI_API = "https://api.openai.com/v1"

export async function chatJSON(opts: {
	apiKey: string
	model?: string
	system: string
	user: string
	maxTokens?: number
	temperature?: number
}): Promise<string> {
	const res = await fetch(`${OPENAI_API}/chat/completions`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${opts.apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: opts.model ?? "gpt-4o-mini",
			messages: [
				{ role: "system", content: opts.system },
				{ role: "user", content: opts.user },
			],
			temperature: opts.temperature ?? 0.7,
			max_tokens: opts.maxTokens ?? 8000,
			response_format: { type: "json_object" },
		}),
	})
	if (!res.ok) {
		const err = await res.text()
		throw new Error(`OpenAI API error ${res.status}: ${err}`)
	}
	const data = (await res.json()) as {
		choices?: Array<{ message?: { content?: string } }>
	}
	const content = data.choices?.[0]?.message?.content
	if (!content) throw new Error("OpenAI returned no content")
	return content
}
