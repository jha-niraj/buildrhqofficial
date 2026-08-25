/**
 * Shape of the four profile links, plus the helpers that turn a stored URL back into what a
 * form field shows.
 *
 * Separate from `actions/(main)/user/profile-links.action.ts` because that file is
 * `"use server"` and such a module may export only async functions - a type or a pure helper
 * there is a build error. (It has been one before; see lib/referrals.ts for the same split.)
 */

export interface ProfileLinks {
    linkedinUrl: string | null
    githubUrl: string | null
    twitterUrl: string | null
    websiteUrl: string | null
}

/** `https://github.com/x` -> `x`, for a field that already prints `github.com/` beside it. */
export function githubUsernameFrom(url: string | null | undefined): string {
    if (!url) return ""
    return url
        .replace(/^https?:\/\//i, "")
        .replace(/^(www\.)?github\.com\//i, "")
        .replace(/^@/, "")
        .split(/[/?#]/)[0] ?? ""
}

/** `https://x.com/handle` -> `handle`, for a field that already prints `@` beside it. */
export function twitterHandleFrom(url: string | null | undefined): string {
    if (!url) return ""
    return url
        .replace(/^https?:\/\//i, "")
        .replace(/^(www\.)?(twitter|x)\.com\//i, "")
        .replace(/^@/, "")
        .split(/[/?#]/)[0] ?? ""
}
