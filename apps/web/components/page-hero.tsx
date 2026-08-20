import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"

/**
 * The header every public page uses, except the landing page and the blog.
 *
 * ── The one decision this file exists to make ──
 *
 * Two things could be shared here and they pull in opposite directions:
 *
 *   the SURFACE       colour, texture, type scale, spacing rhythm
 *   the COMPOSITION   what is in the header and how it is arranged
 *
 * Sharing both is what most design systems do, and it is why most marketing sites
 * feel like one template with the words swapped. Sharing neither is how you end up
 * with fourteen pages that each look like a different product.
 *
 * So: the surface is FIXED and the composition is a VARIANT. Every page is
 * recognisably the same site the moment it paints, and no two consecutive pages
 * are laid out the same way.
 *
 * There is deliberately no `background`, `palette` or `className` escape hatch on
 * the surface. A page that wants a different header colour is a page that has
 * stopped matching the brand, and the fix is to change it here for all of them.
 * What a page CAN choose is `variant`, and adding a new one is a change to this
 * file - which is the point, because it means somebody looked at the other four
 * first.
 *
 * ── Why this surface ──
 *
 * The ridge photograph is the same one behind the auth screens and the signed-in
 * app shell. That is the argument for it: a visitor moves marketing -> sign-in ->
 * product and the ground under them never changes, so the three read as one thing
 * rather than three teams. It is monochrome, which is the palette rule, and it is
 * already paid for - 4KB, blurred, and on the CDN.
 *
 * It is NOT the reference site's approach and should not become it. That one uses a
 * warm pearl ground behind a mosaic of photographic tiles, which is right for a site
 * with fourteen pages selling one thing to one buyer. This site has a handful of
 * high-intent pages selling to people who will read two of them, and continuity with
 * the product is worth more here than a bespoke mosaic.
 *
 * ── Light in both themes, on purpose ──
 *
 * The surface does not pair `dark:`. It is a photograph, so it reads light whatever
 * the theme is, and ink over it must be constant too. Pairing `dark:` on type that
 * sits over a theme-independent surface is exactly how the auth panel ended up at
 * 1.1:1 - white text on a picture that was never dark. Measured here at 14.5:1.
 */

export interface PageHeroCta {
    text: string
    href: string
    /** Renders a plain anchor rather than a Next link. */
    external?: boolean
}

/** One hard fact in the `ledger` variant. Keep the value short - it is set large. */
export interface PageHeroFact {
    value: string
    label: string
}

export type PageHeroVariant = "statement" | "ledger" | "split" | "versus"

export interface PageHeroProps {
    /** Small line above the title. Sets context in three or four words. */
    eyebrow?: string
    title: ReactNode
    sub?: string
    ctas?: PageHeroCta[]
    variant?: PageHeroVariant
    /** `ledger` only. Three or four facts; more than four stops being scannable. */
    facts?: PageHeroFact[]
    /** `split` and `versus` only. The right-hand column. */
    aside?: ReactNode
}

function Cta({ cta, primary }: { cta: PageHeroCta; primary: boolean }) {
    const className = cn(
        // min-h-11 is the 44px tap floor. A hero CTA is the most important target
        // on the page and must not be the one that misses it.
        "inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors",
        primary
            ? "bg-neutral-900 text-white hover:bg-neutral-800"
            : "border border-neutral-900/20 text-neutral-800 hover:border-neutral-900/40 hover:bg-neutral-900/5",
    )
    const inner = (
        <>
            {cta.text}
            {primary && <ArrowRight className="h-4 w-4" aria-hidden />}
        </>
    )
    return cta.external ? (
        <a href={cta.href} className={className}>{inner}</a>
    ) : (
        <Link href={cta.href} className={className}>{inner}</Link>
    )
}

