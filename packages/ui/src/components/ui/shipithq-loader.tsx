"use client"

import { Logo } from "../logo"

// ShipItHQ full-page loader - the logo mark, then the "ShipItHQ" wordmark underneath
// with a slow sweep travelling across it. Ink/neutral base with the brand orange as the
// sweep highlight; light + dark aware.
//
// This is for FULL-PAGE transitions (auth flows, first paint of a heavy route) where a
// few hundred extra ms of wait deserves something to look at. It is NOT a replacement
// for per-section skeletons - a skeleton that shows the shape of the content arriving
// is strictly better inside an already-rendered page, so leave those alone.

const FONT_STACK =
    "var(--font-space-grotesk, 'Space Grotesk'), ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"

export type ShipItHQLoaderProps = {
    /** Cover the viewport (default). Set false to render inline within a parent. */
    fullScreen?: boolean
    /** Optional caption under the wordmark, e.g. "Preparing your workspace". */
    label?: string
    className?: string
}

const STYLES = `
.bhq-root {
    --bhq-dim: #d4d4d4;
    --bhq-mid: #737373;
    --bhq-hot: #171717;
    --bhq-accent: #171717;
}
.dark .bhq-root {
    --bhq-dim: #404040;
    --bhq-mid: #a3a3a3;
    --bhq-hot: #fafafa;
    --bhq-accent: #e5e5e5;
}
.bhq-logo-wrap {
    position: relative;
    display: grid;
    place-items: center;
}
.bhq-glow {
    position: absolute;
    inset: -22px;
    border-radius: 50%;
    background: radial-gradient(circle, var(--bhq-accent) 0%, transparent 68%);
    opacity: 0.22;
    animation: bhq-glow 2.4s cubic-bezier(.5,0,.2,1) infinite;
}
@keyframes bhq-glow {
    0% { opacity: 0.1; transform: scale(0.9); }
    45% { opacity: 0.3; transform: scale(1.05); }
    100% { opacity: 0.1; transform: scale(0.9); }
}
.bhq-logo {
    position: relative;
    width: 64px;
    height: 64px;
    border-radius: 18px;
    box-shadow: 0 8px 28px -8px rgba(0,0,0,0.22);
    animation: bhq-logo-in 2.4s cubic-bezier(.5,0,.2,1) infinite;
}
@keyframes bhq-logo-in {
    0% { opacity: 0.4; transform: scale(0.94); }
    45% { opacity: 1; transform: scale(1); }
    100% { opacity: 0.4; transform: scale(0.94); }
}
.bhq-word {
    position: relative;
    font-family: ${FONT_STACK};
    font-weight: 600;
    letter-spacing: -0.03em;
    line-height: 1;
    font-size: clamp(1.9rem, 4.2vw, 2.75rem);
    white-space: nowrap;
    user-select: none;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
    background-image: linear-gradient(115deg,
        var(--bhq-dim) 0%, var(--bhq-dim) 36%,
        var(--bhq-hot) 47%,
        var(--bhq-accent) 53%,
        var(--bhq-dim) 64%, var(--bhq-dim) 100%);
    background-size: 220% 100%;
    animation: bhq-sweep 2.4s cubic-bezier(.45,0,.15,1) infinite;
}
@keyframes bhq-sweep { 0% { background-position: 130% 0; } 100% { background-position: -130% 0; } }

.bhq-track { position: relative; width: 96px; height: 3px; margin-top: 1.35rem; border-radius: 999px;
    background: var(--bhq-dim); overflow: hidden; }
.bhq-track-fill { position: absolute; inset: 0; width: 34%; border-radius: 999px;
    background: var(--bhq-accent); animation: bhq-track 1.7s cubic-bezier(.5,0,.2,1) infinite; }
@keyframes bhq-track {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(294%); }
}

.bhq-cap { margin-top: 1.25rem; font-family: ${FONT_STACK}; font-size: 12px;
    letter-spacing: 0.16em; text-transform: uppercase; color: var(--bhq-mid); }

@media (prefers-reduced-motion: reduce) {
    .bhq-logo, .bhq-word, .bhq-track-fill, .bhq-glow { animation: none !important; }
    .bhq-logo { opacity: 1 !important; transform: scale(1) !important; }
    .bhq-glow { opacity: 0.2 !important; }
    .bhq-word { background-position: 50% 0 !important; }
}
`

export function ShipItHQLoader({
    fullScreen = true,
    label,
    className = "",
}: ShipItHQLoaderProps) {
    const outer: React.CSSProperties = fullScreen
        ? { position: "fixed", inset: 0, zIndex: 50 }
        : { position: "relative", width: "100%" }

    return (
        <div
            className={`bhq-root bg-white dark:bg-neutral-950 ${className}`}
            style={{
                ...outer,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
            }}
            role="status"
            aria-label="Loading ShipItHQ"
        >
            <div className="bhq-logo-wrap">
                <span className="bhq-glow" aria-hidden />
                {/* Inline SVG, not an <img src="/logo.svg">: the mark relies on
                    `currentColor` to adapt to light/dark, which never resolves
                    through an <img> - the browser has no text-colour context for
                    an externally-loaded image, so it silently renders black in
                    both themes. Same bug, same fix as apps/admin's sign-in
                    screen. `Logo` lives in this same package, so this still adds
                    no dependency on Next. */}
                <span
                    aria-hidden
                    className="bhq-logo flex items-center justify-center bg-neutral-900 dark:bg-white"
                >
                    <Logo className="h-[38px] w-[38px] text-white dark:text-neutral-900" />
                </span>
            </div>
            <div className="bhq-word" style={{ marginTop: "1.15rem" }}>ShipItHQ</div>
            <div className="bhq-track">
                <div className="bhq-track-fill" />
            </div>
            {label ? <p className="bhq-cap">{label}</p> : null}
            <style>{STYLES}</style>
        </div>
    )
}

export default ShipItHQLoader
