// ─────────────────────────────────────────────────────────────────────────────
// The wire format between the chat route and the panel.
//
// NDJSON: one JSON object per line. Ported from the Orbital chat in synchq, which
// has been running this shape in production - the alternative (SSE) buys nothing
// here and costs a parser on both ends.
//
// The route used to answer in PLAIN TEXT, and its comment said so proudly: "the
// client stays a plain text reader and never has to understand tool framing".
// That is exactly why the agent looked like it was doing nothing. Tool rounds ran
// to completion BEFORE the first byte was sent, so the user watched a still
// spinner for however long the database work took, then prose appeared with no
// indication that anything had been looked up. Framing is the whole point: it is
// what lets the panel show "Reading your projects…" while it happens.
//
// Frames are additive. A client that does not recognise a `t` must ignore it
// rather than fail, so a newer server can stream to an older tab.
// ─────────────────────────────────────────────────────────────────────────────

/** A token of the assistant's prose. */
export interface TextFrame {
    t: "text";
    v: string;
}

/**
 * A step in the agent's work.
 *
 * `call` opens a step, `result` closes it, `error` marks it failed. They are
 * matched by `id`, because tool calls in one round run concurrently and finish
 * out of order.
 */
export interface ToolFrame {
    t: "tool";
    phase: "call" | "result" | "error";
    id: string;
    name: string;
    /** A human sentence from the tool itself, preferred over the generic label. */
    summary?: string;
}

/** The turn ended cleanly. Carries nothing; its arrival is the signal. */
export interface DoneFrame {
    t: "done";
}

/**
 * Something failed after the response had already started.
 *
 * A mid-stream failure cannot change the status code, so it has to travel in
 * band or the user gets a silently truncated answer.
 */
export interface ErrorFrame {
    t: "error";
    message: string;
}

export type ChatFrame = TextFrame | ToolFrame | DoneFrame | ErrorFrame;

/** Serialise one frame for the wire. The trailing newline is the delimiter. */
export function encodeFrame(frame: ChatFrame): string {
    return JSON.stringify(frame) + "\n";
}

/**
 * Incremental NDJSON parser.
 *
 * A chunk boundary lands anywhere, including the middle of a frame, so the
 * partial tail has to be carried into the next read. Reading a stream by
 * `JSON.parse`-ing each chunk works right up until a message is long enough to
 * split, which is exactly when it matters.
 */
export function createFrameParser(): (chunk: string) => ChatFrame[] {
    let buffer = "";
    return (chunk: string): ChatFrame[] => {
        buffer += chunk;
        const lines = buffer.split("\n");
        // The last element is either "" (chunk ended on a delimiter) or a partial
        // frame. Either way it is not ready to parse.
        buffer = lines.pop() ?? "";
        const frames: ChatFrame[] = [];
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
                frames.push(JSON.parse(trimmed) as ChatFrame);
            } catch {
                // A malformed line is not worth killing the stream over - the rest
                // of the reply is still useful.
            }
        }
        return frames;
    };
}
