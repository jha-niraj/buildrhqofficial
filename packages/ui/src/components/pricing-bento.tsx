'use client';

import React from 'react';
import { cn } from '@repo/ui/lib/utils';
import { Button } from '@repo/ui/components/ui/button';
import { Badge } from '@repo/ui/components/ui/badge';
import { CheckIcon, SparklesIcon, Zap, Gift, ArrowRight } from 'lucide-react';
import {
    creditPackages,
    formatPrice,
    packagePrice,
    packageOriginalPrice,
    packageSavings,
    type CreditPackage,
    type Currency,
} from '@repo/pricing';

/**
 * The credit-pack grid, shared by the marketing site and the in-app checkout.
 *
 * Both used to keep their own copy with hardcoded tiers, which is how the site
 * ended up advertising 50 credits at ₹49 while the app charged ₹22. Everything
 * rendered here comes from `@repo/pricing`, so the two cannot disagree.
 *
 * Callers supply behaviour, not data:
 *   - `onSelect` renders each CTA as a button (in-app checkout).
 *   - `hrefFor` renders each CTA as a link (marketing site → app checkout).
 * Exactly one is needed; `onSelect` wins if both are passed.
 */

function FilledCheck({ className }: { className?: string }) {
    return (
        <div className={cn('rounded-full bg-neutral-900 p-0.5 text-white', className)}>
            <CheckIcon className="size-3" strokeWidth={3} />
        </div>
    );
}

interface PricingCardProps {
    pkg: CreditPackage;
    currency: Currency;
    className?: string;
    onSelect?: (pkg: CreditPackage) => void;
    hrefFor?: (pkg: CreditPackage) => string;
}

function PricingCard({ pkg, currency, className, onSelect, hrefFor }: PricingCardProps) {
    const price = formatPrice(packagePrice(pkg, currency), currency);
    const original = packageOriginalPrice(pkg, currency);
    const savings = packageSavings(pkg, currency);
    const cta = `Get ${pkg.credits} Credits`;

    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900',
                'transition-all duration-300 hover:border-neutral-300 hover:shadow-xl dark:hover:border-neutral-700',
                'flex flex-col',
                className,
            )}
        >
            <div className="flex items-center gap-3 p-5">
                <Badge
                    variant="secondary"
                    className="bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                >
                    {pkg.badge.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="ml-auto text-xs">
                    <Zap className="mr-1 size-3 text-neutral-900 dark:text-white" />
                    {pkg.credits} Credits
                </Badge>
            </div>

            <div className="flex items-end gap-2 px-5 py-3">
                <span className="font-mono text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    {price}
                </span>
                <span className="pb-1 text-sm text-neutral-500 dark:text-neutral-400">/one-time</span>
                {original !== undefined && savings !== null && (
                    <span className="pb-1 text-sm text-neutral-400 line-through dark:text-neutral-500">
                        {formatPrice(original, currency)}
                    </span>
                )}
            </div>

            {savings !== null && (
                <p className="px-5 pb-1 text-sm font-medium text-neutral-900 dark:text-white">
                    Save {savings}%
                </p>
            )}

            <ul className="grid flex-1 gap-3 p-5 text-sm text-neutral-600 dark:text-neutral-400">
                {pkg.highlights.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                        <FilledCheck />
                        <span>{f}</span>
                    </li>
                ))}
            </ul>

            <div className="p-5 pt-0">
                {onSelect ? (
                    <Button
                        onClick={() => onSelect(pkg)}
                        className="w-full border-0 bg-neutral-900 text-white hover:bg-neutral-800"
                    >
                        {cta}
                        <ArrowRight className="ml-2 size-4" />
                    </Button>
                ) : (
                    <Button asChild variant="outline" className="w-full">
                        <a href={hrefFor?.(pkg) ?? '#'}>
                            {cta}
                            <ArrowRight className="ml-2 size-4" />
                        </a>
                    </Button>
                )}
            </div>
        </div>
    );
}

