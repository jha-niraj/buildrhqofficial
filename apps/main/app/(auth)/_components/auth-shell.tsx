"use client"

import type { ReactNode } from "react"
import { Logo } from "@repo/ui/components/logo"
import Link from "next/link"
import { ThemeToggle } from "@repo/ui/components/themetoggle"
import { AuthVisual, type AuthVisualVariant } from "@repo/ui/components/auth-visual"
import { AuthBackdropMobile, AuthBackdropPanel, AuthBackdropSurround } from "./auth-backdrop"

/**
 * The two-column shell every auth screen sits in.
 *
 * Capped at `max-w-7xl` and centred, so on a wide monitor the form does not sit
 * a third of a metre from the brand panel. Below xl the card goes full-bleed -
 * rounding and insetting a shell that already fills the viewport just wastes
 * vertical space on the screens with least of it.
 *
 * Both columns are full height and the right column scrolls internally. That is
 * the whole point: sign-in swaps between password / magic-link / verify modes,
 * and those three have different heights. With an auto-height shell the panels
 * resized on every switch and the brand column visibly jumped. Pinning the
 * height means the layout is identical in all three modes and only the form
 * content changes.
 *
 * ── Brand column layout ──
 * The artwork used to be absolutely positioned across the whole panel, so its
 * wires ran straight underneath the headline and the two fought each other - a
 * gradient mask was papering over the overlap rather than removing it. It is now
 * an ordinary flex child BELOW the copy, so the two cannot collide at any
 * viewport size and no mask is needed.
 *
 * Reading order, top to bottom: brand → headline → artwork → footer. The copy
 * sits high, where the eye lands first; the artwork fills whatever is left
 * instead of competing for the same space.
 *
 * `variant` selects the motif, so no two auth screens show the same picture.
 *
 * ── Backdrop ──
 * A photographic backdrop sits under all of it - see `auth-backdrop.tsx` for why
 * it is three layers rather than one. The card itself stays OPAQUE. Frosting it
 * over the photo was the obvious move and the wrong one: `text-neutral-500` help
 * text over a translucent panel drops under 4.5:1 against the light parts of the
 * image, and it fails in exactly the place that matters least to look at and most
 * to read.
 */
export function AuthShell({
    children,
    headline,
    sub,
    quote,
    variant = "contributions",
}: {
    children: ReactNode
    headline: ReactNode
    sub?: string
    quote?: string
    variant?: AuthVisualVariant
}) {
    return (
        <div className="relative flex h-screen w-full justify-center overflow-hidden bg-neutral-100 dark:bg-neutral-900 xl:p-6">
            <AuthBackdropSurround />

            {/* `relative` so the card stacks above the backdrop. The shadow is
                heavier at xl than the flat `shadow-sm` it replaced, because a card
                floating on a photograph needs to look like it is floating. */}
            <div className="relative flex h-full w-full max-w-7xl overflow-hidden bg-white ring-neutral-200 xl:rounded-3xl xl:shadow-2xl xl:shadow-neutral-900/10 xl:ring-1 dark:bg-neutral-950 dark:ring-neutral-800 dark:xl:shadow-black/40">
                {/* ── Brand column ── */}
                <aside className="auth-stagger relative hidden h-full w-1/2 flex-col overflow-hidden bg-neutral-950 p-10 lg:flex xl:p-12">
                    <AuthBackdropPanel />

                    {/* A soft glow low in the panel, sitting under the artwork rather
                        than under the copy - it lifts the shape off the flat black
                        without washing out the headline above it. */}
                    <div
                        aria-hidden
                        className="absolute inset-x-0 bottom-0 h-2/3"
                        style={{
                            background:
                                "radial-gradient(60% 60% at 50% 70%, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 45%, transparent 75%)",
                        }}
                    />

                    <Link href="/" className="relative z-10 flex w-fit shrink-0 items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                            <Logo className="h-5 w-5 text-white" />
                        </span>
                        <span className="text-lg font-semibold tracking-tight text-white">ShipItHQ</span>
                    </Link>

                    {/* Copy block - high in the panel, left aligned. */}
                    <div className="relative z-10 mt-10 max-w-sm shrink-0 xl:mt-12 xl:max-w-md">
                        <h2 className="text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
                            {headline}
                        </h2>
                        {sub && <p className="mt-4 text-base leading-relaxed text-white/55">{sub}</p>}
                        {quote && (
                            <p className="mt-6 border-l border-white/15 pl-4 text-sm italic leading-relaxed text-white/45">
                                {quote}
                            </p>
                        )}
                    </div>

                    {/* Artwork - takes whatever height is left under the copy. `min-h-0`
                        is what lets it shrink inside the flex column on short viewports
                        rather than pushing the footer off the bottom. */}
                    <div className="relative z-0 flex min-h-0 flex-1 items-center justify-center py-6">
                        <AuthVisual
                            variant={variant}
                            className="h-full max-h-[340px] w-full max-w-[420px] text-white/85"
                        />
                    </div>

                    <div className="relative z-10 flex shrink-0 items-center justify-between">
                        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/35">
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

                            {/* Entrance for whatever the screen renders. Done in CSS so a
                                screen does not have to pull framer-motion in just to fade
                                its form in - see the .auth-enter note in globals.css. */}
                            <div className="auth-enter">{children}</div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default AuthShell
