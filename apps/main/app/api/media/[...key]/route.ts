import { NextRequest, NextResponse } from "next/server"
import { getR2Object, isPubliclyServableKey } from "@/lib/r2-client"

/**
 * Serve a public object out of R2.
 *
 * The fallback path for profile pictures when no bucket domain is configured -
 * `r2PublicUrl` points here, and points at the domain instead the moment
 * `R2_PUBLIC_BASE_URL` is set. Avatars have to resolve from a plain <img>, so a
 * signed URL is not an option: it would expire and break every avatar in the
 * product a week later.
 *
 * THE PREFIX CHECK IS THE WHOLE SECURITY MODEL. This bucket also holds every
 * user's uploaded resume under `resumes/`. Without it, this route reads any key
 * the caller can name.
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ key: string[] }> },
) {
    const { key: segments } = await params
    const key = segments.join("/")

    if (!isPubliclyServableKey(key)) {
        return new NextResponse("Not found", { status: 404 })
    }

    const object = await getR2Object(key)
    if (!object) return new NextResponse("Not found", { status: 404 })

    return new NextResponse(object.body, {
        headers: {
            "Content-Type": object.contentType,
            ...(object.contentLength ? { "Content-Length": String(object.contentLength) } : {}),
            // Immutable: the key carries a timestamp, so a changed avatar is a
            // different URL and this can be cached hard.
            "Cache-Control": "public, max-age=31536000, immutable",
        },
    })
}
