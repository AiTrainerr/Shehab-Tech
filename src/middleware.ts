import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/member') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Intercept PKCE code from Supabase password resets if it lands on root
  if (request.nextUrl.searchParams.has('code') && !request.nextUrl.pathname.startsWith('/auth/callback')) {
    const code = request.nextUrl.searchParams.get('code')
    return NextResponse.redirect(new URL(`/auth/callback?code=${code}`, request.url))
  }

  // Redirect logged in users away from auth pages (only if they also have the legacy cookie to prevent loops)
  if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register') && user && request.cookies.has("userId")) {
    return NextResponse.redirect(new URL('/member', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
