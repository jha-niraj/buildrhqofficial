'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
} from 'recharts'
import { Button } from '@repo/ui/components/ui/button'
import { AnimatedIcon } from '@repo/ui/components/animated-icons'
import { cn } from '@repo/ui/lib/utils'
import { getMyMockStats, type MyMockStats } from '@/actions/(main)/mockvoice/stats.action'
import { MOCK_CATEGORIES } from '../voice/_constants/mock-categories'

/**
 * The signed-in user's own practice. MK-4 in plan/mock/tasks.md.
 *
 * ── The empty state is the DEFAULT, not an edge case ─────────────────────────
 * `mock_voice_session` holds zero rows, so every user arrives here with nothing.
 * A dashboard of zeroes and flat charts would be the normal experience, which is
 * why the no-sessions branch is a real screen with one obvious action rather
 * than a grid of empty cards.
 */

const labelFor = (value: string) =>
    MOCK_CATEGORIES.find((c) => c.value === value)?.label ?? value
const iconFor = (value: string) =>
    MOCK_CATEGORIES.find((c) => c.value === value)?.icon ?? 'learning'

export function MyPractice() {
    const [stats, setStats] = useState<MyMockStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let alive = true
        getMyMockStats().then((r) => {
            if (!alive) return
            setStats(r.success ? r.data : null)
            setLoading(false)
        })
        return () => { alive = false }
    }, [])

    if (loading) {
        return (
            <div className="mt-6 space-y-4">
                <div className="grid gap-3 sm:grid-cols-4">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-[74px] animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800" />
                    ))}
                </div>
                <div className="h-72 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800" />
            </div>
        )
    }

    if (!stats || stats.total === 0) {
        return (
            <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 px-6 py-16 text-center dark:border-neutral-700">
                <AnimatedIcon name="voice" size={44} motion="always" className="mx-auto mb-4 text-neutral-500 dark:text-neutral-400" />
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    You have not practised yet
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                    A mock interview is a real conversation with an AI interviewer: it asks
                    follow-ups, you answer out loud, and afterwards you get a transcript and
                    a breakdown of how you did. Your sessions and scores will chart here.
                </p>
                <Button asChild className="mt-6 cursor-pointer">
                    <Link href="/mock/voice">Start your first interview</Link>
                </Button>
            </div>
        )
    }

    const { total, completed, minutes, averageScore, scoredSessions, streak, trend, byCategory } = stats
    const maxCat = Math.max(...byCategory.map((c) => c.sessions), 1)

    return (
        <div className="mt-6 space-y-8">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Sessions" value={total.toLocaleString()} sub={`${completed} completed`} />
                <Stat label="Practice time" value={minutes > 0 ? `${minutes}m` : '-'} sub={minutes > 0 ? 'across all sessions' : 'not recorded yet'} />
                {/* The SAMPLE is shown beside the average. "4.2" from one session
                    and "4.2" from forty are different claims, and only one of them
                    is worth acting on. */}
                <Stat
                    label="Average score"
                    value={averageScore !== null ? `${averageScore}/5` : '-'}
                    sub={scoredSessions > 0 ? `from ${scoredSessions} scored` : 'none scored yet'}
                />
                <Stat label="Streak" value={streak > 0 ? `${streak}d` : '-'} sub={streak > 0 ? 'consecutive days' : 'practise today to start one'} />
            </div>

            <section>
                <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Practice over time</h2>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">Sessions and average score, last 30 days.</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
                        <span className="inline-flex items-center gap-1.5">
                            <span className="h-0.5 w-4 rounded bg-neutral-900 dark:bg-neutral-100" />
                            Sessions <span className="text-neutral-500">(left)</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <span
                                className="h-0.5 w-4 rounded text-neutral-500 dark:text-neutral-400"
                                style={{ backgroundImage: 'repeating-linear-gradient(90deg,currentColor 0 4px,transparent 4px 7px)' }}
                            />
                            Score <span className="text-neutral-500">(right)</span>
                        </span>
                    </div>
                </div>
                {/* recharts writes real SVG attributes and cannot read `currentColor`,
                    so the inks are CSS variables set here and flipped for dark mode. */}
                <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800 [--mk-axis:#525252] [--mk-grid:#e5e5e5] [--mk-ink:#171717] dark:[--mk-axis:#a3a3a3] dark:[--mk-grid:#262626] dark:[--mk-ink:#f5f5f5]">
                    <div className="h-[22rem] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                <CartesianGrid stroke="var(--mk-grid)" strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(d: string) => new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                    tick={{ fontSize: 12, fill: 'var(--mk-axis)' }}
                                    axisLine={false} tickLine={false} minTickGap={28}
                                />
                                {/* TWO axes. Sessions are single digits and a score is 1-5
                                    on a different meaning entirely - sharing one axis would
                                    flatten whichever is smaller, which is the bug the
                                    credits chart had. */}
                                <YAxis
                                    yAxisId="sessions" allowDecimals={false} width={44}
                                    tick={{ fontSize: 12, fill: 'var(--mk-axis)' }} axisLine={false} tickLine={false}
                                />
                                <YAxis
                                    yAxisId="score" orientation="right" domain={[0, 5]} width={44}
                                    tick={{ fontSize: 12, fill: 'var(--mk-axis)' }} axisLine={false} tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ stroke: 'var(--mk-axis)', strokeDasharray: '3 3' }}
                                    contentStyle={{
                                        background: 'var(--popover)', border: '1px solid var(--border)',
                                        borderRadius: 10, fontSize: 12, color: 'var(--popover-foreground)',
                                    }}
                                    labelFormatter={(d) => new Date(String(d)).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}
                                    formatter={(v, name) => [v === null ? 'not scored' : String(v), String(name)] as [string, string]}
                                />
                                <Line
                                    yAxisId="sessions" type="monotone" dataKey="sessions" name="Sessions"
                                    stroke="var(--mk-ink)" strokeWidth={2} dot={false} activeDot={{ r: 4 }}
                                />
                                {/* `connectNulls`: an unscored day is a GAP in the score
                                    series, not a zero. Joining across it would invent a
                                    score the user never received. */}
                                <Line
                                    yAxisId="score" type="monotone" dataKey="score" name="Score"
                                    stroke="var(--mk-axis)" strokeWidth={2} strokeDasharray="4 3"
                                    dot={false} activeDot={{ r: 4 }} connectNulls={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            {byCategory.length > 0 && (
                <section>
                    <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Practice by category</h2>
                    <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
                        {byCategory.map((c) => (
                            <div key={c.category} className="flex items-center gap-4 border-b border-neutral-200 px-4 py-3 last:border-b-0 dark:border-neutral-800">
                                <AnimatedIcon name={iconFor(c.category)} size={18} className="shrink-0 text-neutral-900 dark:text-neutral-100" />
                                <span className="w-40 shrink-0 truncate text-sm text-neutral-900 dark:text-neutral-100">{labelFor(c.category)}</span>
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                                    <div
                                        className="h-full rounded-full bg-neutral-900 dark:bg-neutral-100"
                                        style={{ width: `${Math.max((c.sessions / maxCat) * 100, 3)}%` }}
                                    />
                                </div>
                                <span className="w-10 shrink-0 text-right font-mono text-xs text-neutral-600 dark:text-neutral-400">{c.sessions}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className={cn('rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-800')}>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{value}</p>
            {sub && <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">{sub}</p>}
        </div>
    )
}
