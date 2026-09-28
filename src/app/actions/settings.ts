"use server"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { createAuditLog } from "@/app/actions/audit"

const SENSITIVE_SETTING_KEYS = [
  "CLOUDINARY_ACCOUNTS",
  "API_KEY",
  "SECRET",
  "TOKEN",
  "CREDENTIAL",
]

function isSensitiveKey(key: string): boolean {
  const upper = key.toUpperCase()
  return SENSITIVE_SETTING_KEYS.some((sensitive) => upper.includes(sensitive))
}

export async function getSystemSetting(key: string) {
  try {
    if (isSensitiveKey(key)) {
      await requireRole(["ADMIN", "SUPER_ADMIN"])
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    })
    return setting?.value || null
  } catch (e) {
    console.error(`Failed to get setting ${key}:`, e)
    return null
  }
}

export async function setSystemSetting(key: string, value: string) {
  try {
    const user = await requireRole(["ADMIN", "SUPER_ADMIN"])

    await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    })

    const masked = isSensitiveKey(key) ? "[SENSITIVE_DATA_HIDDEN]" : (value.length > 50 ? `${value.substring(0, 50)}...` : value)
    await createAuditLog(
      "UPDATE_SYSTEM_SETTING",
      `Setting '${key}' updated by ${user.role} (${user.id}). Value preview: ${masked}`
    )

    return { success: true }
  } catch (e: any) {
    console.error(`Failed to set setting ${key}:`, e)
    return { success: false, error: e.message }
  }
}