/** The fixed surface. Every variant renders inside this and none of them may change it. */
function Surface({ children }: { children: ReactNode }) {
    return (
        <header className="relative isolate overflow-hidden bg-neutral-100">
            {/* The ridge, blurred. Same photograph as the auth screens and the app
                shell - see the note at the top of this file. */}
            <div
                aria-hidden
                className="absolute inset-0 bg-cover bg-center opacity-70"
                style={{ backgroundImage: "url(/brand/ridge-blur.webp)" }}
            />
            {/* Wash toward white so type sits on a light, even ground rather than on
                whichever part of the photograph happens to be behind it. */}
            <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/45 to-white/75" />
            {/* A fine grid, carried over from the About page's own header - it was the
                one part of the old hand-rolled headers worth keeping. It reads as
                drafting paper, which is the right register for an engineering product. */}
            <div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(to_right,#8080800f_1px,transparent_1px),linear-gradient(to_bottom,#8080800f_1px,transparent_1px)] bg-[size:28px_28px]"
            />
            {/* px-4 below sm: at 360px, 48px of horizontal padding is 13% of the screen. */}
            <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:py-28">
                {children}
            </div>
        </header>
    )
}

/** Shared type scale. Fixed across variants - this is half of what makes them one site. */
const EYEBROW = "text-xs font-semibold uppercase tracking-[0.18em] text-neutral-600"
// Steps down hard on mobile: a 7xl title on a 360px line wins a fight with the page
// it is introducing and should not.
const TITLE = "text-4xl font-bold leading-[1.05] tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl"
const SUB = "text-base leading-relaxed text-neutral-700 sm:text-lg"

export function PageHero({
    eyebrow, title, sub, ctas = [], variant = "statement", facts = [], aside,
}: PageHeroProps) {
    const ctaRow = ctas.length > 0 && (
        // flex-wrap here is fine and is not the deferral the responsiveness rules warn
        // about: two CTAs wrapping to two rows is the intended mobile layout, not an
        // overflow being converted into height.
        <div className="mt-8 flex flex-wrap items-center gap-3">
            {ctas.map((c, i) => <Cta key={c.href} cta={c} primary={i === 0} />)}
        </div>
    )

    // ── statement ──────────────────────────────────────────────────────────────
    // One claim, centred, nothing else. For a page that IS an argument rather than
    // a list - About, a manifesto, a single-idea page.
    if (variant === "statement") {
        return (
            <Surface>
                <div className="mx-auto max-w-3xl text-center">
                    {eyebrow && <p className={cn(EYEBROW, "mb-4")}>{eyebrow}</p>}
                    <h1 className={TITLE}>{title}</h1>
                    {sub && <p className={cn(SUB, "mx-auto mt-6 max-w-2xl")}>{sub}</p>}
                    {ctaRow && <div className="flex justify-center">{ctaRow}</div>}
                </div>
            </Surface>
        )
    }

    // ── ledger ─────────────────────────────────────────────────────────────────
    // Copy, then a rule, then hard facts. For a page whose job is specifics -
    // pricing, plans, anything where the reader arrived wanting a number.
    if (variant === "ledger") {
        return (
            <Surface>
                <div className="max-w-2xl">
                    {eyebrow && <p className={cn(EYEBROW, "mb-4")}>{eyebrow}</p>}
                    <h1 className={TITLE}>{title}</h1>
                    {sub && <p className={cn(SUB, "mt-6")}>{sub}</p>}
                    {ctaRow}
                </div>
                {facts.length > 0 && (
                    <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-neutral-900/10 pt-8 sm:grid-cols-4">
                        {facts.map((f) => (
                            <div key={f.label}>
                                {/* Numbers step type down rather than truncating. A
                                    truncated figure reads as a different, smaller value
                                    and nothing on screen says it was cut. */}
                                <dt className="text-2xl font-bold tabular-nums text-neutral-900 sm:text-3xl">
                                    {f.value}
                                </dt>
                                <dd className="mt-1 text-xs font-medium uppercase tracking-wide text-neutral-600">
                                    {f.label}
                                </dd>
                            </div>
                        ))}
                    </dl>
                )}
            </Surface>
        )
    }

    // ── versus ─────────────────────────────────────────────────────────────────
    // Deliberately asymmetric - the title takes seven columns and the aside five,
    // so the two sides are visibly unequal. For a page built on a contrast, where a
    // balanced 50/50 would imply the two options are equivalent.
    if (variant === "versus") {
        return (
            <Surface>
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end lg:gap-12">
                    <div className="min-w-0 lg:col-span-7">
                        {eyebrow && <p className={cn(EYEBROW, "mb-4")}>{eyebrow}</p>}
                        <h1 className={TITLE}>{title}</h1>
                        {ctaRow}
                    </div>
                    <div className="min-w-0 lg:col-span-5">
                        {sub && <p className={cn(SUB, "border-l-2 border-neutral-900/15 pl-5")}>{sub}</p>}
                        {aside && <div className="mt-6">{aside}</div>}
                    </div>
                </div>
            </Surface>
        )
    }

    // ── split ──────────────────────────────────────────────────────────────────
    // Copy left, something to look at right. For a page that has to SHOW rather
    // than tell - features, a demo, anything with a screenshot or a live element.
    return (
        <Surface>
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
                <div className="min-w-0">
                    {eyebrow && <p className={cn(EYEBROW, "mb-4")}>{eyebrow}</p>}
                    <h1 className={TITLE}>{title}</h1>
                    {sub && <p className={cn(SUB, "mt-6")}>{sub}</p>}
                    {ctaRow}
                </div>
                {/* min-w-0 so a wide child (a code block, a table) shrinks with the
                    column instead of pushing the grid past the viewport. */}
                {aside && <div className="min-w-0">{aside}</div>}
            </div>
        </Surface>
    )
}

export default PageHero
