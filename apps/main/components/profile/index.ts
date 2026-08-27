// The live profile surface.
//
// Both routes - `/profile` and `/profile/[username]` - render `ProfileView`.
// Everything either of them needs is exported here.
//
// This barrel used to re-export a second, older generation of profile UI as
// well: a header, a tab bar, a sidebar and eight tab components, which existed
// only to render somebody else's profile and rendered it as a visibly different
// page. Deleted on 2026-08-27 - 13 files, ~4,636 lines - see
// `plan/cleanup/candidates.md`, Group E. Recoverable from git history if the
// tabbed layout is ever wanted back.

export { ProfileView } from "./profile-view";
export type {
    ProfileViewProps, ProfileViewData, ProfileViewStats, ProfileViewSkill,
} from "./profile-view";
export { ProfileSkeleton } from "./profile-view-skeleton";

export { ShareProfileModal } from "./modals/share-profile-modal";
export { EditProfileModal } from "./modals/edit-profile-modal";
