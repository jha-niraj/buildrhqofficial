/**
 * The backdrop the whole product sits on.
 *
 * One photograph, blurred and scrimmed, behind every shell - the auth screens and
 * the signed-in app both. It was built for auth first (see
 * `app/(auth)/_components/auth-backdrop.tsx` for the two-file, three-layer
 * reasoning); this is the layer both shells share, defined once so the two cannot
 * drift the first time either is touched.
 *
 * ── What it is for ──
 * The cards FLOAT on this. In the app shell the sidebar, page and AI rail are
 * rounded surfaces with a gutter between them, and this is what shows through
 * that gutter: texture and depth instead of a flat grey plane.
 *
 * It is deliberately NOT visible through the page itself. Frosting the page card
 * so the photograph shows behind the content is the obvious move and the wrong
 * one - `text-neutral-500` help text over a translucent panel drops under 4.5:1
 * against the light parts of the image, and the app is full of small grey text.
 * `auth-shell.tsx` reached the same conclusion for the same reason.
 *
 * ── Theme ──
 * Pure CSS `dark:` variants, not a `useTheme()` read. A backdrop that is briefly
 * the wrong colour on first paint is more noticeable than one that never
 * animates in at all.
 *
 * ── Cost ──
 * One `background-image` on one element. The blurred file is ~4.3KB and the blur
 * is baked into it rather than applied with a CSS `filter`, which would be a real
 * paint cost on an element the size of the viewport.
 *
 * `aria-hidden` and `pointer-events-none`: it is decoration and must never sit
 * between a user and a control.
 */

const BLURRED = "/auth/auth-bg-blur.webp"

export function AppBackdrop() {
    return (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
                className="absolute inset-0 bg-cover bg-center opacity-80 dark:opacity-[0.55]"
                style={{ backgroundImage: `url(${BLURRED})` }}
            />

            {/* Scrim. Light mode washes toward white so the backdrop stays airy and
                a card's ring still reads against it; dark mode pushes toward black
                so the cards are the brightest thing on screen rather than competing
                with a mountain. Lighter in the middle than at the edges, which is
                where the cards sit - the gradient frames them. */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/45 via-white/25 to-white/55 dark:from-neutral-950/55 dark:via-neutral-950/40 dark:to-neutral-950/70" />
        </div>
    )
}

export default AppBackdrop
