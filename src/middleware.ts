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

  // ✅ This call REFRESHES the session automatically if the access token has expired.
  // The Supabase SSR client will use the refresh token to get a new access token
  // and write it back to cookies via setAll above — keeping the user logged in.
  const { data: { user } } = await supabase.auth.getUser()

  // ─── DELETED ACCOUNT DETECTION ──────────────────────────────────────────
  const isPublicPath = PUBLIC_PREFIXES.some(p => pathname.startsWith(p))
  const isAuthPage = AUTH_PAGES.some(p => pathname === p || pathname.startsWith(p))
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
  if (isAuthPage && user && request.cookies.has('userId')) {
    return NextResponse.redirect(new URL('/member', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
