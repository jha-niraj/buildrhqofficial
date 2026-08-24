const OPENAI_API = "https://api.openai.com/v1"

function getHeaders() {
    return {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
    }
}

async function* streamChatCompletion(body: unknown) {
    const res = await fetch(`${OPENAI_API}/chat/completions`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(body),
    })
    if (!res.ok || !res.body) {
        const err = await res.text()
        throw new Error(`OpenAI API error ${res.status}: ${err}`)
    }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""
        for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            const data = line.slice(6).trim()
            if (data === "[DONE]") return
            try { yield JSON.parse(data) } catch { /* skip malformed chunks */ }
        }
    }
}

export const openai = {
    chat: {
        completions: {
            async create(params: {
                model: string
                // `tool` messages carry a tool_call_id; assistant messages that
                // requested a call carry tool_calls and a null content. Both are
                // required for a multi-turn tool loop, so the shape is widened
                // rather than kept to the plain {role, content} pair.
                messages: Array<{
                    role: string
                    content?: string | unknown[] | null
                    name?: string
                    tool_call_id?: string
                    tool_calls?: unknown[]
                }>
                temperature?: number
                max_tokens?: number
                response_format?: unknown
                tools?: unknown[]
                tool_choice?: unknown
                parallel_tool_calls?: boolean
                stream?: boolean
            }) {
                if (params.stream) {
                    return streamChatCompletion(params)
                }
                const res = await fetch(`${OPENAI_API}/chat/completions`, {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify(params),
                })
                if (!res.ok) {
                    const err = await res.text()
                    throw new Error(`OpenAI API error ${res.status}: ${err}`)
                }
                return res.json()
            },
        },
    },
    embeddings: {
        async create(params: { model: string; input: string | string[]; dimensions?: number }) {
            const res = await fetch(`${OPENAI_API}/embeddings`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(params),
            })
            if (!res.ok) {
                const err = await res.text()
                throw new Error(`OpenAI API error ${res.status}: ${err}`)
            }
            return res.json()
        },
    },
}

// Local zodResponseFormat - replaces import from "openai/helpers/zod"
// Uses json_object mode; caller parses response.choices[0].message.content with JSON.parse + Zod
export function zodResponseFormat(_schema: unknown, _name: string) {
    return { type: "json_object" as const }
}
