"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClientServer } from "@/lib/supabase"

export async function logoutUser() {
  const supabase = await createClientServer()
  await supabase.auth.signOut()
  
  const cookieStore = await cookies()
  cookieStore.delete("userId")
  cookieStore.delete("userRole")
  cookieStore.delete("canReviewQC")
  cookieStore.delete("canApproveApplications")
  
  redirect("/login")
}
