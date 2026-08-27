import { auth } from "./auth";
import type { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";

export type SessionUser = {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
    role?: string;
    onboardingCompleted?: boolean;
    emailVerified?: boolean;
    [key: string]: unknown;
};

export type AppSession = {
    user: SessionUser;
    session: { id: string; expiresAt: Date; [key: string]: unknown };
} | null;

/**
 * Server-side session helper. Drop-in for the old `getServerSession(authOptions)` / `auth()` pattern.
 *
 * Usage in a Server Action or Route Handler:
 *   import { getSession } from "@repo/auth"
 *   import { headers } from "next/headers"
 *   const session = await getSession(headers())
 *   if (!session) return { error: "Unauthorized" }
 *   const userId = session.user.id
 */
export async function getSession(
    reqHeaders: ReadonlyHeaders | Headers | Promise<ReadonlyHeaders | Headers>,
): Promise<AppSession> {
    const resolved = await reqHeaders;
    const result = await auth.api.getSession({ headers: resolved as Headers });
    if (!result) return null;
    return result as AppSession;
}

/**
 * Re-read the session from the DATABASE and re-mint the cookie cache.
 *
 * Call this from a server action immediately after writing a user column that
 * routing depends on. `auth.ts` enables better-auth's cookie cache with a
 * 5-minute `maxAge`, and the middleware's warm path reads the user - including
 * `onboardingCompleted` - straight out of that signed cookie with no database
 * read at all. That is the whole point of the cache and it is why navigation is
 * cheap.
 *
 * The trap: a server action that updates the user row does NOT invalidate that
 * cookie. `revalidatePath` does not either - it clears Next's render cache,
 * which is a different cache entirely. So for up to five minutes the middleware
 * keeps routing on the OLD value, and the user is sent back to a step they have
 * already finished. It then fixes itself when the cookie expires, which is what
 * makes it look intermittent and unexplainable rather than broken.
 *
 * `disableCookieCache: true` is better-auth's documented way to force the
 * database read and refresh the cookie in one call. It only writes the cookie
 * because `auth.ts` registers the `nextCookies()` plugin, which is what lets a
 * server action set cookies at all - without it this would silently do nothing.
 *
 * Prefer this over widening the middleware to a database read: that would undo
 * the cookie cache on every navigation to fix a value that changes about twice
 * in a user's lifetime.
 */
export async function refreshSession(
    reqHeaders: ReadonlyHeaders | Headers | Promise<ReadonlyHeaders | Headers>,
): Promise<AppSession> {
    const resolved = await reqHeaders;
    const result = await auth.api.getSession({
        headers: resolved as Headers,
        query: { disableCookieCache: true },
    });
    if (!result) return null;
    return result as AppSession;
}