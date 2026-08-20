import type { ReactNode } from "react"
import { AuthShell } from "../_components/auth-shell"

/**
 * The two-column shell, rendered HERE rather than by each page.
 *
 * A layout persists across navigation within its segment; a page is unmounted and
 * remounted. With the shell inside each page, moving from /signin to /register
 * tore down the brand panel, its background image and its entrance animation and
 * built a fresh one - the artwork blinked, the photo re-decoded and the stagger
 * replayed on every link. Hoisting it here means only the form column changes.
 *
 * The panel's copy still varies per route; it comes from `auth-copy.tsx`, keyed on
 * the pathname, and cross-fades in place.
 *
 * ── Why a `(shell)` route group ──
 * `/onboarding` and `/error` are also auth routes but own their full-page layouts
 * (the Typeform flow, a centred error card) and must NOT be boxed into two
 * columns. A route group is how App Router says "these siblings share chrome and
 * those do not" - it adds no path segment, so every URL is unchanged.
 */
export default function AuthShellLayout({ children }: { children: ReactNode }) {
    return <AuthShell>{children}</AuthShell>
}
