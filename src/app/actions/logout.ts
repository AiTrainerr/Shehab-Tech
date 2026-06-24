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
    await supabase.auth.signOut()
  } catch (e) {
    console.error("Logout error (ignored):", e)
  }
  
  return { success: true }
}
