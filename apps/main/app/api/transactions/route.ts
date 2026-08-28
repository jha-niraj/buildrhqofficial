import { NextResponse } from 'next/server';
import { db, users, creditTransactions, payments } from '@repo/db';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { getSession } from '@repo/auth';
import { headers } from 'next/headers';

export async function GET() {
    try {
        const session = await getSession(await headers());

        if (!session || !session.user?.email) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }

        const user = await db.query.users.findFirst({
            where: eq(users.email, session.user.email),
            columns: { id: true },
        });

        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'User not found'
            }, { status: 404 });
        }

        // Credit transactions are grants and spends. They cannot answer "I paid
        // and got nothing", because a payment that failed or was abandoned never
        // produces one - which is exactly the case a user goes looking for their
        // history to explain. So the attempts come back too.
        const [transactions, attempts] = await Promise.all([
            db.query.creditTransactions.findMany({
                where: eq(creditTransactions.userId, user.id),
                orderBy: [desc(creditTransactions.createdAt)],
                limit: 100,
            }),
            // COMPLETED is deliberately excluded: a successful purchase already
            // appears above as its PURCHASE transaction, and listing it twice
            // would read as having been charged twice.
            db.query.payments.findMany({
                where: and(
                    eq(payments.userId, user.id),
                    inArray(payments.status, ['FAILED', 'CANCELLED', 'REFUNDED']),
                ),
                orderBy: [desc(payments.createdAt)],
                limit: 50,
                columns: {
                    id: true, credits: true, amount: true, currency: true,
                    status: true, createdAt: true, notes: true,
                },
            }),
        ]);

        return NextResponse.json({
            success: true,
            transactions,
            attempts,
        });

    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
