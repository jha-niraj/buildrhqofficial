"use server"

import { getSession } from "@repo/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { db, users } from "@repo/db"
import { eq } from "drizzle-orm"
import { uploadToR2, deleteFromR2, getR2SignedUrl, isR2Configured, warnIfR2Misconfigured } from "@/lib/r2-client"
import { startBackgroundJob } from "@/actions/(main)/workers/jobs.action"

async function extractTextFromPDFBuffer(buffer: ArrayBuffer): Promise<string> {
    try {
        const { extractText } = await import("unpdf")
        // `.slice(0)` is a COPY, and it is load-bearing. unpdf hands the array to
        // pdf.js, which takes ownership of it and DETACHES the underlying
        // ArrayBuffer. The caller still needs those bytes to upload the file to
        // R2 afterwards, and on a detached buffer `new Uint8Array(buffer)` throws
        // "Cannot perform Construct on a detached ArrayBuffer" - which is exactly
        // how every PDF resume upload failed after its text had been extracted.
        const uint8 = new Uint8Array(buffer.slice(0))
        const { text } = await extractText(uint8, { mergePages: true })
        return text?.trim() ?? ""
    } catch (error) {
        console.error("unpdf extraction error:", error)
        return ""
    }
}

async function extractTextFromDOCXBuffer(buffer: ArrayBuffer): Promise<string> {
    try {
        const mammoth = await import("mammoth")

        // `{ arrayBuffer }` is the BROWSER build's input. The server build wants
        // `{ buffer: Buffer }` and rejects an ArrayBuffer with "Could not find
        // file in options" - which the catch below then swallowed, so every DOCX
        // upload extracted nothing, dispatched no structuring job, and told the
        // user we could not read their file.
        //
        // Buffer exists here (the Worker runs with nodejs_compat), so prefer it
        // and keep the arrayBuffer form as the fallback for a browser bundle.
        const result = typeof Buffer !== "undefined"
            ? await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
            : await mammoth.extractRawText({ arrayBuffer: buffer })

        return result.value?.trim() ?? ""
    } catch (error: unknown) {
        // Logged rather than silent: an extractor that returns "" is
        // indistinguishable from a scanned PDF, and that ambiguity is exactly
        // what hid the bug above.
        console.error("mammoth extraction error:", error)
        return ""
    }
}

export async function extractResumeText(file: File): Promise<string> {
    const buffer = await file.arrayBuffer()
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
    const isDocx =
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.toLowerCase().endsWith(".docx")

    if (isPdf) return extractTextFromPDFBuffer(buffer)
    if (isDocx) return extractTextFromDOCXBuffer(buffer)
    return ""
}

/**
 * Hand the freshly extracted text to the worker to be turned into a structured
 * resume draft.
 *
 * Best-effort and never awaited for its result: the upload has already
 * succeeded by this point, and a parser that is down must not turn a stored
 * resume into an error the user sees. If it fails they still have their file,
 * their text, and every non-AI feature that reads it.
 *
 * Free (no `cost`): the user did not ask for a generation, we are doing this
 * because the rest of the product needs it.
 */
async function dispatchResumeStructuring(draftName: string): Promise<string | undefined> {
    try {
        const res = await startBackgroundJob(
            "resume_structure",
            { draftName },
            {
                // One structuring run at a time. Re-uploading twice in a minute is
                // a correction, not a request for two resumes.
                singleFlight: true,
            },
        )
        return res.success ? res.jobId : undefined
    } catch (error: unknown) {
        console.error("Resume structuring dispatch failed:", error)
        return undefined
    }
}

