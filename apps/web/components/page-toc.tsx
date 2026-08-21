"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

/**
 * A sticky table of contents that knows where you are.
 *
 * ── This reverses an earlier decision, and the earlier one was wrong ──
 *
 * The features page shipped with a CSS-only index and a comment saying a scrollspy "would
 * cost a client component on a page whose whole argument is that the product is fast".
 *
 * That traded the wrong thing. A table of contents exists to answer two questions - what is
 * on this page, and where am I in it - and without an active state it answers only the
 * first. The second is most of why anyone looks at the sidebar rather than scrolling. A few
 * kilobytes for a control that does its job is a trade worth making; the budget exists to
 * stop decoration, not to stop functionality.
 *
 * ── One observer, not a scroll handler ──
 *
 * A `scroll` listener fires on every frame and has to be throttled, and the throttling is
 * where the bugs live. One `IntersectionObserver` with a detection band does the same job
 * and only wakes when a boundary is crossed.
 *
 * ── The band, and why it is asymmetric ──
 *
 * `rootMargin: -120px 0px -55% 0px` shrinks the viewport to a strip that starts just below
 * the floating navbar (its height plus its offset, matching the `scroll-mt-28` on each
 * section) and ends a little above the middle. A section is "current" while its box crosses
 * that strip.
 *
 * The bottom inset is what stops the last two sections fighting: with a full-height root,
 * a tall section and a short one below it are both intersecting for most of the scroll, and
 * whichever the browser reports last wins - which looks like flicker.
 *
 * ── The bottom of the page needs its own answer ──
 *
 * The final section is often shorter than the band, so it can never fill it, and scrolling
 * to the very bottom would leave the second-to-last item highlighted. `atBottom` handles
 * that explicitly rather than hoping the observer covers it.
 */

export interface TocItem {
    id: string
    label: string
}

/** Matches `scroll-mt-28` (7rem) on the sections, plus a little breathing room. */
const TOP_OFFSET_PX = 120

export function PageToc({
    items,
    title = "On this page",
    className = "",
}: {
    items: readonly TocItem[]
    title?: string
    className?: string
}) {
    const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "")

    // Depend on the id STRING, not the array. `items` is a fresh array literal on every
    // parent render, so an `[items]` dependency would tear down and rebuild the observer on
    // each one. It happens to be stable today because the only caller is a server component,
    // which is exactly the kind of accident that breaks the first time somebody uses this
    // from a client page.
    const key = items.map((i) => i.id).join(",")

    useEffect(() => {
        if (typeof IntersectionObserver === "undefined") return

        const sections = items
            .map((i) => document.getElementById(i.id))
            .filter((el): el is HTMLElement => el !== null)
        if (sections.length === 0) return

        // Which sections currently cross the band, in document order.
        const visible = new Set<string>()

        const pick = () => {
            // At the very bottom, the last item wins regardless - see the note above.
            const atBottom =
                window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
            if (atBottom) {
                const last = items[items.length - 1]
                if (last) setActiveId(last.id)
                return
            }
            const first = items.find((i) => visible.has(i.id))
            if (first) setActiveId(first.id)
        }

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) visible.add(entry.target.id)
                    else visible.delete(entry.target.id)
                }
                pick()
            },
            { rootMargin: `-${TOP_OFFSET_PX}px 0px -55% 0px`, threshold: 0 },
        )

        sections.forEach((el) => observer.observe(el))

        // The bottom case is not a boundary crossing, so the observer never fires for it.
        window.addEventListener("scroll", pick, { passive: true })

        // Arriving on `/features#projects` should highlight that row before any scrolling.
        const hash = window.location.hash.slice(1)
        if (hash && items.some((i) => i.id === hash)) setActiveId(hash)

        return () => {
            observer.disconnect()
            window.removeEventListener("scroll", pick)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key])

    return (
        <nav aria-label={title} className={className}>
            <div className="sticky top-28">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                    {title}
                </p>
                <ul className="space-y-1 border-l border-neutral-200 dark:border-neutral-800">
                    {items.map((item) => {
                        const active = item.id === activeId
                        return (
                            <li key={item.id}>
                                <Link
                                    href={`#${item.id}`}
                                    // aria-current so a screen reader gets the same
                                    // information the highlight gives a sighted reader.
                                    aria-current={active ? "true" : undefined}
                                    // Clicking sets it immediately rather than waiting for
                                    // the smooth scroll to cross a boundary, which on a long
                                    // jump is most of a second of the wrong row highlighted.
                                    onClick={() => setActiveId(item.id)}
                                    className={`-ml-px block border-l py-1.5 pl-4 text-sm transition-colors ${
                                        active
                                            ? "border-neutral-900 font-medium text-neutral-900 dark:border-white dark:text-white"
                                            : "border-transparent text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-white"
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </nav>
    )
}

export default PageToc
