import { reserveCredits, settleCredits, releaseCredits, toReleaseReason } from "./hold"
import { priceOf, type PricedOperation } from "./pricing"

// ─────────────────────────────────────────────────────────────────────────────
// One way to charge for one operation.
//
// `hold.ts` gives us reserve / settle / release. This is the shape every caller
// wants on top of it, written once instead of five times:
//
//     reserve -> run the work -> settle on success, refund on failure
//
// Hand-rolling that at each call site is how a refund gets forgotten. The bug it
// prevents is not hypothetical: before holds existed, every paid flow in the
// product debited credits and then called an LLM, and a failed call left the
// user charged for nothing with no record that a refund was owed.
//
// WHAT GOES INSIDE `run` IS THE DESIGN DECISION at each call site, and it is not
// the same everywhere:
//
//   - Work whose only product is the returned value (a cover letter, which the
//     user receives in the response) puts ONLY the model call inside `run`. A
//     later failure to save it must not refund - the user got the thing.
//
//   - Work whose product is a database row (an imported resume) puts the model
//     call AND the insert inside `run`. If the insert fails the user has nothing
//     to show for the charge, so it must refund.
//
// Throw from `run` to refund. Return normally to settle.
// ─────────────────────────────────────────────────────────────────────────────

export type ChargeResult<T> =
    | { success: true; data: T; charged: number }
    | {
          success: false
          error: string
          /** `INSUFFICIENT_CREDITS` lets the UI offer a route to /purchase. */
          code?: string
          required?: number
          available?: number
      }

interface ChargeOptions {
    userId: string
    /** Looked up in `lib/credits/pricing.ts`. A price of 0 skips the hold. */
    operation: PricedOperation
    /** Ledger description. Shown to the user in their transaction history. */
    reason: string
}

/**
 * Run `work`, charging the user for it, refunding if it fails.
 *
 * A free operation (price 0) runs with no hold at all - `reserveCredits`
 * rejects an amount of 0 as invalid, so forwarding a free price into it would
 * turn a free feature into a hard error.
 *
 * The hold id is a fresh UUID per call, deliberately. Keying it on the target
 * row instead (a draft id, say) would make a user's second generation on the
 * same draft silently free, because the reserve would report `alreadyHeld` and
 * charge nothing.
 */
export async function withCredits<T>(
    options: ChargeOptions,
    work: () => Promise<T>,
): Promise<ChargeResult<T>> {
    const { userId, operation, reason } = options
    const amount = priceOf(operation)

    if (amount <= 0) {
        try {
            return { success: true, data: await work(), charged: 0 }
        } catch (error: unknown) {
            return { success: false, error: toUserMessage(error) }
        }
    }

    const holdId = crypto.randomUUID()
    const hold = await reserveCredits({ userId, amount, reason, holdId })
    if (!hold.ok) {
        return {
            success: false,
            error: hold.error,
            code: hold.code,
            required: hold.required ?? amount,
            available: hold.available ?? 0,
        }
    }

    try {
        const data = await work()
        await settleCredits(holdId)
        return { success: true, data, charged: amount }
    } catch (error: unknown) {
        await releaseCredits(holdId, toReleaseReason(error))
        return {
            success: false,
            // Say the credits came back. Without it the user assumes they paid
            // for the failure and the next thing they do is open a support chat.
            error: `${toUserMessage(error)} Your ${amount} credits were refunded.`,
        }
    }
}

/**
 * Marker for a failure that is the operation's own fault rather than a crash -
 * an empty completion, output that would not parse. Thrown from inside `work`
 * so the refund path runs, with a message worth showing the user.
 */
export class OperationFailed extends Error {
    constructor(message: string) {
        super(message)
        this.name = "OperationFailed"
    }
}

function toUserMessage(error: unknown): string {
    if (error instanceof OperationFailed) return error.message
    // Anything else is an internal failure. The real message goes to the logs,
    // not to the user - it is usually a stack-shaped string or an upstream API's
    // internal error text.
    console.error("[credits] charged operation failed:", error)
    return "That did not work. Please try again."
}
