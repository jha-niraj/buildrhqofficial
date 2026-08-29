"use client";

/**
 * The pieces every module overview is built from.
 *
 * Seven overview pages (`/practice`, `/projects`, `/mock`, `/pathfinder`, `/ai`,
 * `/jobs`, `/knowme`) were each hand-building their own header, stat cards and
 * empty states, which is why they looked like seven products. One definition
 * cannot drift.
 *
 * The stat tile follows the contract in the dataviz reference: `label` in
 * sentence case with no trailing colon, `value` auto-compacted, an optional
 * `hint` for the denominator, and an optional 12-point sparkline. The delta is
 * deliberately NOT part of it - a percentage change against a period with no
 * rows is arithmetic rather than information, and every module in this product
 * currently has no rows.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { cn } from "@repo/ui/lib/utils";

/** `1284` -> `1,284`; `12934` -> `12.9K`. Big numbers stop being readable in full. */
export function compact(value: number): string {
    if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 10_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toLocaleString();
}

export function OverviewHeader({
    title,
    subtitle,
    actions,
}: {
    title: string;
    subtitle: string;
    actions?: React.ReactNode;
}) {
    return (
        <motion.header
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
        >
            <div className="min-w-0">
                <h1 className="text-xl font-bold text-neutral-900 dark:text-white">{title}</h1>
                <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </motion.header>
    );
}

export function StatTile({
    label,
    value,
    hint,
    icon,
    spark,
    delay = 0,
}: {
    label: string;
    value: number | string;
    /** The denominator, or a unit. Sits beside the value at normal weight. */
    hint?: string;
    icon: React.ReactNode;
    /** 12 points, most recent last. Omitted when there is nothing to trend. */
    spark?: number[];
    delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
        >
            <div className="flex items-start justify-between gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                    {icon}
                </span>
                {spark && spark.some((n) => n > 0) && <Sparkline values={spark} />}
            </div>
            <p className="mt-3 text-2xl font-bold text-neutral-900 tabular-nums dark:text-white">
                {typeof value === "number" ? compact(value) : value}
                {hint && (
                    <span className="ml-1.5 text-sm font-normal text-neutral-500 dark:text-neutral-400">
                        {hint}
                    </span>
                )}
            </p>
            <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
        </motion.div>
    );
}

/**
 * A 12-point trend, drawn only when something in it is non-zero.
 *
 * A flat line at the baseline says nothing a "0" above it has not already said,
 * and twelve of them across a stat row is decoration pretending to be data -
 * which is the specific thing this product's overview pages were doing wrong.
 */
function Sparkline({ values }: { values: number[] }) {
    const w = 56;
    const h = 20;
    const max = Math.max(...values, 1);
    const step = values.length > 1 ? w / (values.length - 1) : 0;
    const d = values
        .map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)} ${(h - (v / max) * h).toFixed(1)}`)
        .join(" ");

    return (
        <svg width={w} height={h} aria-hidden className="shrink-0 overflow-visible">
            <path
                d={d}
                fill="none"
                className="stroke-neutral-400 dark:stroke-neutral-500"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/**
 * A titled panel. `action` is the one link out, never a row of them.
 */
export function OverviewPanel({
    title,
    action,
    delay = 0,
    className,
    children,
}: {
    title: string;
    action?: { label: string; href: string };
    delay?: number;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={cn(
                "rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900",
                className,
            )}
        >
            <div className="mb-4 flex items-baseline justify-between gap-3">
                <h2 className="text-base font-semibold text-neutral-900 dark:text-white">{title}</h2>
                {action && (
                    <Link
                        href={action.href}
                        className="shrink-0 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                    >
                        {action.label}
                    </Link>
                )}
            </div>
            {children}
        </motion.section>
    );
}

/**
 * The one shape an empty region takes across every overview.
 *
 * Says what the surface is for and offers the single action that fills it - the
 * rule from `PRJ-U4`, applied everywhere rather than per module.
 */
export function OverviewEmpty({
    icon,
    title,
    body,
    action,
    secondaryAction,
}: {
    icon: React.ReactNode;
    title: string;
    body: string;
    action?: React.ReactNode;
    secondaryAction?: { label: string; href: string };
}) {
    return (
        <div className="py-10 text-center">
            <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                {icon}
            </span>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">{title}</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500 dark:text-neutral-400">{body}</p>
            {(action || secondaryAction) && (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    {action}
                    {secondaryAction && (
                        <Button asChild variant="outline" size="sm" className="gap-1.5">
                            <Link href={secondaryAction.href}>
                                {secondaryAction.label}
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
