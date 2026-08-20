"use client"

import { DotmSquare18 } from "./dotm-square-18"

// ─────────────────────────────────────────────────────────────────────────────
// The inline busy indicator. Buttons, rows, small panels.
//
// No spinners. A rotating ring is the one loading affordance every product on the
// internet uses, which makes it the one that says nothing about this one - and at
// button size it degrades to a grey smudge. The dot matrix reads as deliberate at
// 14px and is the same visual language as the full-page `ShipItHQLoader`.
//
// Three sizes, so a caller picks an intent rather than guessing pixel values and
// leaving twelve slightly different loaders across the product:
//
//   sm   inside a button, beside a label
//   md   a row or an inline control that has replaced its content
//   lg   a small panel or a card body
//
// For a whole page use `ShipItHQLoader`; for content arriving inside an already
// rendered page a skeleton that matches the layout still beats both.
//
// `aria-label` defaults to "Loading" and the element carries role="status", so a
// screen reader announces it. Pass a more specific label when the surrounding
// text does not already say what is happening.
// ─────────────────────────────────────────────────────────────────────────────

const SIZES = {
    sm: { size: 14, dotSize: 2 },
    md: { size: 20, dotSize: 2.5 },
    lg: { size: 32, dotSize: 4 },
} as const

export type InlineLoaderSize = keyof typeof SIZES

export interface InlineLoaderProps {
    size?: InlineLoaderSize
    /** Announced to screen readers. */
    label?: string
    className?: string
}

export function InlineLoader({ size = "sm", label = "Loading", className }: InlineLoaderProps) {
    const { size: px, dotSize } = SIZES[size]
    return (
        <span
            role="status"
            aria-label={label}
            className={className}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
        >
            {/* `currentColor` is the point: dropped into a dark button it is light,
                into a light button it is dark, with no per-call-site colour prop. */}
            <DotmSquare18 size={px} dotSize={dotSize} speed={1.35} />
        </span>
    )
}

export default InlineLoader
