// Reuses the exact skeleton a public KnowMe page already renders while its own data
// resolves, the same way /profile does. Two hand-written copies of a layout drift
// the moment the page changes; one definition cannot. Placeholder counts here are
// therefore always whatever the component itself decided to show.
import PublicChatSkeleton from "./_components/public-chat-skeleton";

export default function Loading() {
    return <PublicChatSkeleton />;
}
