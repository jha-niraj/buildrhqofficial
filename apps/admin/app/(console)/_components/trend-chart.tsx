"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@repo/ui/components/ui/chart"

// ─────────────────────────────────────────────────────────────────────────────
// One daily-series line chart, shared by the dashboard and analytics (ADM-27,
// ADM-30). Extracted the moment there was a second caller rather than copied -
// the two pages chart the same two series, and a divergent axis or empty state
// between them would read as two different measurements.
//
// `recharts` is a direct dependency of apps/admin, pinned to the same ^3.6.0 as
// `packages/ui` and `apps/main` so pnpm links one copy from the store. It has
// to be direct: pnpm's strict node_modules means a transitive dep of `@repo/ui`
// is not importable, and the shared `ChartContainer` takes a recharts chart as
// its child, so the consumer needs the primitives.
//
// Strokes come from a neutral token rather than a named hue - `CLAUDE.md` puts
// the console on a monochrome palette, and a chart is the easiest place for a
// stray brand colour to creep back in.
//
// The series this renders is DENSE: `denseDailySeries` in
// `actions/main/analytics.action.ts` fills absent days with `0`. That matters
// here because recharts spaces points evenly - a sparse series would draw three
// sign-ups three weeks apart as three adjacent points, which is a line of the
// wrong shape, not merely the wrong labels.
// ─────────────────────────────────────────────────────────────────────────────

/** Compact axis label: "2026-08-27" -> "27 Aug". */
export function shortDate(value: string): string {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

export function TrendChart<K extends string>({
    title,
    subtitle,
    data,
    dataKey,
    emptyLabel,
    footer,
    height = "h-56",
}: {
    title: string
    subtitle: string
    data: Array<{ date: string } & Record<K, number>>
    dataKey: K
    emptyLabel: string
    /** Rendered under the chart. Omit when the total says nothing useful. */
    footer?: React.ReactNode
    height?: string
}) {
    // Two different kinds of "nothing", and they must not look alike:
    //
    //   data.length === 0   we have no series at all (a failed or unauthorised
    //                       fetch) - say so, draw nothing.
    //   all values === 0    we DO have a series and every day really was zero -
    //                       that is a measurement and it gets a real, flat line.
    //
    // Drawing an axis for the first case claims a measurement that never
    // happened; hiding the second throws away a true answer.
    const hasSeries = data.length > 0
    const total = data.reduce((acc, row) => acc + (row[dataKey] as number), 0)

    return (
        <div className="min-w-0 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-4">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>
            </div>

            {hasSeries ? (
                <ChartContainer
                    config={{ [dataKey]: { label: title, color: "var(--chart-ink)" } }}
                    className={`aspect-auto w-full ${height} [--chart-ink:#171717] dark:[--chart-ink:#e5e5e5]`}
                >
                    <LineChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            // A dense 30-day series would otherwise print 30
                            // overlapping labels; recharts drops ticks to honour this.
                            minTickGap={28}
                            tickFormatter={shortDate}
                        />
                        <YAxis
                            width={40}
                            tickLine={false}
                            axisLine={false}
                            // Counts and credit amounts are whole numbers here; a
                            // "0.5 users" tick is noise.
                            allowDecimals={false}
                        />
                        <ChartTooltip content={<ChartTooltipContent labelFormatter={(l) => shortDate(String(l))} />} />
                        <Line
                            type="monotone"
                            dataKey={dataKey}
                            stroke="var(--chart-ink)"
                            strokeWidth={2}
                            // No dot per point on a 30-day series - it reads as noise.
                            // The active dot still marks whatever the tooltip is on.
                            dot={false}
                            activeDot={{ r: 4 }}
                        />
                    </LineChart>
                </ChartContainer>
            ) : (
                <div className={`flex ${height} items-center justify-center rounded-lg border border-dashed border-neutral-200 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400`}>
                    {emptyLabel}
                </div>
            )}

            {hasSeries && (
                <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                    {footer ?? `${total.toLocaleString()} total over the period`}
                </p>
            )}
        </div>
    )
}
