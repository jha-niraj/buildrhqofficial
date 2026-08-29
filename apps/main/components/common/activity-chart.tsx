"use client";

/**
 * The one activity chart every module overview uses.
 *
 * ── Why it is hand-rolled and not recharts ───────────────────────────────────
 * `recharts` is already a dependency and is the right tool for the pathfinder
 * dashboard's multi-series work. This is a different job: ONE series, monochrome,
 * on seven overview pages that must look like one product. Getting recharts to
 * honour the mark specs below means overriding its axis, grid, dot, tooltip and
 * cursor components on every page, and the overrides are what drift. ~200 lines
 * of SVG that does exactly this and nothing else is the smaller thing to own.
 *
 * ── The specs it implements, and why each one ────────────────────────────────
 *  - **2px line, round cap and join.** Anything heavier competes with the type.
 *  - **Area fill at ~10%.** A wash that says "this is the same series", never a
 *    saturated block that reads as a second mark.
 *  - **Hairline SOLID gridlines**, one step off the surface. Dashed gridlines add
 *    a second rhythm the eye has to filter out.
 *  - **End marker r=4 with a 2px ring in the SURFACE colour**, so it stays legible
 *    where it crosses the line. The ring is spacing, not a border.
 *  - **No legend.** One series, so the heading already names it; a box with a
 *    single swatch restates the title and costs a row.
 *  - **Crosshair + tooltip.** An HTML chart is interactive by default. The
 *    crosshair snaps to the nearest day, because a reader aims at a date and not
 *    at a 2px line. Keyboard arrows do the same thing, so the values are not
 *    gated behind a pointer.
 *  - **Text never wears the data colour.** The mark is ink; labels are text
 *    tokens.
 *
 * ── Dark mode is chosen, not flipped ─────────────────────────────────────────
 * `useTheme` rather than a `dark:` class, because the geometry needs the actual
 * colour values - an SVG `stroke` cannot be a Tailwind variant. The surface
 * colour is passed to the ring for the same reason.
 *
 * ── Zero is a real reading ───────────────────────────────────────────────────
 * Every module in this product currently has no rows, so the all-zero series is
 * the common case rather than an edge one. It renders the real axes and a real
 * flat line at the baseline with one quiet line of text - NOT a fabricated
 * series, and not a blank panel. A chart that draws its own shape with nothing in
 * it is honest; inventing a curve to look alive would not be.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
// Re-exported by the theme provider rather than imported from `next-themes`
// directly: the package is a dependency of `@repo/ui`, not of this app.
import { useTheme } from "@repo/ui/components/themeprovider";
import { cn } from "@repo/ui/lib/utils";

export interface ActivityPoint {
    /** ISO day, `YYYY-MM-DD`. */
    date: string;
    value: number;
}

interface ActivityChartProps {
    data: ActivityPoint[];
    /** What one unit is, singular. Used in the tooltip: "3 tasks". */
    unit: string;
    /** Plot height in px, excluding the axis labels. */
    height?: number;
    className?: string;
}

const PAD = { top: 10, right: 8, bottom: 22, left: 32 };

