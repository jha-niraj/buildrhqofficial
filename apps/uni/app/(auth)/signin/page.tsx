"use client"

import type React from "react";
import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Loader2, Eye, EyeOff, GraduationCap, ArrowRight
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { signIn, useSession } from '@repo/auth/client';
import toast from '@repo/ui/components/ui/sonner'
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@repo/ui/lib/utils";

function SearchParamsLoader() {
    const searchParams = useSearchParams();
    return <SignInForm searchParams={searchParams} />;
}

interface SignInFormProps {
    searchParams: ReturnType<typeof useSearchParams>;
}

function SignInForm({ searchParams }: SignInFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [googleSignIn, setGoogleSignIn] = useState<boolean>(false);
    const router = useRouter();
    const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard";
    const { data: session, isPending } = useSession();

    useEffect(() => {
        if (session && !isPending) {
            router.push(callbackUrl);
        }
    }, [session, isPending, callbackUrl, router]);

    // Show success message if user just verified their email
    useEffect(() => {
        const verified = searchParams?.get("verified");
        if (verified === "true") {
            toast.success("Email verified! You can now sign in.");
        }
    }, [searchParams]);

    const handleSignInWithGoogle = async () => {
        try {
            setGoogleSignIn(true)
            await signIn.social({
                provider: 'google',
                callbackURL: callbackUrl,
            })
        } catch (error) {
            console.error('Google sign in error:', error)
            toast.error('Failed to sign in with Google')
            setGoogleSignIn(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const result = await signIn.email({
                email,
                password,
                callbackURL: callbackUrl,
            });

            if (result?.error) {
                toast.error("Invalid email or password. Please try again.");
                return;
            }

            if (result?.data) {
                toast.success("Welcome back!");
                router.push(callbackUrl);
            } else {
                toast.error("Sign in failed. Please try again.");
            }
        } catch (err) {
            console.error("Signin error:", err);
            toast.error("An unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const registerUrl = callbackUrl && callbackUrl !== '/dashboard'
        ? "/register?callbackUrl=" + encodeURIComponent(callbackUrl)
        : "/register";

    return (
        <div className="min-h-dvh flex items-center justify-center bg-white dark:bg-neutral-950 p-4 mx-auto w-full max-w-7xl">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="flex justify-center mb-8">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-800 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
                            Coder&apos;z <span className="text-neutral-800 font-mono font-normal">UNIVERSITY</span>
                        </span>
                    </Link>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8">
                    <div className="text-center mb-8">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-2 block">
                            Authentication
                        </span>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                            Access Your Workspace
                        </h1>
                    </div>
                    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-mono uppercase tracking-wider text-neutral-500">
                                University Email
                            </Label>
                            <Input
                                type="email"
                                id="email"
                                placeholder="you@university.edu"
                                className={cn(
                                    "h-12 rounded-xl bg-white dark:bg-neutral-950",
                                    "border-neutral-200 dark:border-neutral-800",
                                    "focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white",
                                    "text-neutral-900 dark:text-white placeholder:text-neutral-400"
                                )}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isSubmitting}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-xs font-mono uppercase tracking-wider text-neutral-500">
                                    Password
                                </Label>
                                <Link
                                    href="/forgotpassword"
                                    className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                >
                                    Forgot?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    placeholder="••••••••"
                                    className={cn(
                                        "h-12 rounded-xl bg-white dark:bg-neutral-950 pr-12",
                                        "border-neutral-200 dark:border-neutral-800",
                                        "focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white",
                                        "text-neutral-900 dark:text-white placeholder:text-neutral-400"
                                    )}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isSubmitting}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-12 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 font-bold transition-all"
                        >
                            {
                                isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        Initialize Session
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )
                            }
                        </Button>
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-neutral-200 dark:border-neutral-800" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-neutral-50 dark:bg-neutral-900 px-4 text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                                    Or
                                </span>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            type="button"
                            disabled={isSubmitting || googleSignIn}
                            onClick={handleSignInWithGoogle}
                            className="w-full h-12 rounded-xl border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium"
                        >
                            {
                                googleSignIn ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                        Continue with Google
                                    </>
                                )
                            }
                        </Button>
                    </form>
                    <p className="text-center text-neutral-500 text-sm mt-6">
                        New to the platform?{" "}
                        <Link
                            href={registerUrl}
                            className="text-neutral-800 dark:text-neutral-100 font-semibold hover:underline"
                        >
                            Register University
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

export default function SignInPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-dvh items-center justify-center bg-white dark:bg-neutral-950">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            </div>
        }>
            <SearchParamsLoader />
        </Suspense>
    );
}