function FeaturedCard({ pkg, currency, onSelect, hrefFor }: PricingCardProps) {
    const price = formatPrice(packagePrice(pkg, currency), currency);
    const savings = packageSavings(pkg, currency);
    const cta = `Get ${pkg.credits} Credits`;

    return (
        <div
            className={cn(
                'relative w-full overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 dark:border-neutral-200 dark:bg-white',
                'lg:col-span-5',
                'transition-all duration-300 hover:shadow-2xl',
            )}
        >
            <div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)]">
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/2 [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] dark:from-neutral-900/5 dark:to-neutral-900/2">
                    <div
                        aria-hidden="true"
                        className={cn(
                            'absolute inset-0 size-full mix-blend-overlay',
                            'bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px)]',
                            'bg-[size:24px]',
                        )}
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 p-5">
                <Badge className="border-0 bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white">
                    {pkg.badge.toUpperCase()}
                </Badge>
                <Badge
                    variant="outline"
                    className="hidden border-white/20 text-white lg:flex dark:border-neutral-300 dark:text-neutral-900"
                >
                    <SparklesIcon className="me-1 size-3" /> Best Value
                </Badge>
                <div className="ml-auto flex items-center gap-2">
                    <Badge
                        variant="secondary"
                        className="bg-white/10 text-white dark:bg-neutral-900/10 dark:text-neutral-900"
                    >
                        <Zap className="mr-1 size-3 text-white dark:text-neutral-900" />
                        {pkg.credits} Credits
                    </Badge>
                </div>
            </div>

            <div className="flex flex-col p-5 lg:flex-row">
                <div className="pb-4 lg:w-[35%]">
                    <span className="font-mono text-5xl font-bold tracking-tight text-white dark:text-neutral-900">
                        {price}
                    </span>
                    <span className="ml-2 text-sm text-neutral-400 dark:text-neutral-600">/one-time</span>
                    {savings !== null && (
                        <p className="mt-2 text-sm font-medium text-white dark:text-neutral-900">
                            Save {savings}% vs regular
                        </p>
                    )}
                </div>
                <ul className="grid gap-3 text-sm text-neutral-300 lg:w-[65%] dark:text-neutral-700">
                    {pkg.highlights.map((f) => (
                        <li key={f} className="flex items-center gap-3">
                            <div className="rounded-full bg-white p-0.5 text-neutral-900 dark:bg-neutral-900 dark:text-white">
                                <CheckIcon className="size-3" strokeWidth={3} />
                            </div>
                            <span className="leading-relaxed">{f}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="p-5 pt-0">
                {onSelect ? (
                    <Button
                        onClick={() => onSelect(pkg)}
                        size="lg"
                        className="bg-white text-neutral-900 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
                    >
                        {cta}
                        <ArrowRight className="ml-2 size-4" />
                    </Button>
                ) : (
                    <Button
                        asChild
                        size="lg"
                        className="bg-white text-neutral-900 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
                    >
                        <a href={hrefFor?.(pkg) ?? '#'}>
                            {cta}
                            <ArrowRight className="ml-2 size-4" />
                        </a>
                    </Button>
                )}
            </div>
        </div>
    );
}

/**
 * Column spans for the non-featured cards, in order. The featured card takes 5
 * of the 8 columns, so the first sibling takes the remaining 3 and the rest
 * pair up. Cards past the end of this list fall back to half width.
 */
const CARD_SPANS = ['lg:col-span-3', 'lg:col-span-4', 'lg:col-span-4', 'lg:col-span-8'];

export interface PricingBentoProps {
    currency?: Currency;
    /** In-app: render CTAs as buttons and hand the chosen pack back. */
    onSelect?: (pkg: CreditPackage) => void;
    /** Marketing site: render CTAs as links to the app's checkout. */
    hrefFor?: (pkg: CreditPackage) => string;
    showFreeCredits?: boolean;
    onRequestFreeCredits?: () => void;
    /** Where "Claim Free Credits" points when no handler is supplied. */
    freeCreditsHref?: string;
}

export function PricingBento({
    currency = 'INR',
    onSelect,
    hrefFor,
    showFreeCredits = true,
    onRequestFreeCredits,
    freeCreditsHref = '/purchase',
}: PricingBentoProps) {
    const featured = creditPackages.find((p) => p.popular) ?? creditPackages[0];
    const rest = creditPackages.filter((p) => p !== featured);

    if (!featured) return null;

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-8">
            <FeaturedCard
                pkg={featured}
                currency={currency}
                onSelect={onSelect}
                hrefFor={hrefFor}
            />

            {rest.map((pkg, i) => (
                <PricingCard
                    key={pkg.slug}
                    pkg={pkg}
                    currency={currency}
                    className={CARD_SPANS[i] ?? 'lg:col-span-4'}
                    onSelect={onSelect}
                    hrefFor={hrefFor}
                />
            ))}

            {showFreeCredits && (
                <div
                    className={cn(
                        'relative w-full overflow-hidden rounded-2xl border',
                        'border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/40',
                        'lg:col-span-8',
                        'transition-all duration-300 hover:shadow-xl',
                    )}
                >
                    <div className="flex flex-col items-center justify-between gap-4 p-6 md:flex-row">
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl bg-neutral-900 p-3 dark:bg-white">
                                <Gift className="size-6 text-white dark:text-neutral-900" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                                    Get Free Credits!
                                </h3>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    Share about us on LinkedIn or Twitter and earn up to 50 free credits
                                </p>
                            </div>
                        </div>
                        {onRequestFreeCredits ? (
                            <Button
                                onClick={onRequestFreeCredits}
                                className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                            >
                                <Gift className="mr-2 size-4" />
                                Claim Free Credits
                            </Button>
                        ) : (
                            <Button
                                asChild
                                className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                            >
                                <a href={freeCreditsHref}>
                                    <Gift className="mr-2 size-4" />
                                    Claim Free Credits
                                </a>
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default PricingBento;
