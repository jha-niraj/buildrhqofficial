"use client"

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@repo/ui/components/ui/card';
import { AuthBackdropSurround } from '../../_components/auth-backdrop';
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"

function ErrorContent() {
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const errorParam = searchParams.get('error');
        setError(errorParam);
    }, [searchParams]);

    // Map of error codes to user-friendly messages
    const errorMessages: Record<string, { title: string; description: string; action: string }> = {
        Configuration: {
            title: "Server Configuration Error",
            description: "There's an issue with our authentication setup. Our team has been notified.",
            action: "Please try again later or contact support if the problem persists."
        },
        AccessDenied: {
            title: "Access Denied",
            description: "You don't have permission to access this resource.",
            action: "Please contact an administrator if you believe this is an error."
        },
        Verification: {
            title: "Verification Link Expired",
            description: "Your sign-in link has expired for security reasons.",
            action: "Please request a new verification link and try again."
        },
        OAuthSignin: {
            title: "OAuth Sign-in Error",
            description: "There was a problem connecting to the authentication provider.",
            action: "Please try signing in again or use a different method."
        },
        OAuthCallback: {
            title: "Authentication Callback Error",
            description: "We couldn't process your authentication request.",
            action: "Please try signing in again."
        },
        OAuthCreateAccount: {
            title: "Account Creation Failed",
            description: "We couldn't create an account with the provided credentials.",
            action: "Please try a different sign-in method or contact support."
        },
        EmailCreateAccount: {
            title: "Email Account Creation Failed",
            description: "We couldn't create an email account for you.",
            action: "Please check your email address and try again."
        },
        Callback: {
            title: "Authentication Failed",
            description: "The authentication process was interrupted.",
            action: "Please try signing in again."
        },
        OAuthAccountNotLinked: {
            title: "Account Not Linked",
            description: "This social account is not linked to any existing user account.",
            action: "Please sign up first or link this account in your profile settings."
        },
        CredentialsSignin: {
            title: "Invalid Credentials",
            description: "The email or password you entered is incorrect.",
            action: "Please check your credentials and try again."
        },
        EmailSignin: {
            title: "Email Sign-in Error",
            description: "There was an issue sending the verification email.",
            action: "Please check your email address and try again."
        },
        SessionRequired: {
            title: "Session Required",
            description: "You need to be signed in to access this page.",
            action: "Please sign in to continue."
        }
    };

    // Get the specific error message or use default
    const errorInfo = error ? errorMessages[error] : null;
    const defaultError = {
        title: "Authentication Error",
        description: "An unexpected error occurred during authentication.",
        action: "Please try signing in again."
    };

    const displayError = errorInfo || defaultError;

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 px-4">
            {/* Same backdrop as every other auth screen. This page did not use
                AuthShell, so it gets the surround layer directly. */}
            <AuthBackdropSurround />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-md"
            >
                <Card className="shadow-xl shadow-neutral-900/10 dark:shadow-black/40">
                    <CardHeader className="text-center pb-4">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {displayError.title}
                        </CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400">
                            {displayError.description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                            {displayError.action}
                        </p>

                        <div className="flex flex-col space-y-3">
                            <Button asChild className="w-full">
                                <Link href="/signin">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Return to Sign In
                                </Link>
                            </Button>

                            <Button variant="outline" asChild className="w-full">
                                <Link href="/register">
                                    Create New Account
                                </Link>
                            </Button>
                        </div>

                        {/* Optional: Display raw error for debugging */}
                        {
                            process.env.NODE_ENV === 'development' && error && (
                                <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-md">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                        Debug: {error}
                                    </p>
                                </div>
                            )
                        }
                    </CardContent>
                </Card>

                <div className="mt-6 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Need help?{' '}
                        <Link
                            href="/contact"
                            className="text-primary hover:underline font-medium"
                        >
                            Contact Support
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <InlineLoader size="sm" />
                    <span>Loading...</span>
                </div>
            </div>
        }>
            <ErrorContent />
        </Suspense>
    );
} 