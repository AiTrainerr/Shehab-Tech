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

  try {
    await supabase.auth.signOut()
  } catch (e) {
    console.error("SignOut error:", e)
  }

  // Force delete Supabase cookies just in case
  const projectId = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  if (projectId) {
    const baseName = `sb-${projectId}-auth-token`
    response.cookies.delete(baseName)
    response.cookies.delete(`${baseName}-code-verifier`)
    // Handle chunked cookies
    for (let i = 0; i < 5; i++) {
      response.cookies.delete(`${baseName}.${i}`)
    }
  }
  
  response.cookies.delete("userId")
  response.cookies.delete("userRole")
  response.cookies.delete("canReviewQC")
  response.cookies.delete("canApproveApplications")

  return response
}
