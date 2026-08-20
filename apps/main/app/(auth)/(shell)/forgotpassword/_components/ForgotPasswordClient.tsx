"use client"

import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import React, { useState } from "react";
import toast from "@repo/ui/components/ui/sonner";
import { useRouter } from "next/navigation";
import { emailOtp } from "@repo/auth/client";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import {
    ArrowLeft, KeyRound, Loader2, Mail
} from "lucide-react";
import Link from "next/link";
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"

export default function ForgotPassword() {
    const [email, setEmail] = useState<string>("");
    const [sending, setIsSending] = useState<boolean>(false);
    const router = useRouter();

    // better-auth owns the reset code end to end. This used to POST to a
    // hand-rolled /api/forgotpassword route that wrote an OTP onto
    // `users.resetOTP` and, on the other side, hashed the new password into
    // `users.hashedPassword` -- a column better-auth never reads. Credential
    // passwords live on the `account` row, so that flow reported success and
    // changed nothing: the old password kept working.
    //
    // `requestPasswordReset` mails a "forget-password" OTP through the same
    // sender configured in packages/auth/src/auth.ts, and
    // `emailOtp.resetPassword` on the next page writes the password where
    // better-auth actually looks.
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return toast.error("Please enter your email");

        setIsSending(true);

        try {
            const { error } = await emailOtp.requestPasswordReset({ email: email.trim().toLowerCase() });

            if (error) {
                toast.error(getAuthErrorMessage(error.code ?? error.message));
                return;
            }

            // Deliberately not branching on "no such user": better-auth answers
            // identically either way, so the page cannot be used to probe which
            // addresses have accounts.
            toast.success("If that address has an account, a reset code is on its way");
            router.push(`/resetpassword?email=${encodeURIComponent(email.trim().toLowerCase())}`);
        } catch (error: unknown) {
            console.error("Error sending password reset email:", error);
            toast.error("Failed to send reset email. Please try again.");
        } finally {
            setIsSending(false);
        }
    }

    return (
        <>
            <div className="mb-8">
                <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 dark:bg-neutral-900 dark:text-white">
                    <KeyRound className="h-5 w-5" />
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    Forgot your password?
                </h1>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    We&apos;ll email you a code to set a new one.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-neutral-500" htmlFor="email">
                        Email address
                    </Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
                        <Input
                            id="email"
                            className="h-11 rounded-xl border-neutral-200 bg-neutral-50 pl-10 transition-all focus:ring-2 focus:ring-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:ring-white"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            type="email"
                            autoComplete="email"
                            placeholder="name@example.com"
                        />
                    </div>
                </div>
                <Button
                    className="h-11 w-full rounded-xl bg-neutral-900 font-medium text-white transition-all hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                    type="submit"
                    disabled={sending}
                >
                    {sending ? (
                        <span className="flex items-center gap-2">
                            <InlineLoader size="sm" /> Sending…
                        </span>
                    ) : "Send reset code"}
                </Button>
            </form>

            <div className="mt-6 text-center">
                <Link
                    href="/signin"
                    className="inline-flex items-center text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to sign in
                </Link>
            </div>
        </>
    );
}
