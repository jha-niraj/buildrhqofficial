/**
 * Pages a stranger can open, with none of the application around them.
 *
 * ── Why this route group exists ──────────────────────────────────────────────
 * `/knowme/<username>` lived under `(main)`, so making it public (see the
 * `isPublicKnowMeProfile` note in middleware.ts) handed every signed-out visitor
 * the whole product: the sidebar with Home, Practice, Projects, Mock Interview,
 * Pathfinder, AI Tools and Jobs, a "0 credits" counter, an "Ask AI" rail that is
 * the OWNER's private assistant, and a "Sign In" button at the bottom.
 *
 * Every one of those links bounces to /signin, because CR-10 correctly guards
 * them. So the page advertised an application the viewer could not use, wrapped
 * around the one thing they came for.
 *
 * That is not a styling problem, and it is not fixed by hiding the sidebar when
 * signed out: the `(main)` shell exists to hold a session's chrome, and this page
 * has no session. A public page belongs outside it.
 *
 * The layout is deliberately almost nothing. It paints a background - the
 * `(main)` backdrop does not reach here - and gets out of the way. Fonts, theme,
 * providers and the toaster all come from the ROOT layout, which wraps every
 * group.
 */
export default function PublicLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-dvh bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
            {children}
        </div>
    );
}
