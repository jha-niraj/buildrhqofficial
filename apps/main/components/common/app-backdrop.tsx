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
 * It is deliberately NOT visible through the page itself, and that is measured
 * rather than asserted. `text-neutral-500` is 4.74:1 on pure white - so it has
 * almost no headroom, and ANY translucency in the page card drops it under 4.5:1
 * against the darker parts of the photograph. There is no scrim value that both
 * shows the image and carries small grey text: pushing the scrim to 45% white
 * only lifts n-500 from 4.15:1 to 4.30:1, and by then the photo is gone anyway.
 *
 * This was violated for a while - `layout.tsx` made the page card transparent with
 * a comment saying the backdrop "reads through it", which is exactly the thing this
 * file warned against. Measured at the time: n-500 was **1.32:1**. The page card is
 * opaque again, and the photo lives where it was always meant to - in the frame.
 *
 * ── Why the photo is stronger now ──
 * With the page opaque, the image is behind nothing but the gutter, so there is no
 * contrast reason to keep it faint. It reads as an actual photograph instead of a
 * grey wash, which was the point of using one.
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
                className="absolute inset-0 bg-cover bg-center opacity-100 dark:opacity-[0.92]"
                style={{ backgroundImage: `url(${BLURRED})` }}
            />

            {/* Scrim. Light mode washes toward white so the backdrop stays airy and
                a card's ring still reads against it; dark mode pushes toward black
                so the cards are the brightest thing on screen rather than competing
                with a mountain. Lighter in the middle than at the edges, which is
                where the cards sit - the gradient frames them. */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-white/10 to-white/30 dark:from-neutral-950/35 dark:via-neutral-950/18 dark:to-neutral-950/45" />
        </div>
    )
}

export default AppBackdrop
