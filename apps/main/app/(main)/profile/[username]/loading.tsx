// The public profile renders the SAME layout as your own (see
// components/profile/profile-view.tsx), so it gets the same skeleton. It used to
// carry a hand-built one shaped like the old tabbed layout, which meant the page
// reflowed from one design into another as the data landed.
import { ProfileSkeleton } from "@/components/profile/profile-view-skeleton";

export default function Loading() {
    return <ProfileSkeleton />;
}
