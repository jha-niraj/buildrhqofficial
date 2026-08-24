"use client"

import { useState, useEffect } from "react"
import { signIn, signOut, useSession } from "@repo/auth/client"
import { toast } from "@repo/ui/components/ui/sonner"
import { ShipItHQLoader } from "@repo/ui/components/ui/shipithq-loader"
import { ShaderHeroBg, SHADER_PALETTES } from "@repo/ui/components/hero-shader-bg"
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"
import { Logo } from "@repo/ui/components/logo"
import { Mail, Lock, Eye, EyeOff, ArrowRight, Info, Shield, ShieldAlert } from "lucide-react"
import { checkAdminAccess } from "@/actions/admin.action"

/**
 * Console sign-in - matched to gurukul admin's landing screen (a full-bleed
 * background behind a glass card), rebuilt on ShipItHQ's own components
 * rather than a second copy of gurukul's: `ShaderHeroBg` (self-hosted WebGL,
 * no loading flash, already the brand's shader background elsewhere) instead
 * of gurukul's hosted video, and `ShipItHQLoader` instead of `GurukulLoader`.
 * See plan/admin/tasks.md ADM-20.
 *
 * One tab, not two: the old "Access Code" tab posted to an unauthenticated
 * route that granted admin access with no rate limit (ADM-2). First-time
 * access is an invitation link (ADM-13), not a code typed in here.
 */
