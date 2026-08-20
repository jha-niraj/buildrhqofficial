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

export function isR2Configured(): boolean {
    return !!(
        process.env.R2_ACCOUNT_ID &&
        process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY
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
