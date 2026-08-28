/**
 * Animated display icons.
 *
 * For the places that show ONE big icon and mean something by it: category
 * cards, empty states, feature panels, hero badges. Not for sidebars, not for
 * buttons - a 16px icon that moves is noise, and lucide already covers that job
 * well.
 *
 * ── Why these exist ─────────────────────────────────────────────────────────
 * The pathfinder category grid rendered EMOJI - 🧮 🌐 🎨 ⚙️ 🚀 - which broke the
 * monochrome palette rule in CLAUDE.md outright, rendered differently on every
 * OS, and could not inherit text colour, so they stayed full-colour in dark mode
 * and in a dark selected card.
 *
 * ── How they are built ──────────────────────────────────────────────────────
 * Every icon is a plain SVG on a 24x24 grid drawn in `currentColor`, so it takes
 * the colour of whatever it is dropped into and needs no dark: variant. Motion
 * comes from the `sh-art-*` CSS vocabulary in globals.css, extended rather than
 * duplicated - no motion library, because these render in grids of ten or more
 * and inside server components.
 *
 * Every animation is DECORATIVE. Nothing moves that carries meaning, so
 * `prefers-reduced-motion` switches all of it off and loses nothing.
 *
 * ── Motion mode ─────────────────────────────────────────────────────────────
 * `motion="hover"` (the default for grids) parks the animation until the icon or
 * its `.group` ancestor is hovered or focused. Ten icons all moving at once
 * competes with the page. `motion="always"` is right for a single hero or empty
 * state, where the icon IS the focus.
 *
 * ── Adding one ──────────────────────────────────────────────────────────────
 * Draw on the 24x24 grid, use `currentColor`, pick motions from the `sh-art-*`
 * set, and add it to ANIMATED_ICONS at the bottom. For a stroke draw-on, set
 * `--sh-draw-len` to roughly the path length or the dash will not close.
 */

import type { CSSProperties, SVGProps } from "react"

export type AnimatedIconMotion = "hover" | "always" | "none"

export interface AnimatedIconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
    /** Pixel size of the square canvas. */
    size?: number
    /** When the animation runs. Defaults to `hover`. */
    motion?: AnimatedIconMotion
    className?: string
}

/** Shared wrapper: the canvas, the stroke defaults, and the motion switch. */
function Icon({
    size = 24,
    motion = "hover",
    className,
    children,
    ...rest
}: AnimatedIconProps & { children: React.ReactNode }) {
    return (
        <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            // `data-motion` is what the CSS in globals.css keys off. `none` is a
            // real option: a printed page or a screenshot wants stillness.
            data-motion={motion}
            aria-hidden="true"
            focusable="false"
            className={className}
            {...rest}
        >
            {children}
        </svg>
    )
}

/** `--sh-draw-len` for the draw-on animation, as a typed style object. */
const draw = (len: number): CSSProperties => ({ ["--sh-draw-len" as string]: len })

// ── Category icons ───────────────────────────────────────────────────────────

/** DSA: an array of cells with a traversal marker stepping across them. */
export function DsaIcon(p: AnimatedIconProps) {
    return (
        <Icon {...p}>
            <rect x="2.5" y="8.5" width="19" height="7" rx="1.5" />
            <path d="M7.25 8.5v7M12 8.5v7M16.75 8.5v7" opacity="0.5" />
            <g className="sh-art-wave">
                <path d="M4.9 12h.01" strokeWidth="2.5" />
                <path d="M9.6 12h.01" strokeWidth="2.5" />
                <path d="M14.4 12h.01" strokeWidth="2.5" />
                <path d="M19.1 12h.01" strokeWidth="2.5" />
            </g>
        </Icon>
    )
}

/** Web development: a globe whose meridian turns. */
export function WebDevIcon(p: AnimatedIconProps) {
    return (
        <Icon {...p}>
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18" opacity="0.6" />
            <ellipse cx="12" cy="12" rx="4" ry="9" className="sh-art-orbit" opacity="0.85" />
        </Icon>
    )
}

