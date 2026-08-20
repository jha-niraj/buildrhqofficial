// Reuses the exact skeleton the client renders while its data resolves, so the
// route transition and the loading state are pixel-identical and the page only
// paints once.
import { ProfileSkeleton } from "@/components/profile/profile-view-skeleton";

export default function Loading() {
    return <ProfileSkeleton />;
}
