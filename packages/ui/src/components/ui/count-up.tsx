"use client"

import { useEffect, useRef, useState } from "react"

/**
 * A number that counts up to its value, and re-counts whenever the value
 * changes.
 *
 * Built for the currency toggle on the pricing cards: flipping INR to USD
 * replaced every price instantly, which reads as a glitch rather than as a
 * change the user caused. Counting from zero makes the switch legible - you see
 * WHICH numbers moved.
 *
 * ── Why requestAnimationFrame and not a CSS transition ──────────────────────
 * CSS cannot interpolate the text content of a node. A transition can move a
 * number across the screen; only script can count it.
 *
 * ── Reduced motion is honoured, and it matters more here than usual ─────────
 * This is a PRICE. Someone who has asked for less motion must still be able to
 * read it, and a number they cannot pin down is worse than no animation at all,
 * so under `prefers-reduced-motion` the final value is set immediately.
 */

export interface CountUpProps {
    value: number
    /** Milliseconds for a full count. */
    duration?: number
    /** Decimal places. USD prices carry two; INR is whole rupees. */
    decimals?: number
    /** Rendered before the number, inside the same element. */
    prefix?: string
    className?: string
}

/** Ease-out cubic: fast at the start, settling at the end. */
function easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3)
}

export function CountUp({ value, duration = 650, decimals = 0, prefix = "", className }: CountUpProps) {
    const [display, setDisplay] = useState(value)
    // The value we counted FROM last time, so a change mid-flight starts from
    // where the number actually is rather than snapping back to zero.
    const fromRef = useRef(value)
    const frameRef = useRef<number | null>(null)

    useEffect(() => {
        const reduced =
            typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

        if (reduced || duration <= 0) {
            fromRef.current = value
            setDisplay(value)
            return
        }

        const from = fromRef.current
        const delta = value - from
        if (delta === 0) return

        const start = performance.now()
        const step = (now: number) => {
            const t = Math.min(1, (now - start) / duration)
            const next = from + delta * easeOut(t)
            setDisplay(next)
            if (t < 1) {
                frameRef.current = requestAnimationFrame(step)
            } else {
                fromRef.current = value
                setDisplay(value)
            }
        }
        frameRef.current = requestAnimationFrame(step)

        return () => {
            if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
            // Land on the target when unmounted or interrupted. Leaving a
            // half-counted price on screen would be worse than not animating.
            fromRef.current = value
        }
    }, [value, duration])

    return (
        <span className={className}>
            {prefix}
            {display.toLocaleString(undefined, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
            })}
        </span>
    )
}

export default CountUp
