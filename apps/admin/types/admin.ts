// ============================================
// SHARED ADMIN TYPES AND INTERFACES
// ============================================
//
// Permission types (`PermissionLevel`, `AdminPermissions`, `AdminPermission`)
// live in `@/lib/navigation`, not here - see plan/admin/tasks.md ADM-7.
//
// Kept here only: types actually imported by more than one file. Every other
// export this file used to carry (User, MainPlatformStats, Feedback,
// CreditTransaction, CreditRequest, CreditTransfer, Payment,
// HiringPlatformStats, Company, UniversityPlatformStats, University,
// StudentLink, GlobalDashboardStats, ChartData) had zero real importers -
// every page that looked like it used one actually declared its own
// same-named LOCAL interface and never imported this file's version. Deleted
// 2026-08-24, approved by Niraj.

/**
 * The one response shape every admin action returns. Declared once, here -
 * previously this exact interface was copy-pasted into five different action
 * files, each importable under the same name, which is how a call site could
 * end up importing the wrong one with no type error to catch it. See
 * plan/admin/tasks.md ADM-6.
 *
 * A discriminated union: when `success` is `true`, `data` is required (not
 * optional), so a caller that forgets to check `.success` before reading
 * `.data` gets a real type error instead of `T | undefined` silently leaking
 * through.
 */
export type AdminResponse<T = unknown> =
    | { success: true; data: T }
    | { success: false; error: string }

// `DatabaseStats` and `SystemHealth` were removed with the /system/database page and the
// two actions that produced them. They had no other consumer.

export interface StatsData {
    totalUsers?: number
    newUsersToday?: number
    activeUsers?: number
    totalProjects?: number
    totalCommunities?: number
    totalCredits?: number
    totalRevenue?: number
    [key: string]: number | undefined
}
