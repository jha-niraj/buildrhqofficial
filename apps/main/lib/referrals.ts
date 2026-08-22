/**
 * Referral constants and types.
 *
 * Separate from `actions/(main)/user/referral.action.ts` because that file is `"use server"`,
 * and a server-action module may export ONLY async functions - every export becomes a
 * callable server endpoint, so a plain constant has no valid representation and the build
 * refuses it:
 *
 *   Only async functions are allowed to be exported in a "use server" file.
 *
 * Types are erased before that check and would have been fine either way, but they live here
 * too so the whole non-callable surface is in one place rather than split by a rule that is
 * invisible at the call site.
 */

/**
 * XP awarded to the referrer per signup.
 *
 * This MIRRORS the value hard-coded in `utils/referral.ts`, which is what actually performs
 * the award at signup. The two are not derived from one another - if this number changes,
 * change it in both places, or the UI will promise something the write path does not pay.
 */
export const REFERRAL_XP = 300

export interface ReferralSummary {
    code: string
    /** Absolute, because a referral link is by definition opened on someone else's machine. */
    link: string
    /** People who signed up with this code. */
    count: number
    /** `count * REFERRAL_XP`, matching what the signup path actually awards. */
    xpEarned: number
    referred: Array<{
        id: string
        name: string | null
        image: string | null
        joinedAt: Date
    }>
}
