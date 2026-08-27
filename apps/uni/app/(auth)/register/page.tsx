"use client";

import { useState, useEffect, Suspense } from "react";
import { Logo } from "@repo/ui/components/logo"
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, signUp } from '@repo/auth/client';
import { motion, AnimatePresence } from "framer-motion";
import {
    Eye, EyeOff, Check, X, GraduationCap, ArrowRight, Loader2, Info, Users
} from "lucide-react";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import { Label } from "@repo/ui/components/ui/label";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@repo/ui/components/ui/select";
import toast from "@repo/ui/components/ui/sonner";

// University Head roles - only these positions can register
type UniversityHeadRole = "CHANCELLOR" | "VICE_CHANCELLOR" | "PRINCIPAL" | "REGISTRAR" | "DEAN" | "OTHER_ADMIN";

const HEAD_ROLES: { value: UniversityHeadRole; label: string }[] = [
    { value: "CHANCELLOR", label: "Chancellor" },
    { value: "VICE_CHANCELLOR", label: "Vice Chancellor" },
    { value: "PRINCIPAL", label: "Principal" },
    { value: "REGISTRAR", label: "Registrar" },
    { value: "DEAN", label: "Dean" },
    { value: "OTHER_ADMIN", label: "Other University Admin" },
];

function SignUpForm() {
    const [universityName, setUniversityName] = useState("");
    const [headRole, setHeadRole] = useState<UniversityHeadRole>("PRINCIPAL");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState("");
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const router = useRouter();

    // Password validation states
    const [hasCapital, setHasCapital] = useState(false);
    const [hasNumber, setHasNumber] = useState(false);
    const [hasSpecial, setHasSpecial] = useState(false);
    const [hasMinLength, setHasMinLength] = useState(false);

    useEffect(() => {
        setHasCapital(/[A-Z]/.test(password));
        setHasNumber(/[0-9]/.test(password));
        setHasSpecial(/[!@#$%^&*(),.?":{}|<>]/.test(password));
        setHasMinLength(password.length >= 8);
    }, [password]);

    const isPasswordValid = hasCapital && hasNumber && hasSpecial && hasMinLength;

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
            // better-auth owns sign-up now. The old POST to /api/auth/register
            // inserted a `users` row with a bcrypt hash in `users.hashedPassword`
            // and never created the `account` row that better-auth checks at
            // sign-in, so an email+password account could be registered and
            // verified and then never sign in. That route also silently dropped
            // `universityName`/`headRole` (it only destructured name/email/
            // password), which is why they are not passed here either - onboarding
            // is where those are actually collected and persisted.
            const { error } = await signUp.email({
                name,
                email: email.trim().toLowerCase(),
                password,
            });

            if (error) {
                setError(error.message || "An error occurred during registration");
                return;
            }

            // `sendVerificationOnSignUp` mails the code as part of this call, so
            // the verify page has one waiting for it.
            toast.success("Account created! Please check your email for verification code.");
            router.push(`/verify?email=${encodeURIComponent(email.trim().toLowerCase())}`);
        } catch {
            setError("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        try {
            setIsGoogleLoading(true);
            await signIn.social({
                provider: "google",
                callbackURL: "/onboarding",
            });
        } catch {
            setError("Google sign-up failed. Please try again.");
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-dvh flex bg-white dark:bg-neutral-950 mx-auto w-full max-w-7xl">
            <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center items-center bg-neutral-950 overflow-hidden">
                <div className="relative z-10 px-12 max-w-lg">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
                                <GraduationCap className="h-6 w-6 text-neutral-800" />
                            </div>
                            <span className="text-2xl font-bold text-white">Coder&apos;z University</span>
                        </div>
                        <h1 className="text-4xl font-bold text-white tracking-tight mb-4">
                            Transform Your <br />
                            <span className="text-neutral-800">Technical Education.</span>
                        </h1>
                        <p className="text-neutral-400 text-lg mb-8">
                            Initialize your university portal and empower students with industry-ready skills.
                        </p>
                        <div className="p-4 rounded-xl border border-neutral-800/50 bg-neutral-950/30 mb-6">
                            <div className="flex items-start gap-3">
                                <Info className="h-5 w-5 text-neutral-800 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-neutral-300 font-semibold text-sm">
                                        University Administrators Only
                                    </p>
                                    <p className="text-neutral-200/70 text-xs mt-1">
                                        This registration is exclusively for chancellors, principals, and other university administrators who will initialize the institutional workspace.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
                            <div className="flex items-start gap-3">
                                <Users className="h-5 w-5 text-neutral-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-neutral-300">
                                        Not a university administrator?
                                    </p>
                                    <p className="text-xs text-neutral-500 mt-1">
                                        Faculty and staff members should sign in using credentials provided by their university admin.
                                        Contact your administration for access.
                                    </p>
                                    <Link
                                        href="/signin"
                                        className="inline-flex items-center gap-1 text-xs text-white font-semibold hover:underline mt-2"
                                    >
                                        Go to Sign In
                                        <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 p-6 rounded-2xl border border-neutral-800/50 bg-neutral-900/20">
                            <p className="text-neutral-300 italic">
                                &quot;Our students&apos; placement rates increased by 40% after integrating with Coder&apos;z.&quot;
                            </p>
                            <p className="text-neutral-500 mt-3 text-sm font-mono">
                                - Dean, Top Engineering College
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-800 flex items-center justify-center">
                            <Logo className="h-[19px] w-[19px] text-white" />
                        </div>
                        <span className="text-lg font-bold text-neutral-900 dark:text-white">
                            Coder&apos;z <span className="text-neutral-800 font-mono font-normal">UNIVERSITY</span>
                        </span>
                    </div>
                    <div className="lg:hidden p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/20 mb-6">
                        <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-neutral-800 dark:text-neutral-100 mt-0.5 shrink-0" />
                            <p className="text-neutral-800 dark:text-neutral-700 text-xs">
                                <strong>University Admins Only.</strong> Faculty members should sign in with credentials provided by their admin.
                            </p>
                        </div>
                    </div>
                    <div className="text-center mb-8">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-2 block">
                            University Registration
                        </span>
                        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                            Initialize University Portal
                        </h2>
                        <p className="text-sm text-neutral-500 mt-2">
                            For chancellors, principals, and administrators only
                        </p>
                    </div>
                    <AnimatePresence>
                        {
                            error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="mb-6 p-4 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl"
                                >
                                    <p className="text-neutral-600 dark:text-neutral-400 text-sm text-center">{error}</p>
                                </motion.div>
                            )
                        }
                    </AnimatePresence>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12 mb-6 rounded-xl border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                        onClick={handleGoogleSignUp}
                        disabled={isGoogleLoading}
                    >
                        {
                            isGoogleLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66 2.84-.81-.62z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                    Continue with Google
                                </>
                            )
                        }
                    </Button>
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-4 bg-white dark:bg-neutral-950 text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                                Or continue with email
                            </span>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="universityName" className="text-xs font-mono uppercase tracking-wider text-neutral-500">
                                    University Name
                                </Label>
                                <Input
                                    id="universityName"
                                    type="text"
                                    placeholder="Delhi Technical University"
                                    value={universityName}
                                    onChange={(e) => setUniversityName(e.target.value)}
                                    required
                                    className="h-12 rounded-xl bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="headRole" className="text-xs font-mono uppercase tracking-wider text-neutral-500">
                                    Your Position
                                </Label>
                                <Select value={headRole} onValueChange={(v) => setHeadRole(v as UniversityHeadRole)}>
                                    <SelectTrigger className="h-12 rounded-xl bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                                        <SelectValue placeholder="Select your position" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {
                                            HEAD_ROLES.map((role) => (
                                                <SelectItem key={role.value} value={role.value}>
                                                    {role.label}
                                                </SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-mono uppercase tracking-wider text-neutral-500">
                                Your Full Name
                            </Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="h-12 rounded-xl bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-mono uppercase tracking-wider text-neutral-500">
                                University Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@university.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-12 rounded-xl bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-xs font-mono uppercase tracking-wider text-neutral-500">
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
                                    className="h-12 pr-12 rounded-xl bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <AnimatePresence initial={false}>
                            {
                                password && !isPasswordValid && (
                                    <motion.div
                                        key="pw-reqs"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.18, ease: "easeOut" }}
                                        className="overflow-hidden mt-3 p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl"
                                    >
                                        <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-2">
                                            Security Requirements
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            {
                                                [
                                                    { check: hasMinLength, label: "8+ chars" },
                                                    { check: hasCapital, label: "Uppercase" },
                                                    { check: hasNumber, label: "Number" },
                                                    { check: hasSpecial, label: "Special char" },
                                                ].map((req, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        {
                                                            req.check ? (
                                                                <Check className="h-3 w-3 text-neutral-900 dark:text-white" />
                                                            ) : (
                                                                <X className="h-3 w-3 text-neutral-400" />
                                                            )
                                                        }
                                                        <span className={req.check ? "text-neutral-900 dark:text-white" : "text-neutral-400"}>
                                                            {req.label}
                                                        </span>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </motion.div>
                                )
                            }
                            </AnimatePresence>
                        </div>
                        <div className="flex items-start gap-3 pt-2">
                            <Checkbox
                                id="terms"
                                checked={agreedToTerms}
                                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                                className="cursor-pointer mt-0.5 border-neutral-300 dark:border-neutral-700 data-[state=checked]:bg-neutral-900 dark:data-[state=checked]:bg-white data-[state=checked]:border-neutral-900 dark:data-[state=checked]:border-white"
                            />
                            <Label
                                htmlFor="terms"
                                className="text-sm text-neutral-500 leading-relaxed cursor-pointer"
                            >
                                I agree to the{" "}
                                <Link href="/terms" className="text-neutral-900 dark:text-white hover:underline">
                                    Terms of Service
                                </Link>{" "}
                                and{" "}
                                <Link href="/privacy" className="text-neutral-900 dark:text-white hover:underline">
                                    Privacy Policy
                                </Link>
                            </Label>
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading || !agreedToTerms}
                            className="w-full h-12 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 font-bold mt-6"
                        >
                            {
                                isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Initializing...
                                    </>
                                ) : (
                                    <>
                                        Create Workspace
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )
                            }
                        </Button>
                    </form>
                    <p className="mt-6 text-center text-neutral-500">
                        Already have access?{" "}
                        <Link
                            href="/signin"
                            className="text-neutral-900 dark:text-white font-semibold hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-dvh flex items-center justify-center bg-white dark:bg-neutral-950">
                    <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                </div>
            }
        >
            <SignUpForm />
        </Suspense>
    );
}