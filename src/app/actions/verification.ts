"use server"

import { prisma } from "@/lib/prisma"
import { createClientServer } from "@/lib/supabase"
import { uploadToSupabase } from "@/lib/storage"
import { revalidatePath } from "next/cache"

export async function submitVerification(formData: FormData) {
  try {
    const supabase = await createClientServer()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return { success: false, error: "Not authenticated" }

    const idCard = formData.get("idCard") as File | null
    const selfie = formData.get("selfie") as File | null

    if (!idCard || !selfie || idCard.size === 0 || selfie.size === 0) {
      return { success: false, error: "ID Card and Selfie are required" }
    }

    // Save files to Supabase Storage
    const idCardUrl = await uploadToSupabase(idCard, 'verification')
    const selfieUrl = await uploadToSupabase(selfie, 'verification')

    // Update user in database
    await prisma.user.update({
      where: { id: authUser.id },
      data: {
        idCardUrl,
        selfieUrl,
        verificationStatus: "PENDING"
      }
    })

    revalidatePath("/member/profile")
    return { success: true }
  } catch (error: any) {
    console.error("Submit verification error:", error)
    return { success: false, error: "Failed to upload files" }
  }
}

export async function approveVerification(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus: "VERIFIED",
        isEmailVerified: true,
      }
    })
    revalidatePath("/member/profile")
    return { success: true }
  } catch (error: any) {
    console.error("Approve verification error:", error)
    return { success: false, error: "Failed to approve verification" }
  }
}

export async function rejectVerification(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus: "REJECTED",
        idCardUrl: null,
        selfieUrl: null
      }
    })
    revalidatePath("/member/profile")
    return { success: true }
  } catch (error: any) {
    console.error("Reject verification error:", error)
    return { success: false, error: "Failed to reject verification" }
  }
}
