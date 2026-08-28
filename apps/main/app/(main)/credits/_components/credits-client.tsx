'use client'

import Link from 'next/link'
import { Button } from '@repo/ui/components/ui/button'
import { ScrollArea } from '@repo/ui/components/ui/scroll-area'
import { Badge } from '@repo/ui/components/ui/badge'
import { AnimatedIcon } from '@repo/ui/components/animated-icons'
import { cn } from '@repo/ui/lib/utils'
import { Plus, Receipt, Gift } from 'lucide-react'
import type { CreditsOverview } from '@/actions/(main)/credits/credits.action'

/**
 * Balance, purchases, and the full ledger. CR-11.
 *
 * The ledger is the point. Definition-of-done 2 promises every credit has a row
 * explaining where it came from; this is the first place a user can read them.
 */

const CURRENCY_SYMBOL: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }

function money(amount: string, currency: string) {
    // `amount` is a string because the column is `decimal(10,2)` - see the note
    // on CreditPurchaseRow. Parse once, here, and keep two places so 12.5 does
    // not render as "12.5" next to 12.00.
    const n = Number.parseFloat(amount)
    const symbol = CURRENCY_SYMBOL[currency] ?? ''
    return Number.isFinite(n) ? `${symbol}${n.toFixed(2)}` : `${symbol}${amount}`
}

function when(d: Date | string) {
    return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function CreditsClient({ data, error }: { data: CreditsOverview | null; error: string | null }) {
    if (error || !data) {
        return (
            <div className="flex h-dvh items-center justify-center p-8">
                <div className="max-w-sm text-center">
                    <AnimatedIcon name="alert" size={40} motion="always" className="mx-auto mb-4 text-neutral-500 dark:text-neutral-400" />
                    <h1 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Could not load your credits</h1>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{error ?? 'Something went wrong.'}</p>
                </div>
            </div>
        )
    }

    const { balance, totalSpent, totalAdded, purchases, ledger } = data

    return (
        <div className="flex h-dvh flex-col overflow-hidden">
            <header className="shrink-0 border-b border-neutral-200 px-6 py-5 dark:border-neutral-800">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Credits</h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Your balance, what you have bought, and where every credit went.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Bounty lives on BOTH pages: it is an offer, and an offer
                            belongs next to the price as well as in the wallet. */}
                        <Link href="/purchase?bounty=1">
                            <Button variant="outline" size="sm" className="cursor-pointer gap-1.5">
                                <Gift className="h-4 w-4" />
                                Bounty Program
                            </Button>
                        </Link>
                        <Link href="/purchase">
                            <Button size="sm" className="cursor-pointer gap-1.5">
                                <Plus className="h-4 w-4" />
                                Buy credits
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <Stat label="Available" value={balance.toLocaleString()} emphasis />
                    <Stat label="Total added" value={totalAdded.toLocaleString()} />
                    <Stat label="Total spent" value={totalSpent.toLocaleString()} />
                </div>
            </header>

            <ScrollArea reflow className="min-h-0 min-w-0 flex-1">
                <div className="space-y-8 p-6">
                    <section>
                        <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Purchases</h2>
                        {purchases.length === 0 ? (
                            <Empty
                                icon="document"
                                title="No purchases yet"
                                body="Packs and custom top-ups appear here with their receipt."
                            />
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-neutral-50 text-left text-xs text-neutral-500 dark:bg-neutral-900/50 dark:text-neutral-400">
                                            <tr>
                                                <th className="px-4 py-2.5 font-medium">Date</th>
                                                <th className="px-4 py-2.5 font-medium">Credits</th>
                                                <th className="px-4 py-2.5 font-medium">Paid</th>
                                                <th className="px-4 py-2.5 font-medium">Status</th>
                                                <th className="px-4 py-2.5 font-medium">Receipt</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {purchases.map((p) => (
                                                <tr key={p.id} className="border-t border-neutral-200 dark:border-neutral-800">
                                                    <td className="whitespace-nowrap px-4 py-3 text-neutral-600 dark:text-neutral-400">{when(p.createdAt)}</td>
                                                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">+{p.credits.toLocaleString()}</td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-neutral-900 dark:text-neutral-100">{money(p.amount, p.currency)}</td>
                                                    <td className="px-4 py-3">
                                                        {/* A PENDING payment is not a purchase yet, and is
                                                            counted in no total on this page. */}
                                                        <Badge
                                                            variant="secondary"
                                                            className={cn(
                                                                'text-[10px]',
                                                                p.status === 'COMPLETED'
                                                                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                                                                    : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                                                            )}
                                                        >
                                                            {p.status.toLowerCase()}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                                                        {p.paymentId ?? '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </section>

                    <section>
                        <h2 className="mb-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">History</h2>
                        <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
                            Every credit added or spent, and what for.
                        </p>
                        {ledger.length === 0 ? (
                            <Empty
                                icon="empty-search"
                                title="Nothing here yet"
                                body="Spending and top-ups will show up as you use the product."
                            />
                        ) : (
                            <div className="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
                                {ledger.map((row) => {
                                    // Sign lives on the amount (`SPEND -3`), so the
                                    // sign is read from the number and the number is
                                    // printed absolute - otherwise it renders "--3".
                                    const spent = row.amount < 0
                                    return (
                                        <div key={row.id} className="flex items-center gap-4 px-4 py-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm text-neutral-900 dark:text-neutral-100">{row.description}</p>
                                                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                                                    {row.type.toLowerCase()} · {when(row.createdAt)}
                                                </p>
                                            </div>
                                            <span
                                                className={cn(
                                                    'shrink-0 font-mono text-sm',
                                                    spent ? 'text-neutral-500 dark:text-neutral-400' : 'text-neutral-900 dark:text-neutral-100'
                                                )}
                                            >
                                                {spent ? '-' : '+'}{Math.abs(row.amount).toLocaleString()}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </ScrollArea>
        </div>
    )
}

function Stat({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
    return (
        <div className="rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
            <p className={cn('mt-1 font-semibold text-neutral-900 dark:text-neutral-100', emphasis ? 'text-2xl' : 'text-lg')}>
                {value}
            </p>
        </div>
    )
}

function Empty({ icon, title, body }: { icon: 'document' | 'empty-search'; title: string; body: string }) {
    return (
        <div className="rounded-xl border border-dashed border-neutral-200 py-12 text-center dark:border-neutral-800">
            <AnimatedIcon name={icon} size={36} motion="always" className="mx-auto mb-3 text-neutral-400 dark:text-neutral-500" />
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{title}</p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{body}</p>
        </div>
    )
}
