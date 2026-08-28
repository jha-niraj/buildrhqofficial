"use client"

import * as React from "react"
import { cn } from "../../lib/utils"

/**
 * The small-screen counterpart to the desktop sidebar.
 *
 * ── Why this replaces the hamburger rather than joining it ──
 *
 * On a phone the only way into the app was a button floating over the page content. That
 * made EVERY navigation two taps - open the sheet, pick a link - and put a control on top of
 * whatever it happened to overlap, which on this app was the top-right of the page card. A
 * bottom bar puts the handful of destinations people actually use within thumb reach at one
 * tap, and keeps the full menu one tap away behind "More".
 *
 * The sheet itself is unchanged. "More" opens exactly the sheet the hamburger opened, so
 * nothing is lost - the bar is a shortcut in front of it, not a replacement for it.
 *
 * ── Reserving space ──
 *
 * This is `position: fixed`, so it sits over the page unless the page makes room. The shell
 * does that with `--app-bottom-nav-h`, defined in `globals.css`: the real height below `lg`
 * and `0px` above it, so the same `calc()` works at every width with no breakpoint of its
 * own. Any layout that does not use the shell must subtract it too, or its last row sits
 * under the bar.
 */

/** Height of the row itself. The safe-area inset is added on top of this by the padding. */
export const BOTTOM_NAV_HEIGHT = "4rem"

export type BottomNavItem = {
    label: string
    href: string
    icon: React.ReactNode
    /** Consumers own route matching - they have the pathname and the nav shape. */
    active?: boolean
    /** Optional unread count. Values over 9 render as "9+". */
    badge?: number
}

export type BottomNavCentreAction = {
    label: string
    icon: React.ReactNode
    onClick: () => void
    active?: boolean
}

export function MobileBottomNav({
    items,
    onMore,
    moreActive = false,
    moreLabel = "More",
    centreAction,
    linkComponent: Link = "a",
    className,
}: {
    /** Up to four. Past that the labels stop being readable at 360px. */
    items: BottomNavItem[]
    onMore: () => void
    moreActive?: boolean
    moreLabel?: string
    /**
     * A raised action in the MIDDLE of the bar, between the halves of the link row.
     *
     * The centre of a bottom bar is the easiest point to reach with a thumb on either hand,
     * so it is reserved for the one thing used far more than the rest rather than a fifth
     * destination. It is styled as a filled tile rather than another tab because it is a
     * different KIND of control - it opens a panel over the page, it does not navigate - and
     * looking identical to its neighbours would say otherwise.
     */
    centreAction?: BottomNavCentreAction
    /** `next/link` in an app; a plain `<a>` in isolation or in tests. */
    linkComponent?: React.ElementType
    className?: string
}) {
    // Cast once, here. `React.ElementType` defaulted to the literal "a" narrows its accepted
    // props to `never`, so every attribute below becomes a type error. The component is
    // genuinely polymorphic - next/link in an app, <a> in isolation - and an anchor's own
    // props are exactly the shape both accept.
    const LinkComp = Link as React.ComponentType<
        React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
    >

    const shown = items.slice(0, 4)
    // Split so the action sits in the middle. With four links that is 2 | action | 2.
    const half = Math.ceil(shown.length / 2)
    const leftItems = centreAction ? shown.slice(0, half) : shown
    const rightItems = centreAction ? shown.slice(half) : []

    const renderItems = (list: BottomNavItem[]) =>
        list.map((item) => (
            <LinkComp
                key={item.href}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={cn(
                    // `min-w-0` so the label's `truncate` can actually take effect: a flex item
                    // defaults to `min-width: auto`, which refuses to shrink below its content
                    // and would push the row wider than the screen instead of clipping.
                    // `px-0.5` rather than `px-1`: measured at 320px the row gives each item
                    // 51px, and "Practice" at 11px needs about 46 - the extra 4px of label
                    // width is the difference between the word fitting and being cut.
                    "relative flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 px-0.5 transition-colors",
                    item.active
                        ? "text-neutral-900 dark:text-white"
                        : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200",
                )}
            >
                {/* The active marker is a rule along the top edge rather than a filled pill:
                    at this size a filled background crowds the icon and the label into
                    illegibility. */}
                <span
                    aria-hidden
                    className={cn(
                        "absolute inset-x-3 top-0 h-0.5 rounded-full transition-opacity",
                        item.active ? "bg-neutral-900 opacity-100 dark:bg-white" : "opacity-0",
                    )}
                />
                <span className="relative flex h-5 w-5 items-center justify-center [&_svg]:h-5 [&_svg]:w-5">
                    {item.icon}
                    {!!item.badge && item.badge > 0 && (
                        <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white">
                            {item.badge > 9 ? "9+" : item.badge}
                        </span>
                    )}
                </span>
                <span className="w-full truncate text-center text-xs font-medium leading-none">
                    {item.label}
                </span>
            </LinkComp>
        ))

    return (
        <nav
            aria-label="Primary"
            className={cn(
                // `pb-[env(safe-area-inset-bottom)]` keeps the row clear of the iOS home
                // indicator. Without it the bottom few pixels of every tap target are
                // unreachable on any recent iPhone.
                "fixed inset-x-0 bottom-0 z-50 lg:hidden print:hidden",
                "pb-[env(safe-area-inset-bottom)]",
                "border-t border-neutral-200 bg-white/95 backdrop-blur-sm",
                "dark:border-neutral-800 dark:bg-neutral-950/95",
                className,
            )}
        >
            <div className="flex h-16 items-stretch">
                {/* One renderer for both halves - the centre action splits the row, it does not
                    create a second kind of tab. */}
                {renderItems(leftItems)}

                {centreAction && (
                    <div className="flex w-16 shrink-0 items-center justify-center">
                        {/* Sits IN the bar, not lifted above it.
                            A circle raised into a notch cut through the bar's top edge is the
                            familiar shape, and it is two arcs of different radii meeting a
                            straight border - a lot of geometry to align, and it reads as a
                            stray arc beside a stark puck when any of it is off. A rounded tile
                            inside the row is the same emphasis with nothing to misalign, and it
                            does not fight the flat icons either side of it. */}
                        <button
                            type="button"
                            onClick={centreAction.onClick}
                            aria-label={centreAction.label}
                            aria-pressed={centreAction.active}
                            className={cn(
                                "flex h-11 w-12 cursor-pointer items-center justify-center rounded-2xl",
                                "transition-colors active:scale-95",
                                // Neutral, like every other control here. The emphasis comes from
                                // the filled tile, not from a colour competing with the page.
                                "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900",
                                centreAction.active && "bg-neutral-700 dark:bg-neutral-200",
                                "[&_svg]:h-5 [&_svg]:w-5",
                            )}
                        >
                            {centreAction.icon}
                        </button>
                    </div>
                )}

                {renderItems(rightItems)}

                <button
                    type="button"
                    onClick={onMore}
                    aria-label={`${moreLabel} - open the full menu`}
                    className={cn(
                        "relative flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 px-0.5 transition-colors",
                        moreActive
                            ? "text-neutral-900 dark:text-white"
                            : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200",
                    )}
                >
                    <span className="flex h-5 w-5 items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </span>
                    <span className="w-full truncate text-center text-xs font-medium leading-none">
                        {moreLabel}
                    </span>
                </button>
            </div>
        </nav>
    )
}
