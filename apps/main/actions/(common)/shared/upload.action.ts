"use server"

import { getSession } from '@repo/auth';
import { headers } from 'next/headers';
import { uploadToR2, deleteFromR2, isR2Configured, warnIfR2Misconfigured, r2PublicUrl, isPubliclyServableKey, R2_PUBLIC_PREFIX } from '@/lib/r2-client';

// ─────────────────────────────────────────────────────────────────────────────
// Profile picture upload.
//
// Was Cloudinary. Two reasons it is not any more:
//
// 1. It was broken. The hand-rolled signer signed `folder` + `timestamp`, but the
//    request also sent `transformation`. Cloudinary signs EVERY signed parameter
//    in the request, so every upload came back "Invalid Signature" - the error
//    even quoted the string it expected, `transformation` included. Nobody could
//    set a profile picture during onboarding.
// 2. Everything else the product stores already lives in R2, and running one file
//    store instead of two is one set of credentials, one bill and one place to
//    look when something is missing.
//
// WHAT WAS LOST with Cloudinary is server-side transformation - it was doing a
// 500x500 face-gravity crop and format conversion. There is no equivalent here:
// `sharp` does not run on Workers. The size cap below is the only guard, so a
// large avatar is stored at its original dimensions. If that matters, Cloudflare
// Images sits in front of the same bucket and is the right place to add it back.
// ─────────────────────────────────────────────────────────────────────────────

const VALID_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const;
const MAX_BYTES = 5 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
};

export interface UploadImageResult {
    success: boolean;
    message: string;
    url: string | null;
    /** The R2 key, so a later replace can delete the object it supersedes. */
    key?: string;
}

export async function uploadProfileImage(formData: FormData): Promise<UploadImageResult> {
    try {
        const session = await getSession(await headers());
        if (!session?.user?.id) {
            return { success: false, message: "Authentication required", url: null };
        }
        const userId = session.user.id;

        const file = formData.get('file') as File | null;
        if (!file) {
            return { success: false, message: "No file provided", url: null };
        }

        if (!VALID_TYPES.includes(file.type as (typeof VALID_TYPES)[number])) {
            return {
                success: false,
                message: "Invalid file type. Please upload JPG, PNG, or WebP images.",
                url: null,
            };
        }

        if (file.size > MAX_BYTES) {
            return {
                success: false,
                message: "File size too large. Please upload images smaller than 5MB.",
                url: null,
            };
        }

        if (!isR2Configured()) {
            warnIfR2Misconfigured();
            return { success: false, message: "Image storage is not configured.", url: null };
        }

        // Keyed by user and timestamp: a new upload never overwrites the old one
        // mid-request, so a half-finished upload cannot blank an existing avatar.
        const ext = EXTENSIONS[file.type] ?? 'jpg';
        const key = `${R2_PUBLIC_PREFIX}${userId}-${Date.now()}.${ext}`;

        const bytes = new Uint8Array(await file.arrayBuffer());

        await uploadToR2({
            key,
            body: bytes,
            contentType: file.type,
            metadata: { userId, originalName: file.name },
        });

        return {
            success: true,
            message: "Image uploaded successfully",
            url: r2PublicUrl(key),
            key,
        };
    } catch (error: unknown) {
        console.error("[upload] profile image failed:", error);
        return {
            success: false,
            message: "Failed to upload image. Please try again.",
            url: null,
        };
    }
}

/**
 * Delete a previously uploaded profile picture.
 *
 * Takes the R2 key, and refuses anything outside the public prefix - the same
 * bucket holds every user's resume, and an unchecked key here is a "delete any
 * document" endpoint.
 */
export async function deleteProfileImage(key: string): Promise<{ success: boolean; message: string }> {
    try {
        const session = await getSession(await headers());
        if (!session?.user?.id) {
            return { success: false, message: "Authentication required" };
        }

        if (!isPubliclyServableKey(key)) {
            return { success: false, message: "That file cannot be deleted here" };
        }
        // Scoped to the owner: keys are `avatars/<userId>-<ts>.<ext>`, so a user
        // may only remove their own.
        if (!key.startsWith(`${R2_PUBLIC_PREFIX}${session.user.id}-`)) {
            return { success: false, message: "That file cannot be deleted here" };
        }

        await deleteFromR2(key);
        return { success: true, message: "Image deleted successfully" };
    } catch (error: unknown) {
        console.error("[upload] profile image delete failed:", error);
        return { success: false, message: "Failed to delete image" };
    }
}
