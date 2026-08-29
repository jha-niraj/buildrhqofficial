"use client"

import { useEffect, useRef } from "react"

/**
 * Publishes the jobs header's real height as `--jobs-header-h`.
 *
 * ── Why this exists instead of a number ──────────────────────────────────────
 * The browse page pins a control bar directly beneath the shell header, and a
 * second sticky element has to know how tall the first one is. That offset was
 * written by hand twice - `top-[89px]`, then `top-[85px]` - and both were wrong,
 * because the header's height is `p-4` / `lg:p-6` plus a title that changes size
 * at `lg`. There is no single correct constant; there are two, and neither was
 * the one in the class.
 *
 * A wrong offset here does not fail loudly. The bar parks a few pixels under the
 * header and reads as "stacked to the top without space", which is exactly what
 * Niraj saw - and it changes again the moment anyone edits the header's padding
 * or copy.
 *
 * So the header measures itself. `ResizeObserver` rather than a one-off read,
 * because the height changes at the `lg` breakpoint and when the subtitle wraps.
 *
 * The variable is set on `<html>` rather than on a wrapper: the sticky bar lives
 * in a different route file, and inheritance through the tree between them is
 * the thing that keeps breaking.
 */
export function JobsHeaderOffset({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        const publish = () => {
            const h = Math.round(el.getBoundingClientRect().height)
            // A ZERO measurement is never published.
            //
            // `ResizeObserver` fires on the first observe, and an element that has
            // not been laid out yet - a background tab, a hydration frame, a parent
            // still `display: none` - measures 0. Writing `--jobs-header-h: 0px`
            // would pin the browse toolbar to the very top of the scroller, which is
            // precisely the bug this file exists to prevent, and it would beat the
            // sensible `96px` fallback in the consuming class.
            //
            // Keeping the previous value (or none at all) is always better than
            // publishing a measurement taken of nothing.
            if (h > 0) {
                document.documentElement.style.setProperty("--jobs-header-h", `${h}px`)
            }
        }

        publish()
        const ro = new ResizeObserver(publish)
        ro.observe(el)
        return () => {
            ro.disconnect()
            document.documentElement.style.removeProperty("--jobs-header-h")
        }
    }, [])

    return (
        <div ref={ref} className="sticky top-0 z-20 border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
            {children}
        </div>
    )
}
