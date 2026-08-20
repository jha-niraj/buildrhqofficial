import { NextRequest } from "next/server";
import { getSession } from "@repo/auth";
import { db, users } from "@repo/db";
import { eq } from "drizzle-orm";
import { openai } from "@/lib/openai-client";
import { TOOL_SPECS, runTool } from "@/lib/ai/tools";
import { encodeFrame, type ChatFrame } from "@/lib/ai/protocol";

export const runtime = "nodejs";
// The response is a token stream, so it can never be cached or prerendered.
export const dynamic = "force-dynamic";

const MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";

/** Newest-last, and capped: the panel keeps unlimited local history, but only the
 *  tail is worth the tokens - and an unbounded client array is untrusted input. */
const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 8000;

/** How many times the model may call tools before it must answer in prose.
 *  Two rounds covers "look me up, then search on what you found"; anything
 *  beyond that is a loop, not a plan, and burns the user's tokens. */
const MAX_TOOL_ROUNDS = 2;

interface IncomingMessage {
    role: "user" | "assistant";
    content: string;
}

/** One entry in the message array we hand to the model. Wider than
 *  IncomingMessage because tool rounds add assistant-with-tool_calls and tool
 *  result messages, neither of which the client is allowed to send. */
interface ChatParam {
    role: "system" | "user" | "assistant" | "tool";
    content?: string | null;
    tool_call_id?: string;
    tool_calls?: ToolCall[];
}

interface ToolCall {
    id: string;
    type?: string;
    function?: { name?: string; arguments?: string };
}

interface CompletionResponse {
    choices?: Array<{ message?: { content?: string | null; tool_calls?: ToolCall[] } }>;
}

function systemPrompt(ctx: {
    name: string | null;
    username: string | null;
    university: string | null;
    semester: string | null;
    interests: string[];
    page?: { route: string; title: string } | null;
    tags?: Array<{ id: string; kind: string; title: string }>;
}): string {
    const lines = [
        "You are the ShipItHQ assistant - an engineering-career copilot for CS students and software engineers.",
        "You help with: building portfolio projects, DSA and system-design practice, resumes and cover letters, technical interview prep, and open-source contribution.",
        "",
        "How to answer:",
        "- Be direct and concrete. Lead with the answer, then the reasoning.",
        "- Prefer short paragraphs and tight bullet lists over walls of text.",
        "- Use fenced code blocks with a language tag for any code.",
        "- If a question is outside engineering/career help, answer briefly and steer back.",
        "- Never invent ShipItHQ features, prices, or user data you weren't given.",
        "",
        "Tools:",
        "- You can read this user's own ShipItHQ data and search the platform's project ideas and job posts.",
        "- Call a tool when the answer depends on their actual state (progress, goals, practice, profile) or on what the platform actually offers. Don't ask them to repeat something a tool can tell you.",
        "- Don't call a tool for general knowledge, code review, or explanations - just answer.",
        "- If a tool returns nothing or errors, say so plainly and answer with what you have. Never fabricate rows.",
        "",
        "About the person you're talking to:",
        `- Name: ${ctx.name ?? "unknown"}`,
    ];
    if (ctx.username) lines.push(`- Handle: @${ctx.username}`);
    if (ctx.university) lines.push(`- Studies at: ${ctx.university}${ctx.semester ? ` (${ctx.semester})` : ""}`);
    if (ctx.interests.length) lines.push(`- Wants to get better at: ${ctx.interests.join(", ")}`);
    if (ctx.page) {
        lines.push(
            "",
            // A pointer, not a payload: the model gets to know WHERE the user is so it
            // can be page-aware, without us shipping the page's contents into the prompt.
            `The user is currently on the "${ctx.page.title}" page (${ctx.page.route}). Take that into account when it's relevant; don't mention it otherwise.`,
        );
    }

    // Tagged context. Named as things to look at rather than pasted content: the
    // agent has tools for every one of these and they enforce ownership, whereas
    // inlining a resume here would put it in the prompt whether or not the answer
    // needed it.
    if (ctx.tags?.length) {
        lines.push(
            "",
            "The user has attached these to the conversation - treat them as what the question is about, and use your tools to look them up:",
            ...ctx.tags.map((t) => `- ${t.kind}: "${t.title}"`),
        );
    }
    return lines.join("\n");
}

