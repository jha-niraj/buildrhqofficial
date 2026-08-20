// The live profile surface.
//
// Both routes - `/profile` and `/profile/[username]` - render `ProfileView`.
// Everything either of them needs is exported here.
//
// This barrel used to re-export a second, older generation of profile UI as
// well: a header, a tab bar, a sidebar and eight tab components, which existed
// only to render somebody else's profile and rendered it as a visibly different
// page. Those files are still on disk pending Niraj's call - see
// `plan/cleanup/candidates.md`, Group E - but they are no longer exported, so
// nothing can reach them by accident and `tsc` no longer type-checks them into
// the build.

export { ProfileView } from "./profile-view";
export type {
    ProfileViewProps, ProfileViewData, ProfileViewStats, ProfileViewSkill,
} from "./profile-view";
export { ProfileSkeleton } from "./profile-view-skeleton";

export { ShareProfileModal } from "./modals/share-profile-modal";
export { EditProfileModal } from "./modals/edit-profile-modal";
