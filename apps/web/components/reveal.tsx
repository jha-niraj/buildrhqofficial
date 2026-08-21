import type { CSSProperties, ReactNode } from "react"

// The one scroll-entrance primitive for the marketing site.
//
// ── This component ships NO JavaScript ──
//
// It renders a plain element carrying `sh-reveal`. The transition lives in
// `@repo/ui/styles/globals.css` and the class is flipped by the single site-wide
// observer in `reveal-observer.tsx`, mounted once in the root layout. A page can
// hold fifty of these and still pay for exactly one observer and one client
// component.
//
// It used to be a framer-motion client component, one per revealed block. That was
// a nicer API and the wrong trade for a marketing site, where the Lighthouse score
// is decided by main-thread JavaScript rather than by bytes - the reference site
// measured 7,680ms mobile TBT before making this same change. Fifty blocks meant
// fifty client components, fifty viewport effects and the motion runtime.
//
// Being a SERVER component matters twice over: the blog article, the topic hubs and
// the legal pages are statically generated on purpose, and this no longer drags
// them across a client boundary - their content stays in the initial HTML for
// crawlers.
//
// ── `sh-reveal` works without this wrapper ──
//
// The observer looks for the CLASS, not for this component. Where a suitable
// element already exists - a section's inner container, a card - put `sh-reveal`
// straight on it rather than wrapping. That avoids introducing a div between a grid
// and its items, which is the one way this can break a layout.
//
// Reduced motion is handled entirely in CSS, so there is no preference
// subscription anywhere.

/** `--sh-reveal-delay` is a custom property, which CSSProperties does not model. */
type RevealStyle = CSSProperties & { "--sh-reveal-delay": string }

/** Inline style that staggers an `sh-reveal` element. Use it to ripple a row of cards. */
export function revealDelay(seconds: number): RevealStyle {
    return { "--sh-reveal-delay": `${seconds}s` }
}

export interface RevealProps {
    children: ReactNode
    /** Seconds to wait before this element starts. Use to cascade siblings. */
    delay?: number
    className?: string
    as?: "div" | "section" | "li"
    /**
     * Fade only, never translate.
     *
     * Required when the subtree contains a `position: sticky` or `position: fixed`
     * element: a transformed ancestor becomes their containing block, so a sticky
     * child stops sticking and a fixed child stops tracking the viewport.
     */
    fadeOnly?: boolean
    /**
     * Put an id on the revealed element itself.
     *
     * Added so a section can be both the scroll anchor AND the thing an observer watches.
     * The features page used to carry a separate zero-height `<div id>` inside each
     * section, which works as an anchor and is useless to an IntersectionObserver - a
     * element with no height never meaningfully intersects anything.
     */
    id?: string
}

export function Reveal({ children, delay = 0, className = "", as = "div", fadeOnly = false, id }: RevealProps) {
    const props = {
        id,
        // `sh-reveal-fade` drops the translate but keeps the opacity transition.
        className: `sh-reveal${fadeOnly ? " sh-reveal-fade" : ""} ${className}`.trim(),
        style: delay ? revealDelay(delay) : undefined,
    }

    if (as === "section") return <section {...props}>{children}</section>
    if (as === "li") return <li {...props}>{children}</li>
    return <div {...props}>{children}</div>
}

/**
 * Wrap a list whose items should cascade.
 *
 * The parent is a plain element - the stagger is per-item `--sh-reveal-delay`, not a
 * parent-driven variant, because there is no JavaScript here to orchestrate one.
 * Each direct child should be a `<RevealItem>`, which takes its index.
 */
export function RevealGroup({ children, className = "" }: { children: ReactNode; className?: string }) {
    return <div className={className}>{children}</div>
}

export function RevealItem({
    children, className = "", index = 0, step = 0.08,
}: {
    children: ReactNode
    className?: string
    /** Position in the list. Multiplied by `step` to give this item its delay. */
    index?: number
    step?: number
}) {
    return (
        <Reveal className={className} delay={index * step}>
            {children}
        </Reveal>
    )
}

export default Reveal
