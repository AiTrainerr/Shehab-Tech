"use server"

import { prisma } from "@/lib/prisma"
import { createClientServer } from "@/lib/supabase"
import { uploadToSupabase } from "@/lib/storage"
import { revalidatePath } from "next/cache"

export async function updateProfile(formData: FormData) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    const firstName = formData.get("firstName") as string
    const middleName = formData.get("middleName") as string | null
    const lastName = formData.get("lastName") as string
    const email = (formData.get("email") as string)?.toLowerCase().trim()
    const phone = formData.get("phone") as string
    const whatsapp = formData.get("whatsapp") as string
    const bio = formData.get("bio") as string | null

    const projectTypes = formData.getAll("projectTypes") as string[]

    const languages = []
    for (let i = 0; i < 4; i++) {
      const language = formData.get(`language_${i}`) as string
      const proficiency = formData.get(`proficiency_${i}`) as string
      if (language && proficiency) {
        languages.push({ language: language.trim(), proficiency })
      }
    }

    if (!firstName || !lastName || !email) {
      return { success: false, error: "Required fields missing" }
    }

    const updateData: any = {
      firstName,
      middleName,
      lastName,
      email,
      phone,
      whatsapp,
      bio,
      projectTypes,
    }

    // Use a transaction to update user and replace languages
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: updateData
      }),
      prisma.userLanguage.deleteMany({
        where: { userId: user.id }
      }),
      prisma.userLanguage.createMany({
        data: languages.map(l => ({ ...l, userId: user.id }))
      })
    ])

    revalidatePath("/member/profile")
    return { success: true }
  } catch (error: any) {
    console.error("Update profile error:", error)
    return { success: false, error: "Failed to update profile" }
  }
}

export async function updateAvatar(formData: FormData) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Not authenticated" }

    const imageFile = formData.get("avatar") as File
    if (!imageFile || imageFile.size === 0) return { success: false, error: "No image provided" }

    const avatarUrl = await uploadToSupabase(imageFile, 'avatars')

    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl }
    })

    revalidatePath("/member/profile")
    return { success: true, avatarUrl }
  } catch (error: any) {
    console.error("Avatar update error:", error)
    return { success: false, error: `Upload error: ${error.message || 'Unknown error'}` }
  }
}
