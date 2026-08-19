/**
 * The photographic backdrop behind every auth screen.
 *
 * One photograph, two pre-rendered files, three roles - because the shell shows a
 * different surface at each breakpoint and a single layer would be invisible at
 * two of the three:
 *
 *   xl and up   the card is inset by `xl:p-6`, so the photo is the surround it
 *               floats on. This is the one people will describe as "the background"
 *   lg and up   the brand column is a black panel; the photo sits under it as
 *               texture, dimmed until it reads as depth rather than as a picture
 *   below lg    the aside is hidden and the card is full bleed, so neither of the
 *               above shows anything. A top-anchored wash keeps the phone from
 *               being a flat grey rectangle
 *
 * ── Two files, not one ──
 * `auth-bg.webp` is sharp, for the brand panel, where the ridge lines are the
 * point. `auth-bg-blur.webp` is pre-blurred, for the surround and the mobile wash.
 *
 * Sharp did not work in the surround. At common laptop widths the visible frame is
 * only ~80px, and a crisp fragment of a mountain in a strip that thin reads as a
 * cropping accident rather than a decision. Blurred, the same image reads as
 * ambient light, which is what a surround should be.
 *
 * The blur is baked into the file rather than applied with a CSS `blur()`: the
 * surround covers the viewport, and a 26px filter on an element that size is a
 * real paint cost - paid even below xl, where the card hides it completely. Baked
 * also avoids the faded border a CSS blur gives you when it samples transparency
 * at the element's edge.
 *
 * ── Theme ──
 * Pure CSS (`dark:` variants), NOT a `useTheme()` read. The onboarding shader has
 * to read the theme in JS because a WebGL palette is an array of colours, and it
 * pays for that by rendering nothing until it mounts. An image has no such excuse,
 * and a background that pops in one frame late is more noticeable than one that
 * was never wrong.
 *
 * Everything here is `aria-hidden` and `pointer-events-none`: it is decoration,
 * and it must never sit between a user and a password field.
 */

import { AppBackdrop } from "@/components/common/app-backdrop"

const SHARP = "/auth/auth-bg.webp"
const BLURRED = "/auth/auth-bg-blur.webp"

/**
 * The surround the whole shell sits on.
 *
 * Now shared with the signed-in app shell, which needs the identical layer -
 * see `components/common/app-backdrop.tsx`. Re-exported under the auth name so
 * the auth screens read the way they always did, and so there is exactly one
 * definition to change.
 */
export const AuthBackdropSurround = AppBackdrop

/**
 * Texture under the brand column (lg and up).
 *
 * Deliberately heavy-handed: the panel is `bg-neutral-950` with white type on it,
 * and the headline's contrast is not negotiable. At this opacity white text still
 * measures about 12.7:1 against the panel, so the photo is buying depth for free.
 * The artwork and the copy remain the subject of that column.
 */
export function AuthBackdropPanel() {
    return (
        <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.22]"
            style={{ backgroundImage: `url(${SHARP})` }}
        />
    )
}

/**
 * The mobile wash (below lg only).
 *
 * Anchored to the top and faded out well above the fold, because on a phone the
 * form starts near the top of the screen and anything behind an input is a
 * legibility problem, not a decoration. The gradient reaches full page colour by
 * the bottom of the layer, so every field sits on a solid surface.
 */
export function AuthBackdropMobile() {
    return (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[45vh] overflow-hidden lg:hidden">
            <div
                className="absolute inset-0 bg-cover bg-center opacity-70 dark:opacity-40"
                style={{ backgroundImage: `url(${BLURRED})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/80 to-white dark:from-neutral-950/55 dark:via-neutral-950/85 dark:to-neutral-950" />
        </div>
    )
}
