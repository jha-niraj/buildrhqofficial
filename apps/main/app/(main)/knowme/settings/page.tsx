import { Suspense } from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@repo/auth'
import { headers } from 'next/headers';
import {
    getMyKnowMeProfile, getApiConfig
} from '@/actions/(main)/knowme';
import KnowMeSettings from './_components/knowme-settings';
import SettingsSkeleton from './_components/settings-skeleton';

export const metadata: Metadata = {
    title: 'KnowMe Settings | ShipItHQ',
    description: 'Configure your AI-powered portfolio assistant settings.',
};

interface Props {
    searchParams: Promise<{ tab?: string }>;
}

export default async function KnowMeSettingsPage({ searchParams }: Props) {
    const session = await getSession(headers());
    const params = await searchParams;

    if (!session?.user?.id) {
        redirect('/login?callbackUrl=/knowme/settings');
    }

    return (
        <div className="min-h-screen">
            <Suspense fallback={<SettingsSkeleton />}>
                <SettingsContent initialTab={params.tab} />
            </Suspense>
        </div>
    );
}

async function SettingsContent({ initialTab }: { initialTab?: string }) {
    const [profileResult, apiConfigResult] = await Promise.all([
        getMyKnowMeProfile(),
        getApiConfig(),
    ]);

    if (!profileResult.success || !profileResult.data) {
        redirect('/knowme');
    }

    return (
        <KnowMeSettings
            profile={profileResult.data}
            apiConfig={apiConfigResult.success ? apiConfigResult.data : null}
            initialTab={initialTab}
        />
    );
}