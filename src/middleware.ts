import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Auth-only pages (skip redirect-to-dashboard logic here)
const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/auth/callback']
// Pages that are completely public (no session checks needed)
const PUBLIC_PREFIXES = ['/api/auth', '/_next', '/favicon.ico']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // ─── DELETED ACCOUNT DETECTION ──────────────────────────────────────────
  // If user has a Supabase session but is NOT on an auth/api page,
  // check if their DB record still exists. If not, force logout.
  // We rely on the absence of the `userId` cookie as a lightweight proxy
  // (the login action sets it; if Supabase session exists but cookie is gone, they were logged out server-side)
  // For a more robust check we use a flag set by the logout route.
  const isPublicPath = PUBLIC_PREFIXES.some(p => pathname.startsWith(p))
  const isAuthPage = AUTH_PAGES.some(p => pathname === p || pathname.startsWith(p))

  if (user && !isAuthPage && !isPublicPath) {
    // If Supabase has a session but the legacy userId cookie is missing,
    // it means the account was deleted / force-logged-out server-side.
    // Redirect to logout to fully clear the Supabase session too.
    const userIdCookie = request.cookies.get("userId")?.value
    if (!userIdCookie) {
      return NextResponse.redirect(new URL('/api/auth/logout?reason=deleted', request.url))
    }
  }
  // ────────────────────────────────────────────────────────────────────────

  // Protect dashboard routes — no Supabase session at all
  if (pathname.startsWith('/member') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Intercept PKCE code from Supabase password resets
  if (request.nextUrl.searchParams.has('code') && !pathname.startsWith('/auth/callback')) {
    const code = request.nextUrl.searchParams.get('code')
    return NextResponse.redirect(new URL(`/auth/callback?code=${code}`, request.url))
  }

  // Redirect already-logged-in users away from auth pages
  // Only redirect if they have BOTH a Supabase session AND a userId cookie (fully logged in)
  if (isAuthPage && user && request.cookies.has("userId")) {
    return NextResponse.redirect(new URL('/member', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
