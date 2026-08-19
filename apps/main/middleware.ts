import { NextRequest, NextResponse } from "next/server"

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

async function getSessionFromRequest(request: NextRequest): Promise<SessionData | null> {
	try {
		const res = await fetch(new URL("/api/auth/get-session", request.nextUrl.origin), {
			headers: { cookie: request.headers.get("cookie") ?? "" },
		})
		if (!res.ok) return null
		return (await res.json()) as SessionData
	} catch {
		return null
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

	const withNoindex = (res: NextResponse) => {
		if (noindex) res.headers.set('X-Robots-Tag', 'noindex, nofollow')
		return res
	}

	const session = await getSessionFromRequest(req)
	const isLoggedIn = !!session?.user
	const onboardingCompleted = session?.user?.onboardingCompleted ?? false

	const isProtected = protectedRoutes.some(r => pathname.startsWith(r))

	if (!isLoggedIn && isProtected) {
		return withNoindex(redirectToSignIn(req))
	}

	if (isLoggedIn) {
		if (!onboardingCompleted && pathname !== '/onboarding') {
			// Carry where they were headed, so someone who signed up from a pricing
			// CTA lands back on their pack once setup is done instead of on /home.
			const url = new URL('/onboarding', nextUrl.origin)
			if (pathname !== '/home') {
				url.searchParams.set('callbackUrl', pathname + nextUrl.search)
			}
			return withNoindex(NextResponse.redirect(url))
		}
		if (onboardingCompleted && pathname === '/onboarding') {
			return withNoindex(NextResponse.redirect(new URL('/home', nextUrl.origin)))
		}
		if (pathname === '/signin' || pathname === '/register') {
			return withNoindex(NextResponse.redirect(new URL(onboardingCompleted ? '/home' : '/onboarding', nextUrl.origin)))
		}
		if (pathname === '/') {
			return withNoindex(NextResponse.redirect(new URL(onboardingCompleted ? '/home' : '/onboarding', nextUrl.origin)))
		}
		if (pathname === '/dashboard' || pathname === '/explore') {
			return withNoindex(NextResponse.redirect(new URL('/home', nextUrl.origin)))
		}
	}

	return withNoindex(NextResponse.next())
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