import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@repo/auth'
import { db, payments } from '@repo/db'
import { and, eq } from 'drizzle-orm'

/**
 * Record how a checkout ended when it did not end in a payment.
 *
 * The browser calls this from `modal.ondismiss` (the user closed checkout) and
 * from `payment.failed` (Razorpay declined it). Before this existed both cases
 * left the row at `PENDING` for ever, so in the admin payments table an attempt
 * somebody abandoned three weeks ago looked exactly like one happening right
 * now.
 *
 * This endpoint is deliberately weak: it can only ever move a row from PENDING
 * to CANCELLED or FAILED, both of which grant nothing. It is driven by a client
 * that a user controls, so it must not be able to reach a state worth forging.
 * Everything that grants credits goes through `verify` or the webhook, both of
 * which check a Razorpay signature.
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getSession(req.headers)
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const { orderId, status, reason } = await req.json()

        if (typeof orderId !== 'string' || !orderId) {
            return NextResponse.json({ message: 'orderId is required' }, { status: 400 })
        }
        if (status !== 'CANCELLED' && status !== 'FAILED') {
            return NextResponse.json({ message: 'status must be CANCELLED or FAILED' }, { status: 400 })
        }

        // Scoped to the caller's own row AND to PENDING. The userId clause stops
        // one user closing another user's checkout; the status clause is what
        // makes a late-arriving dismiss harmless - if the webhook has already
        // settled this order as COMPLETED, the update matches nothing rather
        // than overwriting a paid payment with "cancelled".
        const [updated] = await db
            .update(payments)
            .set({
                status,
                notes: {
                    outcome: status,
                    reason: typeof reason === 'string' ? reason.slice(0, 300) : undefined,
                    recordedAt: new Date().toISOString(),
                },
            })
            .where(
                and(
                    eq(payments.orderId, orderId),
                    eq(payments.userId, session.user.id),
                    eq(payments.status, 'PENDING'),
                ),
            )
            .returning({ id: payments.id })

        // No match is a normal outcome, not an error: the payment may already be
        // settled. Report it so the caller is never told a write happened that
        // did not.
        return NextResponse.json({ success: true, recorded: Boolean(updated) })
    } catch (error: unknown) {
        console.error('Error recording payment attempt:', error)
        return NextResponse.json({ message: 'Failed to record attempt' }, { status: 500 })
    }
}
