import { Suspense } from 'react';
import { Metadata } from 'next';
import { getSession } from '@repo/auth'
import { headers } from 'next/headers';
import {
    getMyKnowMeProfile, hasKnowMeProfile
} from '@/actions/(main)/knowme/profile.action';
import KnowMeDashboard from './_components/knowme-dashboard';
import KnowMeDashboardSkeleton from './_components/knowme-dashboard-skeleton';
import KnowMeLandingPage from './_components/knowme-landing';

export const metadata: Metadata = {
    title: 'KnowMe - AI Portfolio Assistant | ShipItHQ',
    description: 'Create an AI-powered assistant that knows everything about your professional profile. Let visitors ask questions about your work 24/7.',
};

export default async function KnowMePage() {
    const session = await getSession(headers());

    if (!session?.user?.id) {
        return <KnowMeLandingPage isLoggedIn={false} />;
    }

    // No wrapper. The dashboard is itself a full-height flex column (`h-screen`,
    // retargeted at the shell's `--page-h`), and a `min-h-screen` parent around it
    // only gives the page card a second thing to size against.
    return (
        <Suspense fallback={<KnowMeDashboardSkeleton />}>
            <KnowMeContent />
        </Suspense>
    );
}

async function KnowMeContent() {
    const profileCheck = await hasKnowMeProfile();

    if (!profileCheck.success || !profileCheck.data?.exists) {
        return <KnowMeLandingPage isLoggedIn={true} />;
    }

    if (profileCheck.data.status === 'SETUP') {
        const profileResult = await getMyKnowMeProfile();
        return <KnowMeLandingPage isLoggedIn={true} profile={profileResult.data} />;
    }

    const profileResult = await getMyKnowMeProfile();

    if (!profileResult.success || !profileResult.data) {
        return <KnowMeLandingPage isLoggedIn={true} />;
    }

    return <KnowMeDashboard profile={profileResult.data} />;
}