import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function GET(req: NextRequest) {
  const deleted = req.nextUrl.searchParams.get("reason") === "deleted"
  const redirectUrl = deleted
    ? new URL("/login?error=account_deleted", req.url)
    : new URL("/login", req.url)

  const response = NextResponse.redirect(redirectUrl)
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  await supabase.auth.signOut()
  
  response.cookies.delete("userId")
  response.cookies.delete("userRole")
  response.cookies.delete("canReviewQC")
  response.cookies.delete("canApproveApplications")

  return response
}
