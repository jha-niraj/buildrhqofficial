"use client"

// pages/auth/error.tsx
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function AuthError() {
    const router = useRouter();
    const { error } = router.query;

    // Map of error codes to user-friendly messages
    const errorMessages = {
        Configuration: "Server configuration error. Please contact support.",
        AccessDenied: "Access denied. You do not have permission to sign in.",
        Verification: "Sign in link expired. Please request a new one.",
        Default: "An unexpected error occurred during authentication.",
        OAuthSignin: "Error connecting to authentication provider.",
        OAuthCallback: "Error processing authentication callback.",
        OAuthCreateAccount: "Could not create an account with the provided credentials.",
        EmailCreateAccount: "Could not create an email account.",
        Callback: "Authentication failed. Please try again.",
        OAuthAccountNotLinked: "This account is not linked to any existing user."
    };

    // Get the specific error message or use default
    const errorMessage = errorMessages[error as keyof typeof errorMessages] || errorMessages.Default;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                <div className="mb-6">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-16 w-16 mx-auto text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Authentication Error</h2>
                <p className="text-gray-600 mb-6">{errorMessage}</p>

                <div className="flex justify-center space-x-4">
                    <Link
                        href="/signin"
                        className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2 rounded hover:bg-neutral-800 dark:hover:bg-neutral-200 transition duration-300"
                    >
                        Return to Sign In
                    </Link>
                </div>

                {/* Optional: Display raw error for debugging */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-6 p-4 bg-gray-100 rounded">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Debug Info: {error}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}