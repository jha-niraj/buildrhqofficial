/**
 * ── Do NOT rename this to proxy.ts ──
 *
 * Next 16 deprecates the `middleware` convention in favour of `proxy`, and logs a warning
 * about it on every dev start. Ignore it. The Cloudflare adapter this app deploys through
 * does not support the `proxy.ts` convention, and `middleware.ts` is still fully supported by
 * Next 16. The same note is in the repo CLAUDE.md.
 */

import { NextRequest, NextResponse } from "next/server"
import { getCookieCache } from "better-auth/cookies"
import type { Session, User } from "better-auth"

type SessionUser = {
	id: string
	email: string
	name: string
	image?: string
	onboardingCompleted?: boolean
}

type SessionData = {
	user: SessionUser
	session: { id: string; expiresAt: string }
}

/**
 * The session for this request, for routing decisions only.
 *
 * ── Why this is not just a fetch any more ──
 *
 * It used to be exactly one thing: `fetch("/api/auth/get-session")` with the request's
 * cookies forwarded. That is a full extra HTTP round trip, to this same server, on EVERY
 * navigation - which is the `GET /api/auth/get-session` line that appears once per page in
 * the dev log, and the 100-200ms of `proxy.ts` time attached to each one. In production it
 * is a second Worker invocation per page.
 *
 * `auth.ts` enables better-auth's cookie cache (`session.cookieCache`, 5 minutes), which
 * exists precisely so this check costs nothing. `getCookieCache` reads that signed cookie and
 * verifies it locally - no network, no database. The fetch is now only the cold path.
 *
 * ── The Set-Cookie bug this also fixes ──
 *
 * The old version threw away the response of its internal fetch except for the JSON body.
 * better-auth answers that call with a `Set-Cookie` refreshing the cookie cache, and often
 * the session cookie itself - `session.updateAge` is 24h, so an active user's 30-day session
 * is supposed to keep rolling forward. Discarding it meant:
 *
 *   - the cookie cache was refilled by the browser's own `useSession` calls and by nothing
 *     else, so navigations kept missing it and paying for a database lookup
 *   - the rolling refresh never reached the browser at all, so a session expired 30 days
 *     after sign-in no matter how active the user was
 *
 * The cold path now forwards those cookies onto the response it returns.
 *
 * Returning null means "not signed in" for routing purposes. That is the safe direction: the
 * worst case is redirecting a signed-in user to /signin, where middleware runs again with a
 * warm cache and bounces them back.
 */
async function getSessionFromRequest(
	request: NextRequest,
): Promise<{ session: SessionData | null; setCookie: string[] }> {
	// Warm path: local, signed-cookie read. No I/O at all.
	try {
		// The generic is better-auth's own Session/User, because that is what the constraint
		// on getCookieCache requires - a narrower local shape does not satisfy it.
		const cached = await getCookieCache<{
			session: Session
			user: User & { onboardingCompleted?: boolean }
			updatedAt: number
		}>(request, {
			cookiePrefix: "shipithq", // must match `advanced.cookiePrefix` in auth.ts
			secret: process.env.BETTER_AUTH_SECRET,
			isSecure: request.nextUrl.protocol === "https:",
		})
		if (cached?.user) {
			return {
				session: {
					user: {
						id: cached.user.id,
						email: cached.user.email,
						name: cached.user.name,
						image: cached.user.image ?? undefined,
						onboardingCompleted: cached.user.onboardingCompleted,
					},
					session: {
						id: cached.session.id,
						expiresAt: String(cached.session.expiresAt),
					},
				},
				setCookie: [],
			}
		}
	} catch {
		// A malformed or unverifiable cache cookie is not an error worth failing on - fall
		// through and ask the server, which will mint a correct one.
	}

	// Cold path: no cache cookie, or it did not verify.
	try {
		const res = await fetch(new URL("/api/auth/get-session", request.nextUrl.origin), {
			headers: { cookie: request.headers.get("cookie") ?? "" },
		})
		if (!res.ok) return { session: null, setCookie: [] }
		// getSetCookie() rather than get("set-cookie"): better-auth can send several, and
		// joining them into one comma-separated string corrupts any cookie whose Expires
		// attribute contains a comma - which every dated cookie does.
		const setCookie = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : []
		const body = (await res.json()) as SessionData | null
		return { session: body, setCookie }
	} catch {
		return { session: null, setCookie: [] }
	}
}

