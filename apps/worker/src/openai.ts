// Minimal fetch-based OpenAI chat client (Workers-native - no Node SDK).
import { RetryableError } from "./jobs/base"

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
		// Rate limits and 5xx are transient: nothing was decided, so another alarm
		// can safely try again. A 400 will fail identically every time.
		if (res.status === 429 || res.status >= 500) {
			throw new RetryableError(`OpenAI is unavailable (${res.status})`)
		}
		throw new Error(`OpenAI API error ${res.status}: ${err}`)
	}
	const data = (await res.json()) as {
		choices?: Array<{ message?: { content?: string } }>
	}
	const content = data.choices?.[0]?.message?.content
	if (!content) throw new Error("OpenAI returned no content")
	return content
}

/**
 * A plain-text completion.
 *
 * Separate from `chatJSON` rather than a flag on it, because the two differ in
 * more than one place: this one must NOT send `response_format: json_object`, and
 * its callers want prose, not a parse. A cover letter asked for as a JSON object
 * comes back as a JSON object containing a string, which is a pointless round trip
 * and one more thing that can fail to parse.
 */
export async function chatText(opts: {
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
			max_tokens: opts.maxTokens ?? 4000,
		}),
	})
	if (!res.ok) {
		const err = await res.text()
		// 429 and 5xx are worth another alarm; a 400 is a bad request that will fail
		// identically on every retry.
		if (res.status === 429 || res.status >= 500) {
			throw new RetryableError(`OpenAI is unavailable (${res.status})`)
		}
		throw new Error(`OpenAI API error ${res.status}: ${err}`)
	}
	const data = (await res.json()) as {
		choices?: Array<{ message?: { content?: string } }>
	}
	return data.choices?.[0]?.message?.content ?? ""
}
