"use server"

import { prisma } from "@/lib/prisma"
import { createClientServer } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createNotification } from "@/app/actions/notifications"

export async function registerUser(formData: FormData) {
  try {
    const email = (formData.get("email") as string).toLowerCase().trim()
    const password = formData.get("password") as string
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const middleName = formData.get("middleName") as string | null
    const gender = formData.get("gender") as string
    const country = formData.get("country") as string
    const age = parseInt(formData.get("age") as string)
    const phone = formData.get("phone") as string
    const whatsapp = formData.get("whatsapp") as string

    if (!email || !password || !firstName || !lastName) {
      return { success: false, error: "Missing required fields" }
    }

    const supabase = await createClientServer()

    // 1. Sign up in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    })

    if (authError) {
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: "Authentication failed" }
    }

    // 2. Create user in Prisma PostgreSQL
    await prisma.user.create({
      data: {
        id: authData.user.id, // Sync with Supabase Auth ID
        email,
        firstName,
        lastName,
        middleName,
        gender,
        country,
        age,
        phone,
        whatsapp,
        verificationStatus: "NOT_VERIFIED",
      }
    })

    // 3. Create welcome notification
    await createNotification(
      authData.user.id,
      "Welcome to SHEHAB TECH! 🎉",
      `Hi ${firstName}! Your account has been created. Complete your profile and verify your identity to start earning.`,
      "/member/verification"
    )

    const cookieStore = await cookies()
    cookieStore.set("userId", authData.user.id, { httpOnly: true, path: "/" })
    cookieStore.set("userRole", "MEMBER", { httpOnly: true, path: "/" })

    return { success: true, userId: authData.user.id }
  } catch (error: any) {
    console.error("Registration error:", error)
    return { success: false, error: "An error occurred during registration." }
  }
}

export async function loginUser(formData: FormData) {
  try {
    const email = (formData.get("email") as string).toLowerCase().trim()
    const password = formData.get("password") as string

    if (!email || !password) {
      return { success: false, error: "Email and password are required" }
    }

    const supabase = await createClientServer()

    // 1. Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      return { success: false, error: "Invalid email or password" }
    }

    // 2. Fetch role and status from Prisma
    const user = await prisma.user.findUnique({ 
      where: { id: authData.user.id },
      select: { role: true, isApproved: true }
    })

    if (user?.role === "MODERATOR" && !user.isApproved) {
      await supabase.auth.signOut()
      return { success: false, error: "Your Moderator account is pending Admin approval." }
    }

    // Set legacy session cookies for compatibility with current components
    // (Ideally we should use supabase.auth.getSession in middleware/components)
    const cookieStore = await cookies()
    cookieStore.set("userId", authData.user.id, { httpOnly: true, path: "/" })
    cookieStore.set("userRole", user?.role || "MEMBER", { httpOnly: true, path: "/" })

    revalidatePath("/")
    return { success: true, role: user?.role || "MEMBER" }
  } catch (error: any) {
    console.error("Login error:", error)
    return { success: false, error: "An error occurred during login." }
  }
}

export async function resetPasswordAction(formData: FormData) {
  try {
    const email = (formData.get("email") as string).toLowerCase().trim()
    const supabase = await createClientServer()
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/member/profile/edit`,
    })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error: any) {
    console.error("Reset password error:", error)
    return { success: false, error: "An error occurred while resetting password." }
  }
}

export async function updatePasswordAction(formData: FormData) {
  try {
    const password = formData.get("password") as string
    const supabase = await createClientServer()
    
    const { error } = await supabase.auth.updateUser({ password })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error: any) {
    console.error("Update password error:", error)
    return { success: false, error: "An error occurred while updating password." }
  }
}