function redirectToSignIn(req: NextRequest): NextResponse {
	const url = new URL("/signin", req.nextUrl.origin)
	// pathname + search, not pathname alone - dropping the query string returns the
	// user to a bare route with their selection gone (e.g. /purchase without the
	// pack they picked on the pricing page).
	url.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search)
	return NextResponse.redirect(url)
}

// Protected routes that require authentication (only core user-specific functionality)
const protectedRoutes = [
	'/home',
	'/profile',
	'/settings',
	'/transactions',
]

// Public routes that don't require authentication (allow exploration)
const _publicRoutes = [
	'/',
	'/signin',
	'/register',
	'/forgotpassword',
	'/resetpassword',
	'/error',
	'/aboutus',
	'/careers',
	'/search',
	'/practice',
	'/quizdemo',
	'/contests',
	'/behindthemagic',
	'/projects',
	'/ai',
	'/mock',
	'/interviewprep',
	'/assessments',
	'/opensource',
	'/purchase',
	'/onboarding',
	'/dashboard',  // Keep for redirect
	'/explore',    // Keep for redirect
]

// API routes that should be excluded from auth checks
const apiRoutes = [
	'/api/auth',
	'/api/health',
	'/api/user',
	'/api/webhooks',
]

const PRODUCTION_ORIGIN = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.shipithq.com'

export default async function middleware(req: NextRequest) {
	const { nextUrl } = req
	const pathname = nextUrl.pathname

	// Pass through static assets and Next.js internals
	if (
		pathname.startsWith('/_next/') ||
		pathname.includes('.') ||
		apiRoutes.some(r => pathname.startsWith(r))
	) {
		return NextResponse.next()
	}

	// Noindex non-production deployments so staging/preview URLs don't pollute
	// Google's index. This only sets a header - it must NOT return early, or every
	// auth redirect below (sign-in gate, onboarding gate) would be dead on
	// localhost and preview deploys, which is exactly where they get tested.
	const isProduction = req.nextUrl.origin === PRODUCTION_ORIGIN
	const noindex = !isProduction

	const { session, setCookie } = await getSessionFromRequest(req)

	// Every response leaves through here, so the refreshed cookies from the cold path are
	// forwarded exactly once and cannot be forgotten on a branch. `append`, not `set`: there
	// can be more than one, and `set` would keep only the last.
	const finish = (res: NextResponse) => {
		if (noindex) res.headers.set('X-Robots-Tag', 'noindex, nofollow')
		for (const c of setCookie) res.headers.append('set-cookie', c)
		return res
	}

	const isLoggedIn = !!session?.user
	const onboardingCompleted = session?.user?.onboardingCompleted ?? false

	const isProtected = protectedRoutes.some(r => pathname.startsWith(r))

	if (!isLoggedIn && isProtected) {
		return finish(redirectToSignIn(req))
	}

	if (isLoggedIn) {
		if (!onboardingCompleted && pathname !== '/onboarding') {
			// Carry where they were headed, so someone who signed up from a pricing
			// CTA lands back on their pack once setup is done instead of on /home.
			const url = new URL('/onboarding', nextUrl.origin)
			if (pathname !== '/home') {
				url.searchParams.set('callbackUrl', pathname + nextUrl.search)
			}
			return finish(NextResponse.redirect(url))
		}
		if (onboardingCompleted && pathname === '/onboarding') {
			return finish(NextResponse.redirect(new URL('/home', nextUrl.origin)))
		}
		if (pathname === '/signin' || pathname === '/register') {
			return finish(NextResponse.redirect(new URL(onboardingCompleted ? '/home' : '/onboarding', nextUrl.origin)))
		}
		if (pathname === '/') {
			return finish(NextResponse.redirect(new URL(onboardingCompleted ? '/home' : '/onboarding', nextUrl.origin)))
		}
		if (pathname === '/dashboard' || pathname === '/explore') {
			return finish(NextResponse.redirect(new URL('/home', nextUrl.origin)))
		}
	}

	return finish(NextResponse.next())
}

export const config = {
	// More specific matcher to avoid catching static files and API routes
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder files
		 * - files with extensions (images, etc.)
		 * - webhook endpoints
		 */
		'/((?!api/auth|api/webhooks|_next/static|_next/image|favicon.ico|public/|.*\\..*).*)',
	],
} 