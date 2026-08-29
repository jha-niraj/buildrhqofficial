import { Suspense } from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@repo/auth'
import { headers } from 'next/headers';
import {
    getKnowMeAnalytics, hasKnowMeProfile
} from '@/actions/(main)/knowme';
import KnowMeAnalytics from './_components/knowme-analytics';
import AnalyticsSkeleton from './_components/analytics-skeleton';

export const metadata: Metadata = {
    title: 'KnowMe Analytics | ShipItHQ',
    description: 'View insights and analytics for your AI-powered portfolio assistant.',
};

interface Props {
    searchParams: Promise<{ range?: string }>;
}

const RANGES = ["7d", "30d", "90d", "all"] as const;
type Range = typeof RANGES[number];

/** An unknown `?range=` is not an error - it is a stale bookmark. Fall back. */
function parseRange(value: string | undefined): Range {
    return RANGES.includes(value as Range) ? (value as Range) : "30d";
}

export default async function KnowMeAnalyticsPage({ searchParams }: Props) {
    const session = await getSession(headers());
    const params = await searchParams;

    if (!session?.user?.id) {
        redirect('/login?callbackUrl=/knowme/analytics');
    }

    return (
        <Suspense fallback={<AnalyticsSkeleton />}>
            <AnalyticsContent timeRange={parseRange(params.range)} />
        </Suspense>
    );
}

async function AnalyticsContent({ timeRange }: { timeRange: Range }) {
    const profileCheck = await hasKnowMeProfile();

    // Only "there is no profile at all" sends you away, because there is genuinely
    // nothing to show and /knowme is where you make one.
    //
    // This used to also redirect on `status !== 'ACTIVE'`, which meant that a
    // profile sitting at ERROR - the state a failed embedding job leaves it in -
    // bounced every visit straight back to the dashboard. The sidebar had a link
    // that appeared to do nothing, on the one screen that could have shown the
    // owner what was wrong. `getKnowMeAnalytics` has never had that restriction
    // and answers fine for any status. See KM-10.
    if (!profileCheck.success || !profileCheck.data?.exists) {
        redirect('/knowme');
    }

    const analyticsResult = await getKnowMeAnalytics(timeRange);

    if (!analyticsResult.success || !analyticsResult.data) {
        redirect('/knowme');
    }

    return (
        <KnowMeAnalytics
            analytics={analyticsResult.data}
            initialRange={timeRange}
            profileStatus={profileCheck.data.status}
        />
    );
}
