"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

/**
 * Mounts its children only once they come near the viewport.
 *
 * `dynamic()` splits a section into its own chunk but does NOT defer it: React still
 * renders the component on mount, so the chunk is fetched and executed immediately
 * after hydration. On a landing page that means every below-the-fold section's
 * JavaScript runs during load - which is how the reference site reached 4.8s mobile
 * bootup and 7.7s Total Blocking Time while its LCP and CLS were fine.
 *
 * ── Read this before wrapping anything ──
 *
 * ONLY use this around a section that is genuinely client-only and carries no
 * indexable text. Wrapping a server-rendered section pulls its markup out of the
 * initial HTML and costs real SEO, which is a far worse trade than the JavaScript it
 * saves. The sections worth wrapping are the ones that are heavy AND decorative;
 * the ones that carry the argument should stay in the HTML.
 *
 * `rootMargin` starts the load before the section is visible, so the placeholder is
 * swapped out ahead of the reader rather than popping in under them.
 */
export function LazyMount({
    children,
    placeholder,
    rootMargin = "600px",
}: {
    children: ReactNode
    /**
     * Rendered until the section is approached. MUST reserve the same height.
     *
     * A placeholder of the wrong height turns a performance fix into a CLS
     * regression - the page jumps at the moment the real section mounts, which is
     * exactly the failure the reveal work is trying to avoid.
     */
    placeholder: ReactNode
    rootMargin?: string
}) {
    const ref = useRef<HTMLDivElement>(null)
    const [show, setShow] = useState(false)

    useEffect(() => {
        if (show) return
        // No IntersectionObserver (a very old browser, or a crawler): render
        // immediately rather than leaving a permanent placeholder.
        if (typeof IntersectionObserver === "undefined") {
            setShow(true)
            return
        }

        const el = ref.current
        if (!el) return
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setShow(true)
                    io.disconnect()
                }
            },
            { rootMargin },
        )
        io.observe(el)
        return () => io.disconnect()
    }, [show, rootMargin])

    // min-w-0 so a wide child shrinks with the column rather than pushing the page
    // sideways once it mounts.
    return <div ref={ref} className="min-w-0">{show ? children : placeholder}</div>
}

export default LazyMount
