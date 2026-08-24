import { Shield } from "lucide-react"
import { ShaderHeroBg, SHADER_PALETTES } from "@repo/ui/components/hero-shader-bg"
import { Logo } from "@repo/ui/components/logo"
import { getInvitationByCode } from "@/actions/invitations.action"
import { JoinClient } from "./_components/join-client"

/**
 * Invitation-accept flow (ADM-13). This is the ONLY way to become an admin -
 * the old /api/auth/verify-access-code route and the sign-in screen's access-
 * code tab granted admin access with no rate limit and no atomicity (ADM-2);
 * this replaces both. A server component so an invalid/expired/used code
 * never even reaches the client - see plan/admin/tasks.md.
 */
export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params
    const result = await getInvitationByCode(token)

    return (
        <div className="relative flex h-screen flex-col overflow-hidden bg-neutral-950">
            <ShaderHeroBg colors={SHADER_PALETTES.graphite} className="absolute inset-0 h-full w-full" />
            <div aria-hidden className="absolute inset-0 bg-black/55" />

            <header className="relative z-10 flex flex-shrink-0 items-center gap-2.5 px-6 pt-6 lg:px-8">
                <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md bg-white/10">
                    <Logo className="h-[18px] w-[18px] text-white" />
                </span>
                <div className="leading-none">
                    <div className="text-[15px] font-semibold tracking-tight text-white">ShipItHQ</div>
                    <div className="mt-0.5 font-mono text-[12px] uppercase tracking-[0.12em] text-white/70">
                        Admin Portal
                    </div>
                </div>
            </header>

            <main className="relative z-10 flex flex-1 items-center justify-center px-4">
                <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.05] p-8 backdrop-blur-[12px]">
                    <div className="mb-8 flex items-center gap-3">
                        <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg bg-white/10">
                            <Shield className="h-5 w-5 text-white" />
                        </span>
                        <div className="leading-none">
                            <div className="text-[15px] font-semibold tracking-tight text-white">ShipItHQ Admin</div>
                            <div className="mt-0.5 font-mono text-[12px] uppercase tracking-[0.18em] text-neutral-400">
                                Invitation
                            </div>
                        </div>
                    </div>

                    {result.success ? (
                        <JoinClient token={token} invitation={result.data} />
                    ) : (
                        <div className="space-y-4">
                            <h1 className="text-2xl font-semibold tracking-tight text-white">Invitation not available</h1>
                            <p className="text-[14px] text-white/60">{result.error}</p>
                            <p className="text-[13px] text-white/40">
                                Ask a super admin to send a new invitation, or return to sign in if you already have access.
                            </p>
                            <a
                                href="/"
                                className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-neutral-600 to-neutral-300 text-sm font-semibold text-neutral-950 transition-all hover:brightness-110"
                            >
                                Back to sign in
                            </a>
                        </div>
                    )}
                </div>
            </main>

            <div className="relative z-10 flex flex-shrink-0 items-center justify-between px-6 py-5 font-mono text-[12px] uppercase tracking-[0.12em] text-white/50 lg:px-8">
                <span>ShipItHQ Admin</span>
                <span className="hidden md:inline">Protected area. Unauthorized access is prohibited.</span>
            </div>
        </div>
    )
}
