import type { ReactNode } from "react"
import type { AuthVisualVariant } from "@repo/ui/components/auth-visual"

// ─────────────────────────────────────────────────────────────────────────────
// What the brand panel says on each auth route.
//
// It lives here, keyed by pathname, rather than as props on each page, because
// the panel is rendered by the LAYOUT now. A layout persists across navigation
// within its segment; a page does not. That is the whole fix for the flicker:
// moving from /signin to /register used to unmount the panel, its background
// image and its entrance animation, and mount a fresh one - so the artwork blinked
// and the stagger replayed every single time.
//
// The copy still changes per route. Only the DOM around it survives.
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthCopy {
    variant: AuthVisualVariant
    headline: ReactNode
    sub: string
    quote: string
}

/** Muted half of a headline. Dark, because the panel is light in both themes. */
function Muted({ children }: { children: ReactNode }) {
    return <span className="text-neutral-900/45">{children}</span>
}

const COPY: Record<string, AuthCopy> = {
    "/signin": {
        variant: "contributions",
        headline: (
            <>
                Build projects. Crack interviews. <Muted>Land the job.</Muted>
            </>
        ),
        sub: "Sign in to pick up where you left off.",
        quote: "Every expert was once a beginner. Start your journey today.",
    },
    "/register": {
        variant: "commit-graph",
        headline: (
            <>
                Join the <Muted>community</Muted>.
            </>
        ),
        sub: "Build projects, learn from peers, and grow your skills with thousands of developers.",
        quote: "Every expert was once a beginner.",
    },
    "/forgotpassword": {
        variant: "otp-mail",
        headline: (
            <>
                Locked out? <Muted>Happens.</Muted>
            </>
        ),
        sub: "Enter the address you signed up with and we'll send a six-digit code.",
        quote: "Resetting a password is not a setback - it is a two-minute detour.",
    },
    "/resetpassword": {
        variant: "shield",
        headline: (
            <>
                Set a new <Muted>password</Muted>.
            </>
        ),
        sub: "Enter the code we emailed you, then choose something you have not used before.",
        quote: "A password you can remember beats a clever one you cannot.",
    },
}

/** Sign-in's copy is the fallback: it is the route people arrive on. */
export function copyForPath(pathname: string): AuthCopy {
    return COPY[pathname] ?? COPY["/signin"]!
}
