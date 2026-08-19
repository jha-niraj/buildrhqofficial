import { priceLabel, type PricedOperation } from "./pricing"

// ─────────────────────────────────────────────────────────────────────────────
// Client-side helpers for talking about credits.
//
// Client-safe on purpose - imported by button labels and toast handlers. It
// pulls only from `pricing.ts`, which has no server imports of its own.
// ─────────────────────────────────────────────────────────────────────────────

/** The credit-related fields every charged server action returns on failure. */
export interface CreditFailure {
    error?: string
    code?: string
    required?: number
    available?: number
}

/**
 * The message to show when a charged action fails.
 *
 * Running out of credits is not an error in the same sense as a crash: it is a
 * state the user can act on, and the message has to tell them what to do about
 * it. A bare "Insufficient credits" leaves them to work out how short they are
 * and where to go.
 */
export function creditErrorMessage(result: CreditFailure, fallback = "That did not work."): string {
    if (result.code === "INSUFFICIENT_CREDITS") {
        const need = result.required ?? 0
        const have = result.available ?? 0
        return `Not enough credits - this needs ${need} and you have ${have}. Top up from the Credits page.`
    }
    return result.error ?? fallback
}

/**
 * Suffix for a button label, e.g. "Generate Cover Letter (15 credits)".
 *
 * Returns an empty string for a free operation rather than "(0 credits)", which
 * reads as a bug. The price always comes from the shared table - a label typed
 * by hand that disagrees with the charge is worse than no label at all.
 */
export function priceSuffix(operation: PricedOperation): string {
    const label = priceLabel(operation)
    return label ? ` (${label})` : ""
}