export function ActivityChart({ data, unit, height = 160, className }: ActivityChartProps) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    const [hover, setHover] = useState<number | null>(null);
    const { resolvedTheme } = useTheme();
    const clipId = useId().replace(/:/g, "");

    // Measured, not a viewBox. `preserveAspectRatio="none"` would scale the 2px
    // stroke and the tick text along with the geometry, so the line thickness
    // would depend on the container width.
    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => {
            if (entry) setWidth(entry.contentRect.width);
        });
        ro.observe(el);
        setWidth(el.clientWidth);
        return () => ro.disconnect();
    }, []);

    const isDark = resolvedTheme === "dark";
    const ink = isDark ? "#fafafa" : "#171717";
    const grid = isDark ? "#262626" : "#e5e5e5";
    const surface = isDark ? "#171717" : "#ffffff";

    const total = useMemo(() => data.reduce((n, d) => n + d.value, 0), [data]);
    const peak = useMemo(() => Math.max(...data.map((d) => d.value), 0), [data]);

    // A flat series still needs a scale, or every point divides by zero. `1` gives
    // the zero case a real axis to sit on rather than a collapsed one.
    const yMax = useMemo(() => niceCeiling(peak), [peak]);

    const plotW = Math.max(width - PAD.left - PAD.right, 0);
    const plotH = height - PAD.top - PAD.bottom;

    const points = useMemo(() => {
        if (data.length === 0 || plotW <= 0) return [];
        const stepX = data.length > 1 ? plotW / (data.length - 1) : 0;
        return data.map((d, i) => ({
            ...d,
            x: PAD.left + i * stepX,
            y: PAD.top + plotH - (d.value / yMax) * plotH,
        }));
    }, [data, plotW, plotH, yMax]);

    const linePath = useMemo(
        () => points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" "),
        [points],
    );

    const areaPath = useMemo(() => {
        if (points.length === 0) return "";
        const base = PAD.top + plotH;
        const first = points[0]!;
        const last = points[points.length - 1]!;
        return `${linePath} L${last.x.toFixed(2)} ${base} L${first.x.toFixed(2)} ${base} Z`;
    }, [points, linePath, plotH]);

    const onPointerMove = useCallback(
        (e: React.PointerEvent<SVGSVGElement>) => {
            if (points.length === 0) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            // Nearest point, so the reader only has to be closest rather than
            // dead-centre on a 2px line.
            let best = 0;
            let bestD = Infinity;
            for (let i = 0; i < points.length; i++) {
                const d = Math.abs(points[i]!.x - x);
                if (d < bestD) { bestD = d; best = i; }
            }
            setHover(best);
        },
        [points],
    );

    const onKeyDown = (e: React.KeyboardEvent<SVGSVGElement>) => {
        if (points.length === 0) return;
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            const delta = e.key === "ArrowRight" ? 1 : -1;
            setHover((h) => {
                const next = (h ?? (delta > 0 ? -1 : points.length)) + delta;
                return Math.min(Math.max(next, 0), points.length - 1);
            });
        }
    };

    const active = hover !== null ? points[hover] : undefined;
    const lastPoint = points[points.length - 1];

    return (
        <div ref={wrapRef} className={cn("relative w-full", className)}>
            {width > 0 && points.length > 0 && (
                <svg
                    width={width}
                    height={height}
                    role="img"
                    tabIndex={0}
                    aria-label={`Daily ${unit} activity. ${total} in total over ${data.length} days.`}
                    onPointerMove={onPointerMove}
                    onPointerLeave={() => setHover(null)}
                    onBlur={() => setHover(null)}
                    onKeyDown={onKeyDown}
                    className="touch-none outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:focus-visible:ring-neutral-600"
                >
                    <defs>
                        <linearGradient id={`fill-${clipId}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={ink} stopOpacity={0.12} />
                            <stop offset="100%" stopColor={ink} stopOpacity={0.01} />
                        </linearGradient>
                    </defs>

                    {/* Gridlines and y ticks. Two lines only - the baseline and the
                        top - because a single small series does not need five. */}
                    {[0, yMax].map((v) => {
                        const y = PAD.top + plotH - (v / yMax) * plotH;
                        return (
                            <g key={v}>
                                <line
                                    x1={PAD.left}
                                    x2={width - PAD.right}
                                    y1={y}
                                    y2={y}
                                    stroke={grid}
                                    strokeWidth={1}
                                />
                                <text
                                    x={PAD.left - 8}
                                    y={y + 3}
                                    textAnchor="end"
                                    className="fill-neutral-400 text-[10px] tabular-nums dark:fill-neutral-500"
                                >
                                    {v}
                                </text>
                            </g>
                        );
                    })}

                    <path d={areaPath} fill={`url(#fill-${clipId})`} />
                    <path
                        d={linePath}
                        fill="none"
                        stroke={ink}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* The crosshair. Behind the marker so the marker stays on top. */}
                    {active && (
                        <line
                            x1={active.x}
                            x2={active.x}
                            y1={PAD.top}
                            y2={PAD.top + plotH}
                            stroke={grid}
                            strokeWidth={1}
                        />
                    )}

                    {/* End marker, and the hovered one. Both carry a 2px surface ring
                        so they read where they sit on the line. */}
                    {lastPoint && !active && (
                        <circle cx={lastPoint.x} cy={lastPoint.y} r={4} fill={ink} stroke={surface} strokeWidth={2} />
                    )}
                    {active && (
                        <circle cx={active.x} cy={active.y} r={4.5} fill={ink} stroke={surface} strokeWidth={2} />
                    )}

                    {/* First and last date, so the window is unambiguous without a
                        tick on every day. */}
                    <text
                        x={PAD.left}
                        y={height - 6}
                        className="fill-neutral-400 text-[10px] dark:fill-neutral-500"
                    >
                        {formatDay(data[0]!.date)}
                    </text>
                    <text
                        x={width - PAD.right}
                        y={height - 6}
                        textAnchor="end"
                        className="fill-neutral-400 text-[10px] dark:fill-neutral-500"
                    >
                        {formatDay(data[data.length - 1]!.date)}
                    </text>
                </svg>
            )}

            {/* Values lead, label follows - the reader has the date and wants the
                number. Positioned in HTML rather than SVG so it can never be
                clipped by the plot box. */}
            {active && (
                <div
                    className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-neutral-200 bg-white px-2 py-1 shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
                    style={{
                        left: Math.min(Math.max(active.x, 48), Math.max(width - 48, 48)),
                        top: Math.max(active.y - 8, 12),
                    }}
                >
                    <p className="text-xs font-semibold text-neutral-900 tabular-nums dark:text-white">
                        {active.value} {active.value === 1 ? unit : `${unit}s`}
                    </p>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                        {formatDay(active.date, true)}
                    </p>
                </div>
            )}

            {/* The honest zero state, INSIDE the plot rather than instead of it.
                The axes, the dates and the baseline are all real; there is simply
                nothing on them yet. */}
            {total === 0 && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <p className="rounded-full bg-white/80 px-3 py-1 text-xs text-neutral-500 backdrop-blur-sm dark:bg-neutral-900/80 dark:text-neutral-400">
                        No activity in the last {data.length} days
                    </p>
                </div>
            )}
        </div>
    );
}

/** Round the top of the axis to something a reader can divide by. */
function niceCeiling(peak: number): number {
    if (peak <= 0) return 1;
    if (peak <= 5) return peak;
    const mag = 10 ** Math.floor(Math.log10(peak));
    return Math.ceil(peak / mag) * mag;
}

/** `2026-08-29` -> `29 Aug`. Parsed as UTC so the label never slips a day. */
function formatDay(date: string, long = false): string {
    const parsed = new Date(`${date}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        ...(long ? { weekday: "short" } : {}),
        timeZone: "UTC",
    });
}

export default ActivityChart;