/** Frontend: a browser frame with a caret blinking in its content. */
export function FrontendIcon(p: AnimatedIconProps) {
    return (
        <Icon {...p}>
            <rect x="2.5" y="4" width="19" height="16" rx="2" />
            <path d="M2.5 8.5h19" />
            <circle cx="5.5" cy="6.2" r="0.6" fill="currentColor" stroke="none" opacity="0.7" />
            <path d="M6 12.5h7" opacity="0.55" />
            <path d="M6 16h4.5" opacity="0.55" />
            <path d="M15.5 11.5v5.5" className="sh-art-caret" strokeWidth="1.8" />
        </Icon>
    )
}

/** Backend: stacked servers with a status light pulsing. */
export function BackendIcon(p: AnimatedIconProps) {
    return (
        <Icon {...p}>
            <rect x="3" y="3.5" width="18" height="6" rx="1.5" />
            <rect x="3" y="14.5" width="18" height="6" rx="1.5" />
            <path d="M12 9.5v5" opacity="0.5" />
            <circle cx="6.75" cy="6.5" r="0.9" fill="currentColor" stroke="none" className="sh-art-pulse" />
            <circle cx="6.75" cy="17.5" r="0.9" fill="currentColor" stroke="none" className="sh-art-pulse sh-art-d2" />
        </Icon>
    )
}

/** DevOps: the CI/CD loop, drawn continuously. */
export function DevOpsIcon(p: AnimatedIconProps) {
    return (
        <Icon {...p}>
            <path
                d="M7.5 12c0-2.2 1.6-3.8 3.6-3.8 3.4 0 4.4 7.6 7.8 7.6 2 0 3.6-1.6 3.6-3.8S20.9 8.2 18.9 8.2c-3.4 0-4.4 7.6-7.8 7.6-2 0-3.6-1.6-3.6-3.8Z"
                className="sh-art-draw"
                style={draw(46)}
            />
            <circle cx="4" cy="12" r="1.6" fill="currentColor" stroke="none" className="sh-art-pulse" />
        </Icon>
    )
}

/** AI / ML: a small network whose nodes fire in sequence. */
export function AiMlIcon(p: AnimatedIconProps) {
    return (
        <Icon {...p}>
            <path d="M7 6.5 15.5 12 7 17.5M15.5 12H19" opacity="0.45" />
            <g className="sh-art-wave">
                <path d="M6 6.5h.01" strokeWidth="3.2" />
                <path d="M6 17.5h.01" strokeWidth="3.2" />
                <path d="M16.5 12h.01" strokeWidth="3.2" />
                <path d="M20 12h.01" strokeWidth="3.2" />
            </g>
            <circle cx="12" cy="12" r="9.2" opacity="0.25" />
        </Icon>
    )
}

/** Database: a cylinder with a write pulsing down through it. */
export function DatabaseIcon(p: AnimatedIconProps) {
    return (
        <Icon {...p}>
            <ellipse cx="12" cy="6" rx="7.5" ry="3" />
            <path d="M4.5 6v12c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3V6" />
            <path d="M4.5 12c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3" opacity="0.55" />
            <circle cx="12" cy="6" r="1.1" fill="currentColor" stroke="none" className="sh-art-rise" />
        </Icon>
    )
}

/** System design: boxes with a signal travelling the edges between them. */
export function SystemDesignIcon(p: AnimatedIconProps) {
    return (
        <Icon {...p}>
            <rect x="2.5" y="2.5" width="7" height="6" rx="1.3" />
            <rect x="14.5" y="2.5" width="7" height="6" rx="1.3" />
            <rect x="8.5" y="15.5" width="7" height="6" rx="1.3" />
            <path d="M6 8.5v3.5h12V8.5M12 12v3.5" className="sh-art-flow" strokeDasharray="3 3" />
        </Icon>
    )
}

/** Mobile: a handset with its content scrolling. */
export function MobileIcon(p: AnimatedIconProps) {
    return (
        <Icon {...p}>
            <rect x="6" y="2" width="12" height="20" rx="2.5" />
            <path d="M10.5 5h3" opacity="0.7" />
            <g className="sh-art-scan">
                <path d="M8.75 11h6.5" opacity="0.8" />
                <path d="M8.75 14h4" opacity="0.8" />
            </g>
        </Icon>
    )
}

