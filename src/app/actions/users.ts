"use server"

import { prisma } from "@/lib/prisma"
import { createClientServer } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function rateUser(userId: string, rating: number) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not logged in" }
    
    // Optional: Verify user is ADMIN
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (dbUser?.role !== "ADMIN") return { success: false, error: "Unauthorized" }

    await prisma.user.update({
      where: { id: userId },
      data: { rating }
    })

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error: any) {
    console.error("Rate user error:", error)
    return { success: false, error: "Failed to update rating" }
  }
}
