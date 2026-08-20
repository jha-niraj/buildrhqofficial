"use client"

import type React from "react";
import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Eye, EyeOff, Code2, Wand2, KeyRound, MailCheck, ArrowLeft } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { signIn, emailOtp, useSession } from '@repo/auth/client';
import { isSafeCallback } from "@/lib/urls";
import toast from '@repo/ui/components/ui/sonner'
import { useRouter, useSearchParams } from "next/navigation";
import { useAppContext } from "@/app/context/usercontext";
import { getAuthErrorMessage, shouldRedirectToVerification } from "@/lib/auth-errors";
import { cn } from "@repo/ui/lib/utils";
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"

const RESEND_COOLDOWN_SECONDS = 30;

/** Which of the three sign-in surfaces the right-hand panel is showing. */
type Mode = "password" | "magic" | "verify";

function SearchParamsLoader() {
    const searchParams = useSearchParams();
    return <SignInForm searchParams={searchParams} />;
}

interface SignInFormProps {
    searchParams: ReturnType<typeof useSearchParams>;
}

function SignInForm({ searchParams }: SignInFormProps) {
    const [mode, setMode] = useState<Mode>("password");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { email, setEmail, password, setPassword } = useAppContext();
    const [showPassword, setShowPassword] = useState(false);
    const [googleSignIn, setGoogleSignIn] = useState<boolean>(false);
    const [githubSignIn, setGithubSignIn] = useState<boolean>(false);
    const [magicSent, setMagicSent] = useState(false);
    const router = useRouter();
    // Always /home: middleware bounces anyone who hasn't finished onboarding to
    // /onboarding, so a single callback covers new and returning users alike.
    const rawCallback = searchParams?.get("callbackUrl");
    // Same-origin paths only - an absolute callbackUrl would let a mailed link
    // hand the freshly authenticated user to an attacker's host.
    const callbackUrl = isSafeCallback(rawCallback) ? rawCallback : "/home";
    const { data: session } = useSession();

    // ── Inline verification (an unverified account tried to sign in) ──────────
    const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
    const [isVerifying, setIsVerifying] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

    // Redirect if already authenticated
    useEffect(() => {
        if (session) {
            router.push(callbackUrl);
        }
    }, [session, callbackUrl, router]);

    // Check if user just verified their email
    useEffect(() => {
        const verified = searchParams?.get("verified");
        if (verified === "true") {
            toast.success("Email verified successfully! You can now sign in.");
        }
        const err = searchParams?.get("error");
        if (err) {
            toast.error(getAuthErrorMessage(err));
        }
    }, [searchParams]);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    useEffect(() => {
        if (mode === "verify") {
            const t = setTimeout(() => otpRefs.current[0]?.focus(), 320);
            return () => clearTimeout(t);
        }
    }, [mode]);

    // `newUserCallbackURL` is what routes a first-time social sign-in to setup and
    // everyone else straight into the app - better-auth knows which of the two it
    // just did, and the client doesn't have to guess. Middleware re-checks
    // `onboardingCompleted` as a backstop for anyone who bailed out mid-setup.
    const handleSignInWithGoogle = async () => {
        try {
            setGoogleSignIn(true)
            await signIn.social({ provider: 'google', callbackURL: callbackUrl, newUserCallbackURL: '/onboarding' })
        } catch {
            toast.error('Failed to sign in with Google')
            setGoogleSignIn(false)
        }
    }

    const handleSignInWithGitHub = async () => {
        try {
            setGithubSignIn(true)
            await signIn.social({ provider: 'github', callbackURL: callbackUrl, newUserCallbackURL: '/onboarding' })
        } catch {
            toast.error('Failed to sign in with GitHub')
            setGithubSignIn(false)
        }
    }

    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

    // ── Password sign-in ──────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!email.trim()) return toast.error("Please enter your email address");
        if (!emailIsValid) return toast.error("Please enter a valid email address");
        if (!password) return toast.error("Please enter your password");
        if (password.length < 8) return toast.error("Password must be at least 8 characters");

        setIsSubmitting(true);

        try {
            const result = await signIn.email({ email: email.trim(), password, callbackURL: callbackUrl });

            if (result?.error) {
                const code = result.error.code ?? result.error.message ?? "";
                // An unverified account never gets bounced to a separate page any
                // more: mail a fresh code and finish verification right here.
                if (shouldRedirectToVerification(code)) {
                    await sendVerificationCode();
                    return;
                }
                toast.error(getAuthErrorMessage(code));
                return;
            }

            toast.success("Welcome back!");
            router.push(callbackUrl);
        } catch {
            toast.error("An unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Magic link ────────────────────────────────────────────────────────────
    // better-auth mails a URL pointing at its own verify endpoint: clicking it
    // consumes the token, sets the session cookie and 302s to `callbackURL`.
    // An unknown email signs up (a clicked link proves ownership, so the account
    // is created already verified) and middleware routes it to /onboarding.
    const handleMagicLink = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!emailIsValid) return toast.error("Please enter a valid email address");

        setIsSubmitting(true);
        try {
            const result = await signIn.magicLink({
                email: email.trim().toLowerCase(),
                callbackURL: callbackUrl,
                // First time this address has been seen? The link both creates the
                // account and proves the address, so send them straight to setup.
                // Middleware enforces the same rule as a backstop.
                newUserCallbackURL: "/onboarding",
                // better-auth appends ?error=<code> here, which the effect above toasts.
                errorCallbackURL: "/signin",
            });
            if (result?.error) {
                toast.error(getAuthErrorMessage(result.error.code ?? result.error.message));
                return;
            }
            setMagicSent(true);
            setCooldown(RESEND_COOLDOWN_SECONDS);
            toast.success("Check your inbox for the sign-in link");
        } catch {
            toast.error("Could not send the link. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Inline email verification ─────────────────────────────────────────────
    const sendVerificationCode = useCallback(async () => {
        try {
            const result = await emailOtp.sendVerificationOtp({
                email: email.trim().toLowerCase(),
                type: "email-verification",
            });
            if (result.error) {
                toast.error(getAuthErrorMessage(result.error.code ?? result.error.message));
                return;
            }
            setCode(["", "", "", "", "", ""]);
            setCooldown(RESEND_COOLDOWN_SECONDS);
            setMode("verify");
            toast.success("Your email isn't verified yet - we sent you a code");
        } catch {
            toast.error("Could not send a verification code. Please try again.");
        }
    }, [email]);

    const verify = useCallback(
        async (otp: string) => {
            if (otp.length !== 6 || isVerifying) return;
            setIsVerifying(true);
            try {
                const result = await emailOtp.verifyEmail({
                    email: email.trim().toLowerCase(),
                    otp,
                });
                if (result.error) {
                    toast.error(getAuthErrorMessage(result.error.code ?? result.error.message));
                    setCode(["", "", "", "", "", ""]);
                    otpRefs.current[0]?.focus();
                    return;
                }
                // verifyEmail mints the session, so we're signed in already.
                toast.success("Email verified - welcome back!");
                router.push(callbackUrl);
            } catch {
                toast.error("Could not verify the code. Please try again.");
            } finally {
                setIsVerifying(false);
            }
        },
        [email, isVerifying, router, callbackUrl],
    );

    const handleOtpChange = (index: number, value: string) => {
        if (value && !/^\d+$/.test(value)) return;
        const next = [...code];
        next[index] = value.slice(-1);
        setCode(next);
        if (value && index < 5) otpRefs.current[index + 1]?.focus();
        const joined = next.join("");
        if (joined.length === 6 && !joined.includes("")) void verify(joined);
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !code[index] && index > 0) otpRefs.current[index - 1]?.focus();
    };

    const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text/plain").trim();
        if (!/^\d{6}$/.test(pasted)) return;
        setCode(pasted.split(""));
        otpRefs.current[5]?.focus();
        void verify(pasted);
    };

    const registerUrl = callbackUrl && callbackUrl !== '/home'
        ? "/register?callbackUrl=" + encodeURIComponent(callbackUrl)
        : "/register";

    const emailField = (
        <div>
            <Label htmlFor="email" className="block text-sm mb-2 text-neutral-700 dark:text-neutral-300">
                Email address
            </Label>
            <Input
                type="email"
                id="email"
                placeholder="you@example.com"
                className={cn(
                    "text-sm w-full py-2.5 px-3 border rounded-lg",
                    "focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent",
                    "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700",
                    "text-neutral-900 dark:text-white"
                )}
                value={email}
                onChange={e => { setEmail(e.target.value); setMagicSent(false); }}
                disabled={isSubmitting}
                required
            />
        </div>
    );

    return (
        <>
                    <AnimatePresence mode="wait">
                        {mode === "verify" ? (
                            <motion.div
                                key="verify"
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 16 }}
                                transition={{ duration: 0.22 }}
                                className="flex flex-col"
                            >
                                <div className="mb-8">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900/10 dark:bg-white/10 border border-neutral-900/20 dark:border-white/20">
                                        <MailCheck className="h-6 w-6 text-neutral-900 dark:text-white" />
                                    </div>
                                    <h2 className="text-3xl font-medium mb-2 tracking-tight text-neutral-900 dark:text-white">
                                        Verify your email
                                    </h2>
                                    <p className="text-neutral-600 dark:text-neutral-400">
                                        Enter the 6-digit code we sent to{" "}
                                        <span className="font-medium text-neutral-800 dark:text-neutral-200">{email}</span>
                                    </p>
                                </div>

                                <div className="flex gap-2 mb-6">
                                    {code.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={(el) => { otpRefs.current[i] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete={i === 0 ? "one-time-code" : "off"}
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(i, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                            onPaste={handleOtpPaste}
                                            disabled={isVerifying}
                                            className="h-13 w-11 flex-1 rounded-lg border-2 border-neutral-200 bg-neutral-50 py-3 text-center text-xl font-semibold text-neutral-900 outline-none transition-colors focus:border-neutral-900 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                        />
                                    ))}
                                </div>

                                <Button
                                    type="button"
                                    onClick={() => void verify(code.join(""))}
                                    disabled={isVerifying || code.join("").length !== 6}
                                    className="w-full bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-medium py-2.5 rounded-lg disabled:opacity-50"
                                >
                                    {isVerifying
                                        ? <><InlineLoader size="sm" className="mr-2" />Verifying...</>
                                        : "Verify & sign in"}
                                </Button>

                                <p className="mt-5 text-center text-sm text-neutral-600 dark:text-neutral-400">
                                    Didn&apos;t get it?{" "}
                                    <button
                                        type="button"
                                        onClick={() => void sendVerificationCode()}
                                        disabled={cooldown > 0}
                                        className="font-medium text-neutral-900 dark:text-white hover:underline disabled:text-neutral-400 disabled:no-underline dark:disabled:text-neutral-600"
                                    >
                                        {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                                    </button>
                                </p>

                                <button
                                    type="button"
                                    onClick={() => setMode("password")}
                                    className="mt-8 mx-auto flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                                >
                                    <ArrowLeft className="h-4 w-4" /> Back to sign in
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={mode}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -12 }}
                                transition={{ duration: 0.22 }}
                                className="flex flex-col"
                            >
                                <div className="flex flex-col items-start mb-8">
                                    <div className="text-neutral-900 dark:text-white mb-4">
                                        <Code2 className="h-10 w-10" />
                                    </div>
                                    <h2 className="text-3xl font-medium mb-2 tracking-tight text-neutral-900 dark:text-white">
                                        Welcome Back
                                    </h2>
                                    <p className="text-left text-neutral-600 dark:text-neutral-400">
                                        {mode === "magic"
                                            ? "We'll email you a link that signs you straight in"
                                            : "Sign in to continue your coding journey"}
                                    </p>
                                </div>

                                {mode === "magic" ? (
                                    <form className="flex flex-col gap-4" onSubmit={handleMagicLink} noValidate>
                                        {emailField}

                                        {magicSent && (
                                            <div className="rounded-lg border border-neutral-900/20 dark:border-white/20 bg-neutral-900/5 dark:bg-white/5 p-3 text-sm text-neutral-700 dark:text-neutral-300">
                                                Link sent. Open it on this device and you&apos;ll be signed in
                                                automatically. It expires in 10 minutes.
                                            </div>
                                        )}

                                        <Button
                                            type="submit"
                                            disabled={isSubmitting || !emailIsValid || cooldown > 0}
                                            className="w-full bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-medium py-2.5 px-4 rounded-lg transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting
                                                ? <><InlineLoader size="sm" className="mr-2" />Sending link...</>
                                                : cooldown > 0
                                                    ? `Resend in ${cooldown}s`
                                                    : magicSent ? "Send another link" : "Email me a sign-in link"}
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => { setMode("password"); setMagicSent(false); }}
                                            className="w-full gap-2 rounded-lg py-2.5 font-medium text-neutral-600 dark:text-neutral-300"
                                        >
                                            <KeyRound className="h-4 w-4" />
                                            Use a password instead
                                        </Button>
                                    </form>
                                ) : (
                                    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
                                        {emailField}

                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <Label htmlFor="password" className="block text-sm text-neutral-700 dark:text-neutral-300">
                                                    Password
                                                </Label>
                                                <Link href="/forgotpassword" className="text-sm text-neutral-900 dark:text-white hover:text-neutral-800 transition-colors">
                                                    Forgot password?
                                                </Link>
                                            </div>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    id="password"
                                                    placeholder="••••••••"
                                                    className={cn(
                                                        "text-sm w-full py-2.5 px-3 pr-10 border rounded-lg",
                                                        "focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent",
                                                        "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700",
                                                        "text-neutral-900 dark:text-white"
                                                    )}
                                                    value={password}
                                                    onChange={e => setPassword(e.target.value)}
                                                    disabled={isSubmitting}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                                                    disabled={isSubmitting}
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={isSubmitting || !email.trim() || !password}
                                            className="w-full bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-medium py-2.5 px-4 rounded-lg transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? (
                                                <><InlineLoader size="sm" className="mr-2" />Signing in...</>
                                            ) : (
                                                "Sign In"
                                            )}
                                        </Button>

                                        <div className="relative my-1">
                                            <div className="absolute inset-0 flex items-center">
                                                <span className="w-full border-t border-neutral-200 dark:border-neutral-700" />
                                            </div>
                                            <div className="relative flex justify-center text-xs">
                                                <span className="bg-white px-2 text-neutral-400 dark:bg-neutral-900">or</span>
                                            </div>
                                        </div>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setMode("magic")}
                                            className="w-full gap-2 rounded-lg border-neutral-900/30 dark:border-white/25 py-2.5 font-medium text-neutral-800 transition-colors hover:border-neutral-900/60 dark:hover:border-white/50 hover:bg-neutral-900/5 dark:hover:bg-white/5 hover:text-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-200/10"
                                        >
                                            <Wand2 className="h-4 w-4" />
                                            Email me a sign-in link
                                        </Button>
                                    </form>
                                )}

                                <div className="relative my-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-neutral-200 dark:border-neutral-700" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white dark:bg-neutral-900 px-2 text-neutral-500">Or continue with</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        variant="outline"
                                        type="button"
                                        disabled={isSubmitting || googleSignIn || githubSignIn}
                                        onClick={handleSignInWithGoogle}
                                        className="border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                                    >
                                        {googleSignIn ? <InlineLoader size="sm" /> : (
                                            <>
                                                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                                </svg>
                                                Google
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        type="button"
                                        disabled={isSubmitting || googleSignIn || githubSignIn}
                                        onClick={handleSignInWithGitHub}
                                        className="border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                                    >
                                        {githubSignIn ? <InlineLoader size="sm" /> : (
                                            <>
                                                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                                </svg>
                                                GitHub
                                            </>
                                        )}
                                    </Button>
                                </div>

                                <p className="text-center text-neutral-600 dark:text-neutral-400 text-sm mt-4">
                                    Don&apos;t have an account?{" "}
                                    <Link href={registerUrl} className="font-semibold text-neutral-900 underline-offset-4 hover:underline dark:text-white">
                                        Create account
                                    </Link>
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
        </>
    );
}

export default function SignInPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-neutral-100 dark:bg-neutral-950">
                <InlineLoader size="lg" />
            </div>
        }>
            <SearchParamsLoader />
        </Suspense>
    );
}