/** Interview prep: two speech bubbles taking turns. */
export function InterviewPrepIcon(p: AnimatedIconProps) {
    return (
        <Icon {...p}>
            <path d="M2.5 5.5A1.5 1.5 0 0 1 4 4h9a1.5 1.5 0 0 1 1.5 1.5v5A1.5 1.5 0 0 1 13 12H7l-3 2.5V12a1.5 1.5 0 0 1-1.5-1.5Z" className="sh-art-tick" />
            <path d="M17 8.5h3A1.5 1.5 0 0 1 21.5 10v5a1.5 1.5 0 0 1-1.5 1.5v2.5L17 16.5h-3.5A1.5 1.5 0 0 1 12 15v-1" className="sh-art-tick sh-art-d3" opacity="0.75" />
        </Icon>
    )
}

/** Other: a book whose pages lift. */
export function LearningIcon(p: AnimatedIconProps) {
    return (
        <Icon {...p}>
            <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4H9a3 3 0 0 1 3 3v12a2.5 2.5 0 0 0-2.5-2.5H3Z" />
            <path d="M21 5.5A1.5 1.5 0 0 0 19.5 4H15a3 3 0 0 0-3 3v12a2.5 2.5 0 0 1 2.5-2.5H21Z" className="sh-art-rise" opacity="0.75" />
        </Icon>
    )
}

// ── Display icons for empty states and feature panels ────────────────────────

/** Achievement. The shine sweeps across the cup. */
export function TrophyIcon(p: AnimatedIconProps) {
    return (
        <Icon {...p}>
            <path d="M7 4h10v5a5 5 0 0 1-10 0Z" />
            <path d="M7 5.5H4.5V7a3 3 0 0 0 3 3M17 5.5h2.5V7a3 3 0 0 1-3 3" opacity="0.7" />
            <path d="M12 14v3.5M8.5 20.5h7" />
            <path d="M10 6v3" className="sh-art-sweep" opacity="0.9" />
        </Icon>
    )
}

/** Nothing here yet. The magnifier sweeps the empty field. */
export function EmptySearchIcon(p: AnimatedIconProps) {
    return (
        <Icon {...p}>
            <rect x="2.5" y="4" width="19" height="16" rx="2" opacity="0.45" strokeDasharray="3 3" />
            <g className="sh-art-drift">
                <circle cx="11" cy="11" r="4" />
                <path d="m14.2 14.2 3 3" />
            </g>
        </Icon>
    )
}

/** Success. The tick draws itself. */
export function SuccessIcon(p: AnimatedIconProps) {
    return (
        <Icon {...p}>
            <circle cx="12" cy="12" r="9" opacity="0.5" />
            <path d="m7.75 12.25 2.9 2.9 5.6-5.9" className="sh-art-draw" style={draw(14)} strokeWidth="1.9" />
        </Icon>
    )
}

/** Something went wrong. */
export function AlertIcon(p: AnimatedIconProps) {
    return (
        <Icon {...p}>
            <path d="M10.7 3.6 2.5 18a1.5 1.5 0 0 0 1.3 2.2h16.4a1.5 1.5 0 0 0 1.3-2.2L13.3 3.6a1.5 1.5 0 0 0-2.6 0Z" opacity="0.6" />
            <path d="M12 9v4.5" className="sh-art-pulse" strokeWidth="1.9" />
            <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" className="sh-art-pulse sh-art-d2" />
        </Icon>
    )
}

/** Locked or private. The shackle lifts. */
export function LockedIcon(p: AnimatedIconProps) {
    return (
        <Icon {...p}>
            <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
            <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" className="sh-art-rise" />
            <circle cx="12" cy="15.5" r="1.2" fill="currentColor" stroke="none" opacity="0.8" />
        </Icon>
    )
}

/** AI generation. Sparkles twinkle out of step. */
export function SparkleIcon(p: AnimatedIconProps) {
    return (
        <Icon {...p}>
            <path d="M12 3.5 13.6 9 19 10.5 13.6 12 12 17.5 10.4 12 5 10.5 10.4 9Z" className="sh-art-twinkle" />
            <path d="M18.5 15.5 19.2 18l2.3.7-2.3.7-.7 2.4-.7-2.4-2.3-.7 2.3-.7Z" className="sh-art-twinkle sh-art-d3" opacity="0.8" />
            <path d="M5 15.5l.5 1.7 1.7.5-1.7.5L5 20l-.5-1.8-1.7-.5 1.7-.5Z" className="sh-art-twinkle sh-art-d5" opacity="0.65" />
        </Icon>
    )
}

