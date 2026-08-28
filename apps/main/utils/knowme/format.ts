/**
 * KnowMe formatters that are safe to import from a CLIENT component.
 *
 * This file exists because of a specific crash, and the shape of it matters:
 * nothing here may import `@repo/db`, `node:crypto`, or anything else that only
 * runs on a server. Everything is a pure function of its arguments.
 *
 * `knowme-dashboard.tsx` is `"use client"` and needed exactly one date
 * formatter. It imported it from the `@/utils/knowme` barrel, and that barrel
 * re-exports `vector-db.ts`, which imports `db` from `@repo/db`. A barrel
 * re-export is a real import: pulling one function through it dragged the neon
 * client into the browser bundle, where it evaluated at module scope with no
 * connection string and took the whole page down with
 *
 *     No database connection string was provided to `neon()`
 *
 * Moving the import one level deeper to `helpers.ts` would not have fixed it
 * either - that module imports `createHash`/`randomBytes` from `node:crypto`
 * for API-key hashing, so a client importing it drags Node's crypto in instead.
 *
 * Hence a module with no server dependencies at all. `helpers.ts` re-exports
 * from here so the server-side public API is unchanged.
 */

/** Format a date as "3 hours ago", falling back to a locale date past a month. */
export function formatRelativeDate(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffMinutes = Math.floor(diffMs / (1000 * 60));

	if (diffMinutes < 1) return "Just now";
	if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
	if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
	if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
	if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;

	return date.toLocaleDateString();
}

/** Cut text to `maxLength`, with an ellipsis when it was actually cut. */
export function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return text.slice(0, maxLength).trimEnd() + "...";
}
