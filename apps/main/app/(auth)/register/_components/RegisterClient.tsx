"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signUp, emailOtp } from "@repo/auth/client";
import { isSafeCallback } from "@/lib/urls";
import { motion, AnimatePresence } from "framer-motion";
import {
    Eye, EyeOff, Check, X, Gift, ArrowLeft, Loader2, MailCheck, Wand2,
} from "lucide-react";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import { Label } from "@repo/ui/components/ui/label";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { useAppContext } from "@/app/context/usercontext";
import toast from "@repo/ui/components/ui/sonner";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { finalizeSignup } from "@/actions/(auth)/auth/signup.actions";
import { AuthShell } from "../../_components/auth-shell";

const RESEND_COOLDOWN_SECONDS = 30;

type Phase = "details" | "magic" | "otp";

function SignUpForm() {
    const [phase, setPhase] = useState<Phase>("details");

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isGitHubLoading, setIsGitHubLoading] = useState(false);
    const [isMagicLoading, setIsMagicLoading] = useState(false);
    const [magicSent, setMagicSent] = useState(false);
    const [error, setError] = useState("");
    const [referralCode, setReferralCode] = useState<string | null>(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setEmail: setContextEmail } = useAppContext();

    // ── OTP step state ────────────────────────────────────────────────────────
    const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

    // Password validation states
    const [hasCapital, setHasCapital] = useState(false);
    const [hasNumber, setHasNumber] = useState(false);
    const [hasSpecial, setHasSpecial] = useState(false);
    const [hasMinLength, setHasMinLength] = useState(false);

    useEffect(() => {
        const ref = searchParams.get("ref");
        if (ref) setReferralCode(ref);

        // `callbackUrl` is what the sign-in page and the middleware send, and what
        // the marketing site's pricing CTAs use to resume checkout after signup.
        // `sso_callback` is the older name kept working for existing links.
        const callback =
            searchParams.get("callbackUrl") ?? searchParams.get("sso_callback");
        if (callback && isSafeCallback(callback)) {
            sessionStorage.setItem("sso_callback", callback);
        }
    }, [searchParams]);

    // Validate password as user types
    useEffect(() => {
        setHasCapital(/[A-Z]/.test(password));
        setHasNumber(/[0-9]/.test(password));
        setHasSpecial(/[!@#$%^&*(),.?":{}|<>]/.test(password));
        setHasMinLength(password.length >= 8);
    }, [password]);

    // Same predicate sign-in uses, so the two magic panels accept exactly the
    // same set of addresses.
    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

    // Resend cooldown ticker
    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    // Focus the first OTP box as soon as the step appears.
    useEffect(() => {
        if (phase === "otp") {
            const t = setTimeout(() => otpRefs.current[0]?.focus(), 350);
            return () => clearTimeout(t);
        }
    }, [phase]);

    const isPasswordValid = hasCapital && hasNumber && hasSpecial && hasMinLength;

    // ── Step 1: create the account ────────────────────────────────────────────
    // better-auth creates the (unverified) user and the emailOTP plugin mails the
    // code from the same request, so we can switch to the OTP step right away -
    // no /verify page, no password parked in sessionStorage.
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!agreedToTerms) {
            setError("Please agree to the Terms of Service and Privacy Policy");
            return;
        }
        if (!isPasswordValid) {
            setError("Please ensure your password meets all requirements");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const result = await signUp.email({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password,
            });

            if (result.error) {
                setError(getAuthErrorMessage(result.error.code ?? result.error.message));
                return;
            }

            setContextEmail(email.trim().toLowerCase());
            setCooldown(RESEND_COOLDOWN_SECONDS);
            setPhase("otp");
            toast.success("We sent a 6-digit code to your email");
        } catch {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // ── Step 2: verify the OTP ────────────────────────────────────────────────
    // `verifyEmail` marks the address verified AND mints the session, so a
    // verified user lands on onboarding already signed in.
    const verify = useCallback(
        async (otp: string) => {
            if (otp.length !== 6 || isVerifying) return;

            setIsVerifying(true);
            setError("");
            try {
                const result = await emailOtp.verifyEmail({
                    email: email.trim().toLowerCase(),
                    otp,
                });

                if (result.error) {
                    setError(getAuthErrorMessage(result.error.code ?? result.error.message));
                    setCode(["", "", "", "", "", ""]);
                    otpRefs.current[0]?.focus();
                    return;
                }

                // Credit the referrer / log the signup now that a session exists.
                await finalizeSignup(referralCode);

                toast.success("Email verified - let's set up your profile");
                // Leave "sso_callback" parked: a brand-new account still needs
                // onboarding, which hands the destination back once setup is done.
                router.push("/onboarding");
            } catch {
                setError("Could not verify the code. Please try again.");
            } finally {
                setIsVerifying(false);
            }
        },
        [email, isVerifying, referralCode, router],
    );

    const handleOtpChange = (index: number, value: string) => {
        if (value && !/^\d+$/.test(value)) return;
        const next = [...code];
        next[index] = value.slice(-1);
        setCode(next);
        if (value && index < 5) otpRefs.current[index + 1]?.focus();
        // Auto-submit the moment the last digit lands.
        const joined = next.join("");
        if (joined.length === 6 && !joined.includes("")) void verify(joined);
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text/plain").trim();
        if (!/^\d{6}$/.test(pasted)) return;
        const digits = pasted.split("");
        setCode(digits);
        otpRefs.current[5]?.focus();
        void verify(pasted);
    };

    const handleResend = async () => {
        if (cooldown > 0 || isResending) return;
        setIsResending(true);
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
            otpRefs.current[0]?.focus();
            setCooldown(RESEND_COOLDOWN_SECONDS);
            toast.success("A new code is on its way");
        } catch {
            toast.error("Failed to resend the code");
        } finally {
            setIsResending(false);
        }
    };

    // ── Sign up with a magic link (no password) ───────────────────────────────
    // A clicked link proves the address, so better-auth creates the account already
    // verified - no OTP step needed. `newUserCallbackURL` routes a brand-new account
    // to onboarding while an existing one goes straight into the app.
    const handleMagicSignUp = async (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        const trimmed = email.trim().toLowerCase();
        if (!emailIsValid) {
            setError("Enter a valid email address.");
            return;
        }
        setIsMagicLoading(true);
        setError("");
        try {
            const ssoCallback = sessionStorage.getItem("sso_callback");
            const result = await signIn.magicLink({
                email: trimmed,
                callbackURL: ssoCallback || "/home",
                newUserCallbackURL: "/onboarding",
                errorCallbackURL: "/signin",
            });
            if (result?.error) {
                setError(getAuthErrorMessage(result.error.code ?? result.error.message));
                return;
            }
            setMagicSent(true);
            toast.success("Check your inbox for your sign-up link");
        } catch {
            setError("Could not send the link. Please try again.");
        } finally {
            setIsMagicLoading(false);
        }
    };

    // ── Social ─────────────────────────────────────────────────────────────────
    // better-auth knows whether the OAuth callback just created the account or
    // matched an existing one, so `newUserCallbackURL` routes first-timers to
    // setup and returning users straight into the app - no guessing client-side.
    // Middleware re-checks `onboardingCompleted` for anyone who bailed mid-setup.
    const handleGoogleSignUp = async () => {
        try {
            setIsGoogleLoading(true);
            const ssoCallback = sessionStorage.getItem("sso_callback");
            await signIn.social({
                provider: "google",
                callbackURL: ssoCallback || "/home",
                newUserCallbackURL: "/onboarding",
            });
        } catch {
            setError("Google sign-up failed. Please try again.");
            setIsGoogleLoading(false);
        }
    };

    const handleGitHubSignUp = async () => {
        try {
            setIsGitHubLoading(true);
            const ssoCallback = sessionStorage.getItem("sso_callback");
            await signIn.social({
                provider: "github",
                callbackURL: ssoCallback || "/home",
                newUserCallbackURL: "/onboarding",
            });
        } catch {
            setError("GitHub sign-up failed. Please try again.");
            setIsGitHubLoading(false);
        }
    };

    return (
        <AuthShell
            variant="commit-graph"
            headline={<>Join the <span className="text-white/50">community</span>.</>}
            sub="Build projects, learn from peers, and grow your skills with thousands of developers."
            quote="Every expert was once a beginner."
        >
                    <AnimatePresence mode="wait">
                        {phase === "details" ? (
                            <motion.div
                                key="details"
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -16 }}
                                transition={{ duration: 0.25 }}
                            >
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold dark:text-white">Create an account</h2>
                                    <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                                        Start your developer journey with us
                                    </p>
                                </div>

                                {referralCode && (
                                    <div className="mb-6 p-4 bg-gradient-to-r from-neutral-900/10 to-neutral-900/10 border border-neutral-900/20 dark:border-white/20 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-neutral-900/20 rounded-lg">
                                                <Gift className="h-5 w-5 text-neutral-900 dark:text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium dark:text-white">
                                                    Referral bonus applied!
                                                </p>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                    You&apos;ll receive 100 bonus credits upon signup
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                        <p className="text-red-500 text-sm text-center">{error}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-12 dark:bg-zinc-800 dark:border-zinc-700 dark:hover:bg-zinc-700"
                                        onClick={handleGoogleSignUp}
                                        disabled={isGoogleLoading || isGitHubLoading}
                                    >
                                        {isGoogleLoading ? (
                                            <div className="h-5 w-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66 2.84-.81-.62z" fill="#FBBC05" />
                                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                                </svg>
                                                Google
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-12 dark:bg-zinc-800 dark:border-zinc-700 dark:hover:bg-zinc-700"
                                        onClick={handleGitHubSignUp}
                                        disabled={isGoogleLoading || isGitHubLoading}
                                    >
                                        {isGitHubLoading ? (
                                            <div className="h-5 w-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                                </svg>
                                                GitHub
                                            </>
                                        )}
                                    </Button>
                                </div>

                                <div className="relative mb-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-zinc-200 dark:border-zinc-700" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-4 bg-white dark:bg-zinc-900 text-zinc-500">
                                            or continue with email
                                        </span>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-sm font-medium dark:text-zinc-300">
                                            Full Name
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            placeholder="John Doe"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="h-12 dark:bg-zinc-800 dark:border-zinc-700 dark:focus:border-neutral-200"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm font-medium dark:text-zinc-300">
                                            Email
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="h-12 dark:bg-zinc-800 dark:border-zinc-700 dark:focus:border-neutral-200"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-sm font-medium dark:text-zinc-300">
                                            Password
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Create a secure password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="h-12 pr-12 dark:bg-zinc-800 dark:border-zinc-700 dark:focus:border-neutral-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                        {/* Shown only while it is still useful: it appears on the first keystroke
                                            and collapses once every rule passes. Gating on `password`
                                            alone meant the checklist stayed on screen for the rest of the
                                            form even after the password was valid, pushing the terms
                                            checkbox and submit button down and drawing the eye to
                                            something already dealt with. */}
                                        <AnimatePresence initial={false}>
                                        {password && !isPasswordValid && (
                                            <motion.div
                                                key="pw-reqs"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.18, ease: "easeOut" }}
                                                className="overflow-hidden mt-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
                                            >
                                                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                                                    Password requirements:
                                                </p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Requirement met={hasMinLength} label="8+ characters" />
                                                    <Requirement met={hasCapital} label="Uppercase letter" />
                                                    <Requirement met={hasNumber} label="Number" />
                                                    <Requirement met={hasSpecial} label="Special character" />
                                                </div>
                                            </motion.div>
                                        )}
                                        </AnimatePresence>
                                    </div>
                                    <div className="flex items-start gap-3 pt-2">
                                        <Checkbox
                                            id="terms"
                                            checked={agreedToTerms}
                                            onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                                            className="cursor-pointer mt-0.5 border-zinc-300 dark:border-zinc-600 data-[state=checked]:bg-neutral-900 data-[state=checked]:border-neutral-900"
                                        />
                                        <Label
                                            htmlFor="terms"
                                            className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed cursor-pointer"
                                        >
                                            I agree to the{" "}
                                            <Link href="/termsofservice" className="text-neutral-900 dark:text-white hover:underline">
                                                Terms of Service
                                            </Link>{" "}
                                            and{" "}
                                            <Link href="/privacypolicy" className="text-neutral-900 dark:text-white hover:underline">
                                                Privacy Policy
                                            </Link>
                                        </Label>
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={isLoading || !agreedToTerms}
                                        className="w-full h-12 bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-medium mt-6"
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Creating account...
                                            </div>
                                        ) : (
                                            "Create Account"
                                        )}
                                    </Button>

                                    <div className="relative py-1">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-zinc-200 dark:border-zinc-700" />
                                        </div>
                                        <div className="relative flex justify-center text-xs">
                                            <span className="bg-white px-2 text-zinc-400 dark:bg-zinc-900">or</span>
                                        </div>
                                    </div>

                                    {/* Passwordless sign-up. Not inside the <form> submit path - it
                                        only needs the email field, so it must not be blocked by the
                                        password rules or the terms checkbox validation above. */}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => { setError(""); setMagicSent(false); setPhase("magic"); }}
                                        className="w-full h-12 gap-2 border-neutral-900/30 dark:border-white/25 font-medium text-neutral-800 transition-colors hover:border-neutral-900/60 dark:hover:border-white/50 hover:bg-neutral-900/5 dark:hover:bg-white/5 hover:text-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-200/10"
                                    >
                                        <Wand2 className="h-4 w-4" />
                                        Sign up without a password
                                    </Button>
                                </form>
                                <p className="mt-8 text-center text-zinc-500 dark:text-zinc-400">
                                    Already have an account?{" "}
                                    <Link
                                        href="/signin"
                                        className="font-semibold text-neutral-900 underline-offset-4 hover:underline dark:text-white"
                                    >
                                        Sign in
                                    </Link>
                                </p>
                            </motion.div>
                        ) : phase === "magic" ? (
                            /* Passwordless sign-up gets its own panel, mirroring the
                               sign-in magic panel exactly: the email box IS the form,
                               so there is nothing to fill in "above" first. The old
                               version was a button under the full form that refused
                               to work and told you to go back and type your email -
                               an error for a step the UI had not asked for yet. */
                            <motion.div
                                key="magic"
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -16 }}
                                transition={{ duration: 0.25 }}
                            >
                                <div className="text-center mb-8">
                                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-900/20 bg-neutral-900/10 dark:border-white/20 dark:bg-white/10">
                                        <Wand2 className="h-7 w-7 text-neutral-900 dark:text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold dark:text-white">Sign up without a password</h2>
                                    <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                                        We&apos;ll email you a link that creates your account and signs you in.
                                    </p>
                                </div>

                                {error && (
                                    <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                                        <p className="text-center text-sm text-red-500">{error}</p>
                                    </div>
                                )}

                                <form onSubmit={handleMagicSignUp} className="space-y-4" noValidate>
                                    <div className="space-y-2">
                                        <Label htmlFor="magic-email" className="text-sm font-medium dark:text-zinc-300">
                                            Email
                                        </Label>
                                        <Input
                                            id="magic-email"
                                            type="email"
                                            autoFocus
                                            autoComplete="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); setMagicSent(false); }}
                                            required
                                            className="h-12 dark:bg-zinc-800 dark:border-zinc-700 dark:focus:border-neutral-200"
                                        />
                                    </div>

                                    {magicSent && (
                                        <div className="rounded-lg border border-neutral-900/20 bg-neutral-900/5 p-3 text-sm text-neutral-700 dark:border-white/20 dark:bg-white/5 dark:text-neutral-300">
                                            Link sent. Open it on this device and your account will be created and
                                            signed in automatically. It expires in 10 minutes.
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={isMagicLoading || !emailIsValid}
                                        className="mt-2 h-12 w-full bg-neutral-900 font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                                    >
                                        {isMagicLoading
                                            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending link…</>
                                            : magicSent ? "Send another link" : "Email me a sign-up link"}
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => { setPhase("details"); setMagicSent(false); setError(""); }}
                                        className="h-12 w-full gap-2 rounded-lg font-medium text-neutral-600 dark:text-neutral-300"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Back to sign up
                                    </Button>
                                </form>

                                <p className="mt-8 text-center text-zinc-500 dark:text-zinc-400">
                                    Already have an account?{" "}
                                    <Link
                                        href="/signin"
                                        className="font-semibold text-neutral-900 underline-offset-4 hover:underline dark:text-white"
                                    >
                                        Sign in
                                    </Link>
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="otp"
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 16 }}
                                transition={{ duration: 0.25 }}
                            >
                                <div className="text-center mb-8">
                                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900/10 dark:bg-white/10 border border-neutral-900/20 dark:border-white/20">
                                        <MailCheck className="h-7 w-7 text-neutral-900 dark:text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold dark:text-white">Check your email</h2>
                                    <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                                        We sent a 6-digit code to{" "}
                                        <span className="font-medium text-zinc-700 dark:text-zinc-200">{email}</span>
                                    </p>
                                </div>

                                {error && (
                                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                        <p className="text-red-500 text-sm text-center">{error}</p>
                                    </div>
                                )}

                                <div className="flex justify-center gap-2 sm:gap-3 mb-6">
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
                                            className="h-14 w-12 rounded-xl border-2 border-zinc-200 bg-white text-center text-xl font-semibold text-zinc-900 outline-none transition-colors focus:border-neutral-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                        />
                                    ))}
                                </div>

                                <Button
                                    type="button"
                                    onClick={() => void verify(code.join(""))}
                                    disabled={isVerifying || code.join("").length !== 6}
                                    className="w-full h-12 bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-medium"
                                >
                                    {isVerifying ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Verifying...
                                        </div>
                                    ) : (
                                        "Verify & continue"
                                    )}
                                </Button>

                                <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                                    Didn&apos;t get the code?{" "}
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={cooldown > 0 || isResending}
                                        className="font-medium text-neutral-900 dark:text-white hover:underline disabled:cursor-not-allowed disabled:text-zinc-400 disabled:no-underline dark:disabled:text-zinc-600"
                                    >
                                        {isResending
                                            ? "Sending…"
                                            : cooldown > 0
                                                ? `Resend in ${cooldown}s`
                                                : "Resend code"}
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => { setPhase("details"); setError(""); }}
                                    className="mt-8 mx-auto flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Use a different email
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
        </AuthShell>
    );
}

function Requirement({ met, label }: { met: boolean; label: string }) {
    return (
        <div className="flex items-center gap-2">
            {met ? (
                <Check className="h-3.5 w-3.5 text-neutral-900 dark:text-white" />
            ) : (
                <X className="h-3.5 w-3.5 text-zinc-400" />
            )}
            <span className={`text-xs ${met ? "text-neutral-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"}`}>
                {label}
            </span>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900">
                    <div className="h-8 w-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <SignUpForm />
        </Suspense>
    );
}
