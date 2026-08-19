import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@repo/auth';

function getRazorpayAuth() {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!
    const keySecret = process.env.RAZORPAY_KEY_SECRET!
    return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`
}
import { db, users, payments } from '@repo/db';
import { eq } from 'drizzle-orm';
import {
    creditPackages, convertToPaise, calculatePrice, paymentConfig
} from '@repo/pricing';

export async function POST(req: NextRequest) {
    try {
        const session = await getSession(req.headers);
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { credits, currency = 'INR' } = await req.json();

        // Integer check first: a fractional or string `credits` passes a bare range
        // comparison and goes on to produce a fractional charge.
        if (!Number.isInteger(credits) || credits < paymentConfig.minCredits || credits > paymentConfig.maxCredits) {
            return NextResponse.json({
                message: `Credits must be between ${paymentConfig.minCredits} and ${paymentConfig.maxCredits}`
            }, { status: 400 });
        }

        // Validate currency
        if (currency !== 'INR' && currency !== 'USD') {
            return NextResponse.json({ message: 'Invalid currency. Only INR and USD are supported' }, { status: 400 });
        }

        if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return NextResponse.json({ message: 'Razorpay credentials not configured' }, { status: 500 });
        }

        // Get user details
        const user = await db.query.users.findFirst({
            where: eq(users.id, session.user.id),
            columns: { id: true, name: true, email: true },
        });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Calculate amount
        const packageInfo = creditPackages.find(pkg => pkg.credits === credits);
        let amount: number;

        if (packageInfo) {
            amount = currency === 'INR' ? packageInfo.inr : packageInfo.usd;
        } else {
            amount = calculatePrice(credits, currency as 'INR' | 'USD');
        }

        // Convert to paise for Razorpay (smallest currency unit)
        const amountInPaise = convertToPaise(amount, currency as 'INR' | 'USD');

        // Generate receipt
        const shortUserId = user.id.slice(0, 8);
        const timestamp = Date.now().toString().slice(-8);
        const receipt = `rcpt_${shortUserId}_${timestamp}`;

        // Create Razorpay order
        const razorpayOptions = {
            amount: amountInPaise,
            currency: currency === 'INR' ? 'INR' : 'USD',
            receipt: receipt,
            notes: {
                userId: user.id,
                userEmail: user.email || '',
                credits: credits.toString(),
                packageName: packageInfo?.badge || 'Custom',
            }
        };

        console.log('Creating Razorpay order with options:', razorpayOptions);
        const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Authorization': getRazorpayAuth(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(razorpayOptions),
        })
        if (!razorpayRes.ok) {
            const err = await razorpayRes.text()
            throw new Error(`Razorpay error ${razorpayRes.status}: ${err}`)
        }
        const razorpayOrder = await razorpayRes.json() as { id: string; [key: string]: unknown }
        console.log('Razorpay order created:', razorpayOrder);

        // Store payment record in database
        const [paymentRecord] = await db.insert(payments).values({
            userId: user.id,
            credits: credits,
            amount: String(amount),
            currency: currency === 'INR' ? 'INR' : 'USD',
            status: 'PENDING',
            orderId: razorpayOrder.id,
            razorpayOrderId: razorpayOrder.id,
            receipt: receipt,
            notes: {
                packageName: packageInfo?.badge || 'Custom',
                originalAmount: packageInfo ? (currency === 'INR' ? packageInfo.originalInr : packageInfo.originalUsd) : null,
            }
        }).returning();

        if (!paymentRecord) throw new Error("Failed to create payment record")
        console.log('Payment record created:', paymentRecord.id);

        // Return order details to frontend
        return NextResponse.json({
            success: true,
            orderId: razorpayOrder.id,
            amount: amount,
            currency: currency,
            receipt: receipt,
            paymentId: paymentRecord.id,
            credits: credits,
            packageInfo: packageInfo || null,
        });
    } catch (error: unknown) {
        console.error('Error creating Razorpay order:', error);
        return NextResponse.json({
            message: 'Failed to create payment order',
            error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
        }, { status: 500 });
    }
}
