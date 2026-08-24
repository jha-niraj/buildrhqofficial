/**
 * Two-role model, decided 2026-08-24 (plan/admin/overview.md).
 *
 * `admin_role` still declares six values in Postgres (SUPER_ADMIN, CONTENT_ADMIN,
 * FINANCE_ADMIN, COMMUNITY_ADMIN, MODULE_MANAGER, VIEWER) - dropping an enum value is an
 * expensive migration for no gain, so the four surplus values stay in the column and are
 * normalised to "Team Member" everywhere they are displayed or reasoned about. Only
 * SUPER_ADMIN is ever treated specially.
 */

export function isSuperAdminRole(role: string): boolean {
    return role === "SUPER_ADMIN"
}

export function formatAdminRole(role: string): string {
    return role === "SUPER_ADMIN" ? "Super Admin" : "Team Member"
}