export async function POST(request: NextRequest) {
    const session = await getSession(request.headers);
    if (!session?.user?.id) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    let body: { messages?: unknown; page?: unknown; tags?: unknown };
    try {
        body = (await request.json()) as typeof body;
    } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    // Shape-check rather than cast: this array comes straight off the client.
    const rawMessages = Array.isArray(body.messages) ? body.messages : [];
    const history: IncomingMessage[] = rawMessages
        .filter((m): m is IncomingMessage =>
            !!m &&
            typeof m === "object" &&
            typeof (m as IncomingMessage).content === "string" &&
            ((m as IncomingMessage).role === "user" || (m as IncomingMessage).role === "assistant"))
        .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }))
        .filter((m) => m.content.trim().length > 0)
        .slice(-MAX_HISTORY_MESSAGES);

    if (history.length === 0) {
        return new Response(JSON.stringify({ error: "No messages provided" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    // Context tags the user pinned, plus whatever page they are on. Shape-checked
    // like everything else off the client, and capped: this goes into the system
    // prompt, so an unbounded list is an unbounded prompt.
    //
    // The tags are HINTS about what to look at, never data in themselves. The
    // agent still fetches through its own tools, which are all scoped to the
    // signed-in user - so a forged tag can only ask for something the caller is
    // already allowed to read.
    const rawTags = Array.isArray(body.tags) ? body.tags : [];
    const tags = rawTags
        .filter((t): t is { id: string; kind: string; title: string } =>
            !!t && typeof t === "object" &&
            typeof (t as { id?: unknown }).id === "string" &&
            typeof (t as { kind?: unknown }).kind === "string" &&
            typeof (t as { title?: unknown }).title === "string")
        .map((t) => ({ id: t.id.slice(0, 64), kind: t.kind.slice(0, 24), title: t.title.slice(0, 120) }))
        .slice(0, 8);

    const page =
        body.page && typeof body.page === "object"
            ? {
                route: String((body.page as { route?: unknown }).route ?? "").slice(0, 200),
                title: String((body.page as { title?: unknown }).title ?? "").slice(0, 120),
            }
            : null;

    const [user] = await db
        .select({
            name: users.name,
            username: users.username,
            university: users.university,
            semester: users.semester,
            learningPreferences: users.learningPreferences,
        })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);

    const system = systemPrompt({
        name: user?.name ?? session.user.name ?? null,
        username: user?.username ?? null,
        university: user?.university ?? null,
        semester: user?.semester ?? null,
        interests: user?.learningPreferences ?? [],
        page,
        tags,
    });

    const conversation: ChatParam[] = [
        { role: "system", content: system },
        ...history,
    ];

    // ── One stream, tool rounds included ──────────────────────────────────────
    // Tool rounds used to run to completion BEFORE the response opened, and the
    // body was plain prose. That is why the agent looked idle: the user watched a
    // motionless spinner for the whole database round trip, then text appeared
    // with no sign that anything had been read. Now the response opens first and
    // every tool call is announced as it happens - see `lib/ai/protocol.ts`.
    const encoder = new TextEncoder();
    const body$ = new ReadableStream<Uint8Array>({
        async start(controller) {
            const send = (frame: ChatFrame) => controller.enqueue(encoder.encode(encodeFrame(frame)));

            try {
                for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
                    const decision = (await openai.chat.completions.create({
                        model: MODEL,
                        messages: conversation,
                        temperature: 0.6,
                        max_tokens: 1600,
                        tools: TOOL_SPECS,
                        tool_choice: "auto",
                    })) as CompletionResponse;

                    const choice = decision?.choices?.[0]?.message;
                    const calls = choice?.tool_calls ?? [];
                    if (calls.length === 0) break;

                    conversation.push({
                        role: "assistant",
                        content: choice?.content ?? null,
                        tool_calls: calls,
                    });

                    // Announce every call before running any of them, so the panel
                    // shows the whole round at once rather than one line appearing
                    // per completed database read.
                    for (const call of calls) {
                        send({
                            t: "tool",
                            phase: "call",
                            id: call.id ?? `${round}-${call.function?.name ?? "tool"}`,
                            name: call.function?.name ?? "tool",
                        });
                    }

                    // Independent reads - run them together rather than serialising
                    // a round trip to the database per call.
                    const results = await Promise.all(
                        calls.map(async (call) => {
                            try {
                                return await runTool(
                                    call.function?.name ?? "",
                                    call.function?.arguments ?? "",
                                    session.user.id,
                                );
                            } catch (error: unknown) {
                                console.error(`[ai/chat] tool ${call.function?.name} failed:`, error);
                                return null;
                            }
                        }),
                    );

                    calls.forEach((call, i) => {
                        const id = call.id ?? `${round}-${call.function?.name ?? "tool"}`;
                        const name = call.function?.name ?? "tool";
                        const result = results[i] ?? null;

                        if (result === null) {
                            send({ t: "tool", phase: "error", id, name });
                        } else {
                            // A tool may return `_summary` to describe what it found
                            // in its own words ("Found 3 projects"). Better than the
                            // generic label, and it is the tool that knows.
                            let summary: string | undefined;
                            try {
                                const parsed = JSON.parse(result) as { _summary?: unknown };
                                if (typeof parsed._summary === "string") summary = parsed._summary;
                            } catch {
                                // Not JSON, or no summary. The client falls back to
                                // its own label for the tool name.
                            }
                            send({ t: "tool", phase: "result", id, name, ...(summary ? { summary } : {}) });
                        }

                        conversation.push({
                            role: "tool",
                            tool_call_id: call.id,
                            content: result ?? JSON.stringify({ error: "No result." }),
                        });
                    });
                }
            } catch (error) {
                // A failed tool round is recoverable: drop back to the plain history
                // and let the model answer from what it already knows.
                console.error("[ai/chat] tool round failed:", error);
                conversation.length = 0;
                conversation.push({ role: "system", content: system }, ...history);
            }

            try {
                const stream = (await openai.chat.completions.create({
                    model: MODEL,
                    messages: conversation,
                    temperature: 0.6,
                    max_tokens: 1600,
                    stream: true,
                })) as AsyncGenerator<unknown>;

                for await (const chunk of stream) {
                    const delta = (chunk as {
                        choices?: Array<{ delta?: { content?: string } }>;
                    })?.choices?.[0]?.delta?.content;
                    if (delta) send({ t: "text", v: delta });
                }
                send({ t: "done" });
            } catch (error) {
                console.error("[ai/chat] stream error:", error);
                // The status code is long gone by here, so the failure has to travel
                // in band or the user just gets a truncated answer with no reason.
                send({ t: "error", message: "The response was cut short. Please try again." });
            } finally {
                controller.close();
            }
        },
    });

    return new Response(body$, {
        headers: {
            // NDJSON, not text/plain: the body is now framed. See lib/ai/protocol.ts.
            "Content-Type": "application/x-ndjson; charset=utf-8",
            "Cache-Control": "no-store, no-transform",
            "X-Accel-Buffering": "no",
        },
    });
}
