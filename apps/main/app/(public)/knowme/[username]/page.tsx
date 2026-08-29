import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getSession } from '@repo/auth';
import { getKnowMeProfileByUsername } from '@/actions/(main)/knowme';
import PublicChatInterface from './_components/public-chat-interface';
import PublicChatSkeleton from './_components/public-chat-skeleton';

interface Props {
    params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { username } = await params;
    const result = await getKnowMeProfileByUsername(username);

    if (!result.success || !result.data) {
        return {
            title: 'Assistant not available | KnowMe',
            // A username that resolves to nothing should not leave a crawlable
            // page behind at that address.
            robots: { index: false, follow: false },
        };
    }

    const profile = result.data;
    const name = profile.user.name || profile.user.username || 'User';

    return {
        title: `Chat with ${name}'s AI | KnowMe`,
        description: `Ask questions about ${name}'s skills, projects, and experience. Powered by KnowMe AI.`,
        openGraph: {
            title: `Chat with ${name}'s AI`,
            description: profile.user.bio || `Learn about ${name}'s professional background through AI-powered chat.`,
            images: profile.user.image ? [profile.user.image] : [],
        },
    };
}

export default async function PublicKnowMePage({ params }: Props) {
    const { username } = await params;

    // This route lives under `(public)`, NOT `(main)` - see app/(public)/layout.tsx
    // for why a stranger must not be handed the application shell.
    return (
        <Suspense fallback={<PublicChatSkeleton />}>
            <PublicChatContent username={username} />
        </Suspense>
    );
}

async function PublicChatContent({ username }: { username: string }) {
    const result = await getKnowMeProfileByUsername(username);

    if (!result.success || !result.data) {
        notFound();
    }

    // Whether the VIEWER is signed in, not whether the owner is. The page offers
    // links into the app (the owner's profile, "contact them directly"), and
    // every one of those routes is behind CR-10's session gate - so showing them
    // to an anonymous visitor is an invitation to a sign-in wall. They are
    // rendered only for someone who can actually follow them.
    const session = await getSession(headers());

    return <PublicChatInterface profile={result.data} viewerSignedIn={!!session?.user?.id} />;
}