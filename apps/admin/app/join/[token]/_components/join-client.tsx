"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "@repo/auth/client"
import { toast } from "@repo/ui/components/ui/sonner"
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"
import { Input } from '@repo/ui/components/ui/input'
import { User, Lock, Eye, EyeOff, ArrowRight } from "lucide-react"
import { acceptAdminInvitation, type InvitationPreview } from "@/actions/invitations.action"
import { formatAdminRole } from "@/lib/role-labels"

export function JoinClient({ token, invitation }: { token: string; invitation: InvitationPreview }) {
    const router = useRouter()
    const [name, setName] = useState(invitation.name ?? "")
    const [password, setPassword] = useState("")
    const [confirm, setConfirm] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password.length < 8) {
            toast.error("Password must be at least 8 characters")
            return
        }
        if (password !== confirm) {
            toast.error("Passwords do not match")
            return
        }

        setIsLoading(true)
        try {
            const result = await acceptAdminInvitation(token, password, name)
            if (!result.success) {
                toast.error(result.error)
                setIsLoading(false)
                return
            }

            const { error } = await signIn.email({ email: invitation.email, password, fetchOptions: { throw: false } })
            if (error) {
                toast.success("Account created - sign in with your new password.")
                router.push("/")
                return
            }

            toast.success("Welcome to the console!")
            router.push("/dashboard")
        } catch {
            toast.error("Something went wrong. Please try again.")
            setIsLoading(false)
        }
    }

    return (
        <>
            <div className="mb-6 space-y-1.5">
                <h1 className="text-2xl font-semibold tracking-tight text-white">You&apos;ve been invited</h1>
                <p className="text-[14px] text-white/50">
                    {invitation.invitedByName ? `${invitation.invitedByName} invited you` : "You've been invited"} to
                    join ShipItHQ admin as a{" "}
                    <span className="text-white/80">{formatAdminRole(invitation.adminRole)}</span>.
                </p>
                <p className="text-[13px] text-white/40">{invitation.email}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                    <label htmlFor="name" className="text-xs font-medium uppercase tracking-[0.1em] text-white/40">
                        Your name
                    </label>
                    <div className="relative">
                        <User size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Jane Doe"
                            required
                            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-white/30 focus:border-neutral-400 focus:ring-2 focus:ring-white/10"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="password" className="text-xs font-medium uppercase tracking-[0.1em] text-white/40">
                        Set a password
                    </label>
                    <div className="relative">
                        <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="At least 8 characters"
                            required
                            minLength={8}
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

                <div className="space-y-1.5">
                    <label htmlFor="confirm" className="text-xs font-medium uppercase tracking-[0.1em] text-white/40">
                        Confirm password
                    </label>
                    <div className="relative">
                        <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <Input
                            id="confirm"
                            type={showPassword ? "text" : "password"}
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder="Re-enter your password"
                            required
                            minLength={8}
                            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-white/30 focus:border-neutral-400 focus:ring-2 focus:ring-white/10"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-neutral-600 to-neutral-300 text-sm font-semibold text-neutral-950 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isLoading ? (
                        <>
                            <InlineLoader size="sm" label="Setting up your account" /> Setting up...
                        </>
                    ) : (
                        <>
                            Accept &amp; join <ArrowRight size={15} />
                        </>
                    )}
                </button>
            </form>
        </>
    )
}

export default JoinClient
