"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClientServer } from "@/lib/supabase"

export async function logoutUser() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("userId")
    cookieStore.delete("userRole")
    cookieStore.delete("canReviewQC")
    cookieStore.delete("canApproveApplications")

    const supabase = await createClientServer()
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error("SignOut error:", e)
    }

    const projectId = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
    if (projectId) {
      const baseName = `sb-${projectId}-auth-token`
      cookieStore.delete(baseName)
      cookieStore.delete(`${baseName}-code-verifier`)
      for (let i = 0; i < 5; i++) {
        cookieStore.delete(`${baseName}.${i}`)
      }
    }
  } catch (e) {
    console.error("Logout error (ignored):", e)
  }
  
  return { success: true }
}
