"use server"

import { getSession, refreshSession } from "@repo/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { db, users } from "@repo/db"
import { eq } from "drizzle-orm"

export async function checkUsernameAvailability(username: string) {
    try {
        // Validate username format
        if (!username || username.length < 3 || username.length > 20) {
            return {
                available: false,
                message: "Username must be between 3 and 20 characters"
            }
        }

        // Check if username contains only valid characters (alphanumeric, underscore, hyphen)
        const validUsernameRegex = /^[a-zA-Z0-9_-]+$/
        if (!validUsernameRegex.test(username)) {
            return {
                available: false,
                message: "Username can only contain letters, numbers, underscores, and hyphens"
            }
        }

        // Check if username exists
        const existingUser = await db.query.users.findFirst({
            where: eq(users.username, username.toLowerCase()),
        })

        if (existingUser) {
            return {
                available: false,
                message: "Username is already taken"
            }
        }

        return {
            available: true,
            message: "Username is available"
        }
    } catch (error) {
        console.error("Error checking username availability:", error)
        return {
            available: false,
            message: "Error checking username availability"
        }
    }
}

export async function completeOnboarding(data: {
    username: string
    university?: string
    semester?: string
    image?: string
    learningPreferences?: string[]
}) {
    const session = await getSession(headers())
    if (!session?.user?.id) {
        throw new Error("You must be logged in to complete onboarding")
    }

    const userId = session.user.id

    try {
        // Check username availability again before updating
        const usernameCheck = await checkUsernameAvailability(data.username)
        if (!usernameCheck.available) {
            throw new Error(usernameCheck.message)
        }

        // Update user with onboarding data. The resume file is uploaded to R2 by
        // `uploadResume` (which persists hasResume/resume/resumeText itself), and the
        // profile image is uploaded to Cloudinary - here we only persist the image URL
        // plus the profile fields, so we never clobber the R2 key with a signed URL.
        await db.update(users).set({
            username: data.username.toLowerCase(),
            university: data.university || null,
            semester: data.semester || null,
            ...(data.image ? { image: data.image } : {}),
            learningPreferences: data.learningPreferences || [],
            onboardingCompleted: true,
        }).where(eq(users.id, userId))

        // Re-mint the session cookie cache from the database.
        //
        // Without this the user completes onboarding and is sent straight back to
        // it. `auth.ts` runs better-auth's cookie cache with a 5-minute maxAge, and
        // `middleware.ts` reads `onboardingCompleted` out of that signed cookie on
        // its warm path without touching the database - so the row says `true`, the
        // cookie still says `false`, and the gate bounces them. Submitting again
        // does not help; it only clears when the cookie expires, which is why the
        // symptom looks random rather than reproducible.
        //
        // `revalidatePath` below does NOT cover this. It clears Next's render
        // cache, which is a different cache from better-auth's session cookie.
        await refreshSession(await headers())

        revalidatePath("/")
        return { success: true }

    } catch (error) {
        console.error("Onboarding completion failed:", error)
        throw new Error(error instanceof Error ? error.message : "Failed to complete onboarding")
    }
}

export async function checkOnboardingStatus() {
    const session = await getSession(headers())
    if (!session?.user?.id) {
        return { completed: false }
    }

    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, session.user.id),
            columns: {
                onboardingCompleted: true,
            },
        })

        return { completed: user?.onboardingCompleted || false }
    } catch (error) {
        console.error("Error checking onboarding status:", error)
        return { completed: false }
    }
}
