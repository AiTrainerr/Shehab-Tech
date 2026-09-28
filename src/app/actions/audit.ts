"use server"

import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { createClientServer } from "@/lib/supabase"
import { requireRole } from "@/lib/auth"

export async function createAuditLog(action: string, details: string) {
  try {
    const supabase = await createClientServer()
    const { data: { user } } = await supabase.auth.getUser()

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "127.0.0.1"

    let username = "Anonymous"
    if (user) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { firstName: true, lastName: true }
      })
      if (dbUser) {
        username = `${dbUser.firstName} ${dbUser.lastName}`
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: user?.id || null,
        username,
        action,
        details,
        ipAddress,
      }
    })
  } catch (error) {
    console.error("Failed to create audit log:", error)
  }
}

export async function getAuditLogs() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    return await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100
    })
  } catch (error) {
    console.error("Get audit logs error:", error)
    return []
  }
}
