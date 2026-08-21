'use client';

import { FormEvent, useState, useRef, useEffect, JSX } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Button } from "@repo/ui/components/ui/button";
import {
    RefreshCw, CheckCircle2, Lock, Loader2
} from "lucide-react";
import { emailOtp } from "@repo/auth/client";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import toast from '@repo/ui/components/ui/sonner';
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"

const ResetPassword = (): JSX.Element | null => {
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [email, setEmail] = useState<string | null>(null);
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSuccess, setIsSuccess] = useState<boolean>(false);
    const [timer, setTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();

    const inputRefs = [
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
    ];

    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setEmail(emailParam);
        } else {
            router.push('/forgotpassword');
        }
    }, [searchParams, router]);

    useEffect(() => {
        if (timer > 0 && !canResend) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        } else if (timer === 0 && !canResend) {
            setCanResend(true);
        }
    }, [timer, canResend]);

    const handleOtpChange = (index: number, value: string) => {
        if (value && !/^\d+$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) inputRefs[index + 1]?.current?.focus();
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs[index - 1]?.current?.focus();
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text/plain").trim();
        if (/^\d{6}$/.test(pastedData)) {
            const digits = pastedData.split("");
            setOtp(digits);
            inputRefs[5]?.current?.focus();
        }
    };

    const handleResend = async () => {
        if (!email) return;
        try {
            const { error } = await emailOtp.requestPasswordReset({ email });
            if (error) {
                toast.error(getAuthErrorMessage(error.code ?? error.message));
                return;
            }
            toast.success("A new code is on its way");
            setCanResend(false);
            setTimer(30);
            setOtp(["", "", "", "", "", ""]);
        } catch {
            toast.error("Failed to resend code");
        }
    };

    // `emailOtp.resetPassword` verifies the code and writes the new password
    // through better-auth, which stores credential passwords on the `account`
    // row. The previous implementation hashed into `users.hashedPassword` --
    // a column better-auth never reads -- so it always reported success while
    // leaving the old password in force.
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!email) return toast.error("Session invalid. Restart process.");
        if (password !== confirmPassword) return toast.error('Passwords do not match');
        // Matches `minPasswordLength` in packages/auth/src/auth.ts. This used to
        // say 6, so a 6- or 7-character password passed here and was then
        // rejected by the server with a less helpful message.
        if (password.length < 8) return toast.error('Password too short (min 8 characters)');
        if (otp.join("").length !== 6) return toast.error("Enter full 6-digit code");

        setIsLoading(true);
        try {
            const { error } = await emailOtp.resetPassword({
                email,
                otp: otp.join(""),
                password,
            });

            if (error) {
                toast.error(getAuthErrorMessage(error.code ?? error.message));
                setOtp(["", "", "", "", "", ""]);
                inputRefs[0]?.current?.focus();
                return;
            }

            setIsSuccess(true);
            toast.success("Password reset successfully!");
            setTimeout(() => router.push('/signin'), 2000);
        } catch {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen w-full bg-white dark:bg-neutral-950 flex flex-col items-center justify-center font-sans">
                <div className="w-full max-w-md p-8 text-center">
                    {/* CSS, not framer-motion: this was the last motion usage on the
                        route, so the reset screen no longer pulls motion-dom into its
                        client graph. See .auth-pop in globals.css. */}
                    <div className="auth-pop w-20 h-20 bg-neutral-100 dark:bg-neutral-800/30 rounded-full flex items-center justify-center mx-auto mb-6 text-neutral-800 dark:text-neutral-100">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Password Reset</h2>
                    <p className="text-neutral-500 dark:text-neutral-400">Your security has been restored. Redirecting...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div>
                <div className="mb-8">
                    <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 dark:bg-neutral-900 dark:text-white">
                        <Lock className="h-5 w-5" />
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Set new password</h2>
                    <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                        Enter the code sent to <span className="font-mono text-neutral-700 dark:text-neutral-300">{email}</span>
                    </p>
                </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-3">
                            <Label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Verification Code</Label>
                            <div className="flex justify-between gap-2">
                                {
                                    otp.map((digit, index) => (
                                        <Input
                                            key={index}
                                            ref={inputRefs[index]}
                                            type="text"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            onPaste={index === 0 ? handlePaste : undefined}
                                            className="w-12 h-12 text-center text-xl font-bold p-0 rounded-lg bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all"
                                        />
                                    ))
                                }
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider" htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-11 rounded-xl bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider" htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="h-11 rounded-xl bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                                    required
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 rounded-xl font-medium transition-all"
                            disabled={isLoading || otp.join("").length !== 6}
                        >
                            {isLoading ? <InlineLoader size="sm" /> : "Reset Password"}
                        </Button>
                        <div className="text-center pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleResend}
                                disabled={!canResend}
                                className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                            >
                                {/* Not a loader: this is the resend cooldown, and the icon spinning
                                    is what tells the user the timer is running rather than stuck. */}
                                <RefreshCw className={`mr-2 h-3 w-3 ${!canResend && "animate-spin"}`} />
                                {canResend ? "Resend Verification Code" : `Resend available in ${timer}s`}
                            </Button>
                        </div>
                </form>
            </div>
        </>
    );
};

export default ResetPassword;