export default function AdminLandingPage() {
    const { data: session, isPending } = useSession()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [redirecting, setRedirecting] = useState(false)
    const [accessDenied, setAccessDenied] = useState(false)

    useEffect(() => {
        if (isPending || !session) return

        // A session cookie alone isn't proof of admin access - `@repo/auth`
        // shares one cookie prefix across every ShipItHQ app, so any signed-in
        // student holds one here too. Redirecting straight to /dashboard on
        // session presence alone was an infinite loop for a non-admin: the
        // console layout would bounce them back to "/", this effect would see
        // their (still valid) session and send them to /dashboard again. Ask
        // the same admin_access question the console layout asks, before
        // deciding where to send them.
        let cancelled = false
        checkAdminAccess().then((result) => {
            if (cancelled) return
            if (result.success) {
                setRedirecting(true)
                window.location.href = "/dashboard"
            } else {
                setAccessDenied(true)
            }
        })
        return () => { cancelled = true }
    }, [isPending, session])

    const handleSignOut = async () => {
        await signOut()
        window.location.href = "/"
    }

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !password) {
            toast.error("Missing credentials", { description: "Please enter your email and password" })
            return
        }
        setIsLoading(true)
        try {
            const { error } = await signIn.email({ email, password, fetchOptions: { throw: false } })
            if (error) {
                toast.error("Sign in failed", { description: "Invalid email or password" })
                setIsLoading(false)
                return
            }
            toast.success("Welcome back!", { description: "Redirecting to the console..." })
            setRedirecting(true)
            window.location.href = "/dashboard"
        } catch {
            toast.error("Sign in failed", { description: "An unexpected error occurred" })
            setIsLoading(false)
        }
    }

    if (isPending || redirecting || (session && !accessDenied)) {
        return <ShipItHQLoader label="Loading" />
    }

    if (accessDenied) {
        return (
            <div className="relative flex h-screen flex-col overflow-hidden bg-neutral-950">
                <ShaderHeroBg
                    colors={SHADER_PALETTES.graphite}
                    className="absolute inset-0 h-full w-full"
                />
                <div aria-hidden className="absolute inset-0 bg-black/55" />
                <main className="relative z-10 flex flex-1 items-center justify-center px-4">
                    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.05] p-8 text-center backdrop-blur-[12px]">
                        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06]">
                            <ShieldAlert className="h-5 w-5 text-white/70" />
                        </div>
                        <h1 className="mb-1.5 text-xl font-semibold tracking-tight text-white">No console access</h1>
                        <p className="mb-6 text-[14px] text-white/50">
                            This account does not have access to the ShipItHQ admin console. If you were expecting
                            access, ask a Super Admin to send you an invitation.
                        </p>
                        <button
                            type="button"
                            onClick={handleSignOut}
                            className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-neutral-600 to-neutral-300 text-sm font-semibold text-neutral-950 transition-all hover:brightness-110"
                        >
                            Sign out
                        </button>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="relative flex h-screen flex-col overflow-hidden bg-neutral-950">
            <ShaderHeroBg
                colors={SHADER_PALETTES.graphite}
                className="absolute inset-0 h-full w-full"
            />
            <div aria-hidden className="absolute inset-0 bg-black/55" />

            <header className="relative z-10 flex flex-shrink-0 items-center justify-between px-6 pt-6 lg:px-8">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md bg-white/10">
                        <Logo className="h-[18px] w-[18px] text-white" />
                    </span>
                    <div className="leading-none">
                        <div className="text-[15px] font-semibold tracking-tight text-white">ShipItHQ</div>
                        <div className="mt-0.5 font-mono text-[12px] uppercase tracking-[0.12em] text-white/70">
                            Admin Portal
                        </div>
                    </div>
                </div>
                <span className="hidden items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.12em] text-white/70 sm:flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
                    System Operational
                </span>
            </header>

            <main className="relative z-10 flex flex-1 items-center justify-center px-4">
                <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.05] p-8 backdrop-blur-[12px]">
                    <div className="mb-8 flex items-center gap-3">
                        <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg bg-white/10">
                            <Logo className="h-[23px] w-[23px] text-white" />
                        </span>
                        <div className="leading-none">
                            <div className="text-[15px] font-semibold tracking-tight text-white">ShipItHQ Admin</div>
                            <div className="mt-0.5 font-mono text-[12px] uppercase tracking-[0.18em] text-neutral-400">
                                Administration
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h1 className="mb-1.5 text-2xl font-semibold tracking-tight text-white">Sign in to admin</h1>
                        <p className="text-[14px] text-white/50">
                            Internal platform for the ShipItHQ team. Authorized personnel only.
                        </p>
                    </div>

                    <form onSubmit={handleSignIn} className="space-y-5">
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="text-xs font-medium uppercase tracking-[0.1em] text-white/40">
                                Email address
                            </label>
                            <div className="relative">
                                <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@shipithq.com"
                                    autoFocus
                                    required
                                    className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-white/30 focus:border-neutral-400 focus:ring-2 focus:ring-white/10"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="password" className="text-xs font-medium uppercase tracking-[0.1em] text-white/40">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] pl-10 pr-10 text-sm text-white outline-none transition-all placeholder:text-white/30 focus:border-neutral-400 focus:ring-2 focus:ring-white/10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((s) => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-white/30 transition-colors hover:text-white/60"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-neutral-600 to-neutral-300 text-sm font-semibold text-neutral-950 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <InlineLoader size="sm" label="Signing in" /> Signing in...
                                </>
                            ) : (
                                <>
                                    Sign In <ArrowRight size={15} />
                                </>
                            )}
                        </button>

                        <div className="flex items-start gap-2 pt-1 text-[12px] text-white/40">
                            <Info size={13} className="mt-0.5 shrink-0" />
                            <span>First-time access? Use the invitation link sent to your email.</span>
                        </div>
                    </form>

                    <div className="mt-6 flex items-center justify-between font-mono text-[12px] uppercase tracking-[0.12em] text-white/20">
                        <span className="flex items-center gap-1.5">
                            <Shield size={12} /> Encrypted session
                        </span>
                        <span className="tracking-normal normal-case">ShipItHQ</span>
                    </div>
                </div>
            </main>

            <div className="relative z-10 flex flex-shrink-0 items-center justify-between px-6 py-5 font-mono text-[12px] uppercase tracking-[0.12em] text-white/50 lg:px-8">
                <span>ShipItHQ Admin</span>
                <span className="hidden md:inline">Protected area. Unauthorized access is prohibited.</span>
            </div>
        </div>
    )
}
