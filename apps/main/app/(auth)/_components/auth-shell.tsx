"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Logo } from "@repo/ui/components/logo"
import Link from "next/link"
import { ThemeToggle } from "@repo/ui/components/themetoggle"
import { AuthVisual } from "@repo/ui/components/auth-visual"
import { AuthBackdropMobile, AuthBackdropPanel, AuthBackdropSurround } from "./auth-backdrop"
import { copyForPath } from "./auth-copy"

/**
 * The two-column shell every auth screen sits in.
 *
 * Rendered by `(auth)/layout.tsx`, NOT by each page. That is deliberate and it is
 * the fix for the flicker: a layout persists across navigation inside its segment,
 * a page does not. Going from /signin to /register used to unmount the brand
 * panel, its background image and its entrance animation and mount a fresh one -
 * so the artwork blinked, the photo re-decoded and the stagger replayed on every
 * link. Now only the form column swaps, and the panel's copy cross-fades in place.
 *
 * Capped at `max-w-7xl` and centred, so on a wide monitor the form does not sit
 * a third of a metre from the brand panel. Below xl the card goes full-bleed -
 * rounding and insetting a shell that already fills the viewport just wastes
 * vertical space on the screens with least of it.
 *
 * Both columns are full height and the right column scrolls internally. That is
 * the point: sign-in swaps between password / magic-link / verify modes, and
 * those three have different heights. With an auto-height shell the panels
 * resized on every switch and the brand column visibly jumped.
 *
 * ── The brand panel is LIGHT in both themes ──
 * It was `bg-neutral-950` with white type. The photographic panel behind it reads
 * light, so white-on-light left the headline all but invisible - see the
 * screenshot that prompted this. The panel is now explicitly a light surface in
 * BOTH themes and every piece of type on it is near-black. A constant surface
 * needs constant ink; `dark:` variants on text sitting over a theme-independent
 * photo is what produced the invisible text in the first place.
 *
 * ── Backdrop ──
 * See `auth-backdrop.tsx` for why it is three layers. The form card stays OPAQUE:
 * frosting it over the photo drops `text-neutral-500` help text under 4.5:1
 * against the light parts of the image, and it fails exactly where reading matters
 * most.
 */
export function AuthShell({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const { variant, headline, sub, quote } = copyForPath(pathname)

    return (
        <div className="relative flex h-screen w-full justify-center overflow-hidden bg-neutral-100 dark:bg-neutral-900 xl:p-6">
            <AuthBackdropSurround />

            {/* `relative` so the card stacks above the backdrop. The shadow is
                heavier at xl than a flat `shadow-sm`, because a card floating on a
                photograph needs to look like it is floating. */}
            <div className="relative flex h-full w-full max-w-7xl overflow-hidden bg-white ring-neutral-200 xl:rounded-3xl xl:shadow-2xl xl:shadow-neutral-900/10 xl:ring-1 dark:bg-neutral-950 dark:ring-neutral-800 dark:xl:shadow-black/40">
                {/* ── Brand column. Light in both themes; see the note above. ── */}
                <aside className="relative hidden h-full w-1/2 flex-col overflow-hidden bg-neutral-100 p-10 lg:flex xl:p-12">
                    <AuthBackdropPanel />

                    {/* A soft wash at the foot of the panel, under the artwork rather
                        than under the copy - it settles the photo without lifting the
                        headline's background toward the text colour. */}
                    <div
                        aria-hidden
                        className="absolute inset-x-0 bottom-0 h-2/3"
                        style={{
                            background:
                                "radial-gradient(60% 60% at 50% 70%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.2) 45%, transparent 75%)",
                        }}
                    />

                    <Link href="/" className="relative z-10 flex w-fit shrink-0 items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900/10 ring-1 ring-neutral-900/15">
                            <Logo className="h-5 w-5 text-neutral-900 dark:text-neutral-100" />
                        </span>
                        <span className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">ShipItHQ</span>
                    </Link>

                    {/* Copy block - high in the panel, left aligned. Keyed on the
                        pathname so React cross-fades the text when the route changes
                        instead of the browser repainting the whole panel. */}
                    <div key={pathname} className="relative z-10 mt-10 max-w-sm shrink-0 xl:mt-12 xl:max-w-md">
                        {/* Each line enters a beat after the one above it. The
                            wrapper used to animate as a single block, which is what
                            made the change feel abrupt - the whole panel's text
                            appeared at once rather than composing itself. */}
                        <h2
                            className="auth-copy-enter text-3xl font-bold leading-tight tracking-tight text-neutral-900 dark:text-neutral-100 xl:text-4xl"
                            style={{ ["--enter-delay" as string]: "0ms" }}
                        >
                            {headline}
                        </h2>
                        {sub && (
                            <p
                                className="auth-copy-enter mt-4 text-base leading-relaxed text-neutral-700 dark:text-neutral-300"
                                style={{ ["--enter-delay" as string]: "70ms" }}
                            >
                                {sub}
                            </p>
                        )}
                        {quote && (
                            <p
                                className="auth-copy-enter mt-6 border-l border-neutral-900/20 pl-4 text-sm italic leading-relaxed text-neutral-600"
                                style={{ ["--enter-delay" as string]: "140ms" }}
                            >
                                {quote}
                            </p>
                        )}
                    </div>

                    {/* Artwork - takes whatever height is left under the copy. `min-h-0`
                        lets it shrink inside the flex column on short viewports rather
                        than pushing the footer off the bottom. */}
                    <div className="relative z-0 flex min-h-0 flex-1 items-center justify-center py-6">
                        {/* Wrapped rather than styled directly: AuthVisual takes only
                            `variant` and `className`, and the delay has to ride on a
                            custom property. */}
                        <div
                            key={variant}
                            className="auth-art-enter flex h-full w-full items-center justify-center"
                            style={{ ["--enter-delay" as string]: "180ms" }}
                        >
                            <AuthVisual
                                variant={variant}
                                className="h-full max-h-[340px] w-full max-w-[420px] text-neutral-900 dark:text-neutral-100/70"
                            />
                        </div>
                    </div>

                    <div className="relative z-10 flex shrink-0 items-center justify-between">
                        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-600">
                            Learn · Build · Get hired
                        </p>
                        <ThemeToggle />
                    </div>
                </aside>

                {/* ── Form column. Scrolls internally so the shell never grows. ── */}
                <main className="relative flex h-full w-full flex-col overflow-y-auto lg:w-1/2">
                    <AuthBackdropMobile />

                    <div className="relative flex min-h-full items-center justify-center px-6 py-10 sm:px-10">
                        <div className="w-full max-w-md">
                            {/* Mobile brand + theme toggle - the aside is hidden below lg. */}
                            <div className="mb-8 flex items-center justify-between lg:hidden">
                                <Link href="/" className="flex items-center gap-2">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 dark:bg-white">
                                        <Logo className="h-[17px] w-[17px] text-white dark:text-neutral-900" />
                                    </span>
                                    <span className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
                                        ShipItHQ
                                    </span>
                                </Link>
                                <ThemeToggle />
                            </div>

                            {/* Keyed on the route so the form fades in on navigation.
                                Done in CSS so a screen does not pull framer-motion in
                                just to fade its form - see .auth-enter in globals.css. */}
                            <div key={pathname} className="auth-enter">{children}</div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default AuthShell
