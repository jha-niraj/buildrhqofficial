import {
    S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "user-documents"

function createR2Client() {
    return new S3Client({
        region: "auto",
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
    })
}

export async function uploadToR2(params: {
    key: string
    body: Buffer | Uint8Array
    contentType: string
    metadata?: Record<string, string>
}): Promise<void> {
    const client = createR2Client()
    await client.send(new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType,
        Metadata: params.metadata,
    }))
}

export async function deleteFromR2(key: string): Promise<void> {
    const client = createR2Client()
    await client.send(new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
    }))
}

export async function getR2SignedUrl(key: string, expiresIn = 7 * 24 * 60 * 60): Promise<string> {
    const client = createR2Client()
    const command = new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key })
    return getSignedUrl(client, command, { expiresIn })
}

/**
 * Placeholder markers that appear in `.env.example`. A value containing one of these was
 * copied from the template and never filled in.
 */
const PLACEHOLDER = /your|here|xxx|placeholder|change[_-]?me|todo|example|<|>/i

/**
 * The account id becomes a DNS label: `https://<id>.r2.cloudflarestorage.com`.
 *
 * So it must be a legal hostname label - letters, digits and hyphens only. Checking that
 * rather than guessing Cloudflare's id format means this stays correct if they ever change
 * the format, while still catching the thing that actually happens.
 */
const DNS_LABEL = /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i

function usable(value: string | undefined, { asHostLabel = false } = {}): boolean {
    const v = value?.trim()
    if (!v) return false
    if (PLACEHOLDER.test(v)) return false
    if (asHostLabel && !DNS_LABEL.test(v)) return false
    return true
}

/**
 * Whether R2 can actually be reached - not merely whether the variables are present.
 *
 * ── Why this is stricter than a truthiness check ──
 *
 * It used to be `!!(A && B && C)`, which is true for a `.env` copied from `.env.example`
 * and never edited, because `R2_ACCOUNT_ID=your_r2_account_id` is a non-empty string.
 *
 * Every caller then took the "configured" branch and issued a real upload against
 * `https://your_r2_account_id.r2.cloudflarestorage.com`. That host sits under Cloudflare's
 * wildcard, so TCP connects and then the edge REFUSES THE TLS HANDSHAKE for an SNI it does
 * not recognise. Node surfaces that as:
 *
 *     Error: write EPROTO ... ssl3_read_bytes:ssl/tls alert handshake failure ... alert number 40
 *
 * Which reads like a network or certificate problem and is really "you did not fill in the
 * env file". It cost a debugging session, and the graceful "storage not configured" path
 * that every caller already has was sitting right there unused.
 *
 * ── Wrong credentials look completely different ──
 *
 * Worth knowing, because it is how you tell these apart. Bad keys with a VALID account id
 * complete the TLS handshake and come back as an HTTP 403 `InvalidAccessKeyId` or
 * `SignatureDoesNotMatch`. A TLS-level failure can only be the endpoint, and the only part
 * of the endpoint we control is the account id.
 */
export function isR2Configured(): boolean {
    return (
        usable(process.env.R2_ACCOUNT_ID, { asHostLabel: true }) &&
        usable(process.env.R2_ACCESS_KEY_ID) &&
        usable(process.env.R2_SECRET_ACCESS_KEY)
    )
}

/**
 * Explain, once per process, why storage is off. Without this the only symptom is uploads
 * quietly not persisting, which is worse than the TLS error it replaced.
 */
let warned = false
export function warnIfR2Misconfigured(): void {
    if (warned || isR2Configured()) return
    warned = true
    const id = process.env.R2_ACCOUNT_ID?.trim()
    const reason = !id
        ? "R2_ACCOUNT_ID is empty"
        : PLACEHOLDER.test(id)
            ? "R2_ACCOUNT_ID still holds the placeholder from .env.example"
            : !DNS_LABEL.test(id)
                ? "R2_ACCOUNT_ID is not a valid hostname label, so the endpoint cannot resolve"
                : "R2_ACCESS_KEY_ID or R2_SECRET_ACCESS_KEY is empty or still a placeholder"
    console.warn(
        `[r2] File storage is DISABLED: ${reason}. ` +
        "Uploads will fall back to text-only where a fallback exists. " +
        "Set the R2_* values in apps/main/.env to enable it.",
    )
}

/**
 * Objects under this prefix are servable without a signed URL.
 *
 * A profile picture has to be fetchable by anyone who can see the profile, and
 * it has to keep working - `users.image` stores a URL, and a signed one would
 * turn every avatar in the product into a broken image seven days later.
 *
 * The prefix is a whitelist, not a convention. `/api/media` streams straight out
 * of the bucket, and the same bucket holds every user's uploaded RESUME. Without
 * this check that route is an "enter any key, read any document" endpoint.
 */
export const R2_PUBLIC_PREFIX = "avatars/"

export function isPubliclyServableKey(key: string): boolean {
    // `..` matters: a key like `avatars/../resumes/x` normalises out of the
    // prefix on some clients, and the check has to survive that.
    return key.startsWith(R2_PUBLIC_PREFIX) && !key.includes("..")
}

/**
 * A stable, shareable URL for a public object.
 *
 * Prefers a bucket domain when one is configured (`R2_PUBLIC_BASE_URL`) - that
 * serves straight off Cloudflare's edge and never touches the Worker. Without
 * one it falls back to this app's own `/api/media` route, so avatars work with
 * no extra configuration and get faster the moment a domain is added.
 */
export function r2PublicUrl(key: string): string {
    const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "")
    if (base) return `${base}/${key}`
    return `/api/media/${key}`
}

/** Fetch an object for streaming back to the browser. */
export async function getR2Object(key: string): Promise<{
    body: ReadableStream
    contentType: string
    contentLength?: number
} | null> {
    const client = createR2Client()
    try {
        const res = await client.send(new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }))
        if (!res.Body) return null
        return {
            body: res.Body.transformToWebStream(),
            contentType: res.ContentType ?? "application/octet-stream",
            contentLength: res.ContentLength,
        }
    } catch {
        return null
    }
}
