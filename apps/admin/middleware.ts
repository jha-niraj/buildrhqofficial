/**
 * ── Do NOT rename this to proxy.ts ──
 *
 * Next 16 deprecates the `middleware` convention in favour of `proxy`, and logs a warning
 * about it on every dev start. Ignore it. The Cloudflare adapter this app deploys through
 * does not support the `proxy.ts` convention, and `middleware.ts` is still fully supported by
 * Next 16. Same note is in the repo CLAUDE.md and in apps/main/middleware.ts.
 */

import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

// `/` is the sign-in screen itself (app/page.tsx). `/join/[token]` is the
// invitation-accept flow (ADM-13) - a not-yet-admin has to be able to load it
// with no session at all.
const PUBLIC_PATHS = ["/", "/join"]

function isPublicPath(pathname: string): boolean {
    return PUBLIC_PATHS.some((path) => {
        if (path === "/") return pathname === "/"
        return pathname === path || pathname.startsWith(`${path}/`)
    })
}

/**
 * Cookie-presence check only - this is the cheap, fast-path gate that runs on
 * every request. It does NOT know whether the session holder is an admin: that
 * requires a database read against `admin_access`, which happens once, in
 * app/(console)/layout.tsx (a server component), not here.
 *
 * Why the split matters: `@repo/auth` sets `cookiePrefix: "shipithq"` for every
 * app in the repo, and production sets a shared `AUTH_COOKIE_DOMAIN`, so any
 * signed-in ShipItHQ user - not just an admin - already holds a cookie this
 * middleware accepts. Without the server-layout check behind it, a student
 * could load the whole console shell. See plan/admin/tasks.md ADM-1.
 */
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    if (
        pathname.startsWith("/_next/") ||
        pathname.startsWith("/api/") ||
        pathname.includes(".")
    ) {
        return NextResponse.next()
    }

    const isLoggedIn = !!getSessionCookie(request, { cookiePrefix: "shipithq" })
    const isPublic = isPublicPath(pathname)

    if (!isLoggedIn) {
        if (isPublic) return NextResponse.next()
        return NextResponse.redirect(new URL("/", request.nextUrl.origin))
    }

    // A signed-in visitor hitting "/" is NOT redirected to /dashboard here.
    // That used to happen at this layer, and it was a real infinite loop for
    // a signed-in non-admin: this middleware only sees the cookie, so it sent
    // them to /dashboard; app/(console)/layout.tsx does the real admin_access
    // check, fails it, and redirects back to "/"; this middleware sees the
    // same still-valid cookie and sends them to /dashboard again. `app/page.tsx`
    // owns this decision instead - it calls `checkAdminAccess()` itself
    // (client-side, after mount) and either redirects to /dashboard or renders
    // a "this account does not have console access" state, once, with no
    // server-redirect loop possible. See plan/admin/tasks.md ADM-1.
    return NextResponse.next()
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public/|.*\\..*).*)"],
}
