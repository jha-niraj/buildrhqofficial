/**
 * Narrowing helpers for `catch (error: unknown)`.
 *
 * `catch (error: unknown)` is banned by CLAUDE.md, and not only on style grounds:
 * with `any`, `error.message` type-checks even when the thrown value is a
 * string, a `Response`, or `undefined`. That is how a handler ends up rendering
 * "undefined" to the user instead of failing loudly - the type system was asked
 * to stop checking exactly where the value is least predictable.
 *
 * These exist so the fix is one call rather than repeating
 * `error instanceof Error ? error.message : "…"` at 43 call sites, each with its
 * own slightly different fallback string.
 */

/** A message safe to log. Never throws, whatever was thrown. */
export function toErrorMessage(error: unknown, fallback = "Something went wrong"): string {
    if (error instanceof Error) return error.message || fallback;
    if (typeof error === "string" && error.trim()) return error;
    // Postgres/driver errors and API clients often throw plain objects carrying
    // a `message`, which `instanceof Error` misses.
    if (error && typeof error === "object" && "message" in error) {
        const message = (error as { message?: unknown }).message;
        if (typeof message === "string" && message.trim()) return message;
    }
    return fallback;
}

/** True when the failure was a timeout or an explicit abort. */
export function isAbortError(error: unknown): boolean {
    if (error instanceof Error) {
        return error.name === "AbortError" || /timeout|timed out|aborted/i.test(error.message);
    }
    return false;
}

/**
 * A driver/Postgres error code where one is present (`23505` unique violation,
 * `23503` foreign key, and so on). Lets a handler tell "already exists" from a
 * genuine failure without string-matching the message.
 */
export function errorCode(error: unknown): string | undefined {
    if (error && typeof error === "object" && "code" in error) {
        const code = (error as { code?: unknown }).code;
        if (typeof code === "string") return code;
    }
    return undefined;
}