export async function uploadResume(file: File, _resumeText?: string, options?: { draftName?: string }) {
    const session = await getSession(headers())
    if (!session?.user?.id) {
        throw new Error("You must be logged in to upload a resume")
    }
    const userId = session.user.id

    // Server-side text extraction: unpdf for PDF, mammoth for DOCX. Dispatched on
    // the file's own type rather than trying the PDF reader on everything - a
    // DOCX put through unpdf costs a parse and returns nothing useful.
    const buffer = await file.arrayBuffer()
    const name = file.name.toLowerCase()
    const isPdf = file.type === "application/pdf" || name.endsWith(".pdf")
    const isDocx =
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        name.endsWith(".docx")

    const draftName = options?.draftName?.trim() || "Imported resume"

    let resumeText = _resumeText ?? ""
    if (!resumeText) {
        if (isPdf) resumeText = await extractTextFromPDFBuffer(buffer).catch(() => "")
        else if (isDocx) resumeText = await extractTextFromDOCXBuffer(buffer).catch(() => "")
    }
    if (resumeText.length > 50000) resumeText = resumeText.substring(0, 50000)

    if (!isR2Configured()) {
        warnIfR2Misconfigured()
        if (resumeText) {
            await db.update(users).set({ hasResume: true, resumeText }).where(eq(users.id, userId))
            const structureJobId = await dispatchResumeStructuring(draftName)
            revalidatePath("/profile")
            return { success: true, url: undefined, structureJobId, message: "Resume text saved (file upload disabled)" }
        }
        return { success: false, url: undefined, message: "Storage not configured and no resume text provided" }
    }

    try {
        const timestamp = Date.now()
        const fileName = `resumes/${userId}-${timestamp}-${file.name}`

        await uploadToR2({
            key: fileName,
            body: new Uint8Array(buffer),
            contentType: file.type,
            metadata: { userId, originalName: file.name, uploadDate: new Date().toISOString() },
        })

        await db.update(users).set({
            hasResume: true,
            resume: fileName,
            ...(resumeText && { resumeText }),
        }).where(eq(users.id, userId))

        const signedUrl = await getR2SignedUrl(fileName)
        // Only worth structuring if there is text to structure. A scanned PDF
        // with no text layer gets stored and shown, but never parsed.
        const structureJobId = resumeText ? await dispatchResumeStructuring(draftName) : undefined
        revalidatePath("/profile")
        return { success: true, url: signedUrl, structureJobId }
    } catch (error) {
        console.error("Resume upload failed:", error)
        if (resumeText) {
            await db.update(users).set({ hasResume: true, resumeText }).where(eq(users.id, userId))
            const structureJobId = await dispatchResumeStructuring(draftName)
            revalidatePath("/profile")
            return { success: true, url: undefined, structureJobId, message: "Resume text saved but file upload failed." }
        }
        throw new Error("Failed to upload resume. Please try again.")
    }
}

export async function deleteResume() {
    const session = await getSession(headers())
    if (!session?.user?.id) {
        throw new Error("You must be logged in to delete your resume")
    }
    const userId = session.user.id

    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { hasResume: true, resume: true },
        })

        if (user?.hasResume && user?.resume) {
            try {
                await deleteFromR2(user.resume)
            } catch (error) {
                console.error("Failed to delete resume from R2:", error)
            }
        }

        await db.update(users).set({ hasResume: false, resume: null, resumeText: null }).where(eq(users.id, userId))
        revalidatePath("/profile")
        return { success: true }
    } catch (error) {
        console.error("Resume deletion failed:", error)
        throw new Error("Failed to delete resume. Please try again.")
    }
}

export async function getResume() {
    const session = await getSession(headers())
    if (!session?.user?.id) return null
    const userId = session.user.id

    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { hasResume: true, resume: true },
        })

        if (!user?.hasResume || !user?.resume) return null

        const signedUrl = await getR2SignedUrl(user.resume)
        const originalName = user.resume.split("-").slice(2).join("-") || "resume.pdf"
        return { url: signedUrl, name: originalName }
    } catch (error) {
        console.error("Failed to fetch resume:", error)
        return null
    }
}

export async function getResumeSignedUrl(expiresIn = 7 * 24 * 60 * 60) {
    const session = await getSession(headers())
    if (!session?.user?.id) return null
    const userId = session.user.id

    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { hasResume: true, resume: true },
        })

        if (!user?.hasResume || !user?.resume) return null

        const signedUrl = await getR2SignedUrl(user.resume, expiresIn)
        const originalName = user.resume.split("-").slice(2).join("-") || "resume.pdf"
        return { url: signedUrl, name: originalName }
    } catch (error) {
        console.error("Failed to generate signed URL:", error)
        return null
    }
}