/** Voice. The bars move like level meters. */
export function VoiceIcon(p: AnimatedIconProps) {
    return (
        <Icon {...p}>
            <rect x="9" y="2.5" width="6" height="11" rx="3" />
            <path d="M5 11.5a7 7 0 0 0 14 0M12 18.5v3" opacity="0.7" />
            <g className="sh-art-wave">
                <path d="M3 9.5v3" strokeWidth="1.6" opacity="0.6" />
                <path d="M21 9.5v3" strokeWidth="1.6" opacity="0.6" />
            </g>
        </Icon>
    )
}

/** Code. The caret blinks between the brackets. */
export function CodeIcon(p: AnimatedIconProps) {
    return (
        <Icon {...p}>
            <path d="m7.5 8-4 4 4 4M16.5 8l4 4-4 4" />
            <path d="M13.5 7.5 10.5 16.5" opacity="0.5" />
            <path d="M11.8 11v2.5" className="sh-art-caret" strokeWidth="1.8" />
        </Icon>
    )
}

/** A document being written. */
export function DocumentIcon(p: AnimatedIconProps) {
    return (
        <Icon {...p}>
            <path d="M5 3.5h8.5L19 9v11.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1Z" />
            <path d="M13.5 3.5V9H19" opacity="0.6" />
            <path d="M8 12.5h8" className="sh-art-draw" style={draw(8)} />
            <path d="M8 16h5" className="sh-art-draw sh-art-d3" style={draw(5)} opacity="0.8" />
        </Icon>
    )
}

/** A target or goal. The ring closes. */
export function TargetIcon(p: AnimatedIconProps) {
    return (
        <Icon {...p}>
            <circle cx="12" cy="12" r="9" opacity="0.4" />
            <circle cx="12" cy="12" r="5.5" className="sh-art-draw" style={draw(35)} />
            <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" className="sh-art-pulse" />
        </Icon>
    )
}

/** Launch or ship. */
export function RocketIcon(p: AnimatedIconProps) {
    return (
        <Icon {...p}>
            <path d="M12 2.5c3 2.2 4.5 5.4 4.5 9L12 15.5 7.5 11.5c0-3.6 1.5-6.8 4.5-9Z" />
            <path d="M7.5 11.5 5 13v3l2.6-1.3M16.5 11.5 19 13v3l-2.6-1.3" opacity="0.7" />
            <circle cx="12" cy="9" r="1.6" opacity="0.8" />
            <path d="M12 17v3.5" className="sh-art-rise" strokeWidth="1.9" />
        </Icon>
    )
}

// ── Registry ─────────────────────────────────────────────────────────────────

/**
 * Name to component. Consumers that hold a STRING - a category enum out of the
 * database, say - look the icon up here rather than importing eleven components
 * and writing their own switch.
 */
export const ANIMATED_ICONS = {
    dsa: DsaIcon,
    "web-dev": WebDevIcon,
    frontend: FrontendIcon,
    backend: BackendIcon,
    devops: DevOpsIcon,
    "ai-ml": AiMlIcon,
    database: DatabaseIcon,
    "system-design": SystemDesignIcon,
    mobile: MobileIcon,
    "interview-prep": InterviewPrepIcon,
    learning: LearningIcon,
    trophy: TrophyIcon,
    "empty-search": EmptySearchIcon,
    success: SuccessIcon,
    alert: AlertIcon,
    locked: LockedIcon,
    sparkle: SparkleIcon,
    voice: VoiceIcon,
    code: CodeIcon,
    document: DocumentIcon,
    target: TargetIcon,
    rocket: RocketIcon,
} as const

export type AnimatedIconName = keyof typeof ANIMATED_ICONS

export function isAnimatedIconName(value: unknown): value is AnimatedIconName {
    return typeof value === "string" && value in ANIMATED_ICONS
}

/**
 * Render by name, with a fallback.
 *
 * The fallback matters: category values come from a Postgres enum that can gain
 * a member without this file changing, and a missing icon must degrade to a
 * neutral mark rather than crash a grid.
 */
export function AnimatedIcon({
    name,
    fallback = "learning",
    ...rest
}: AnimatedIconProps & { name: string; fallback?: AnimatedIconName }) {
    const Cmp = isAnimatedIconName(name) ? ANIMATED_ICONS[name] : ANIMATED_ICONS[fallback]
    return <Cmp {...rest} />
}
