import { NextRequest } from "next/server"
import { headers } from "next/headers"
import { getSession } from "@repo/auth"

/**
 * Extract the text of a document so the assistant can read it.
 *
 * ── What this deliberately does NOT do ──
 *
 * It does not store the file. gurukulhq's equivalent uploads to R2, writes a row, computes
 * embeddings and files the document into a library with folders and visibility rules - but
 * that app has a document library as a FEATURE, and the chat is one reader of it. Here the
 * requirement is "let me hand the assistant a job description", and for that the file is a
 * transport, not an asset: once the text is out, the bytes have no further use.
 *
 * So nothing is persisted server-side, there is no new table, and there is no object in a
 * bucket to leak or to garbage-collect later. The extracted text goes back to the browser and
 * travels with the next message like any other part of the prompt.
 *
 * If documents ever need to be re-read across sessions, or searched, that is the point to add
 * storage - and it should be a real library, not this route growing a table.
 *
 * ── Limits ──
 *
 * 10MB in, because that is the ceiling on what is worth reading in a request. The extracted
 * TEXT is capped separately and much lower: the chat store persists to localStorage, and a
 * 200-page PDF's text would sit in every future page load of this browser.
 */

export const dynamic = "force-dynamic"
export const maxDuration = 30

const MAX_BYTES = 10 * 1024 * 1024

/**
 * Cap on extracted text.
 *
 * ~20k characters is roughly 5k tokens - a long job description or a full resume, and far
 * more than either normally needs. Past this the marginal text is almost never what the
 * question is about, and every character is paid for twice: once in the prompt and once in
 * this browser's localStorage forever.
 */
const MAX_CHARS = 20_000

/** Allow-list, not a deny-list: an unknown type is refused rather than attempted. */
const ALLOWED = new Map<string, "pdf" | "docx" | "text">([
    ["application/pdf", "pdf"],
    ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
    ["text/plain", "text"],
    ["text/markdown", "text"],
    ["text/csv", "text"],
])

/** Extension fallback: some browsers send an empty or generic type for .md and .txt. */
function kindOf(file: File): "pdf" | "docx" | "text" | null {
    const byMime = ALLOWED.get(file.type)
    if (byMime) return byMime
    const name = file.name.toLowerCase()
    if (name.endsWith(".pdf")) return "pdf"
    if (name.endsWith(".docx")) return "docx"
    if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".csv")) return "text"
    return null
}

async function extractPdf(buffer: ArrayBuffer): Promise<string> {
    const { extractText } = await import("unpdf")
    // `.slice(0)` is a COPY, and it is load-bearing: unpdf transfers the buffer to a worker,
    // which detaches it. Anything holding the original then reads a zero-length array. This
    // is the same bug that broke every PDF resume upload after its text had been extracted -
    // see the note in actions/(main)/user/resume.action.ts.
    const uint8 = new Uint8Array(buffer.slice(0))
    const { text } = await extractText(uint8, { mergePages: true })
    return Array.isArray(text) ? text.join("\n") : String(text ?? "")
}

async function extractDocx(buffer: ArrayBuffer): Promise<string> {
    const mammoth = await import("mammoth")
    const result =
        typeof Buffer !== "undefined"
            ? await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
            : await mammoth.extractRawText({ arrayBuffer: buffer })
    return result.value ?? ""
}

export async function POST(req: NextRequest) {
    const session = await getSession(await headers())
    if (!session?.user?.id) {
        return Response.json({ error: "Sign in to attach a document." }, { status: 401 })
    }

    let file: File | null = null
    try {
        const form = await req.formData()
        const value = form.get("file")
        if (value instanceof File) file = value
    } catch {
        return Response.json({ error: "That upload was malformed." }, { status: 400 })
    }

    if (!file) return Response.json({ error: "No file was attached." }, { status: 400 })
    if (file.size === 0) return Response.json({ error: "That file is empty." }, { status: 400 })
    if (file.size > MAX_BYTES) {
        return Response.json({ error: "That file is over 10MB." }, { status: 400 })
    }

    const kind = kindOf(file)
    if (!kind) {
        return Response.json(
            { error: "Attach a PDF, Word document, or text file." },
            { status: 415 },
        )
    }

    let text = ""
    try {
        const buffer = await file.arrayBuffer()
        if (kind === "pdf") text = await extractPdf(buffer)
        else if (kind === "docx") text = await extractDocx(buffer)
        else text = new TextDecoder().decode(buffer)
    } catch (error: unknown) {
        console.error("[ai/upload-doc] extraction failed:", error)
        return Response.json(
            { error: "Could not read that file. If it is a scanned PDF, try a text-based export." },
            { status: 422 },
        )
    }

    // Collapse the run-on whitespace PDF extraction produces. Not cosmetic: it is a
    // meaningful share of the characters, and every one of them is a token.
    text = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim()

    if (!text) {
        // A scanned PDF extracts to nothing and looks identical to success otherwise, which
        // is how a user ends up asking why the assistant is ignoring their document.
        return Response.json(
            { error: "No text found in that file. If it is a scan, OCR it first or paste the text." },
            { status: 422 },
        )
    }

    const truncated = text.length > MAX_CHARS
    if (truncated) text = text.slice(0, MAX_CHARS)

    return Response.json({
        id: crypto.randomUUID(),
        name: file.name.slice(0, 200),
        chars: text.length,
        truncated,
        text,
    })
}
