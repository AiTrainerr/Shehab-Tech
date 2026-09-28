import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { requireApiAuth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth()
  if ("errorResponse" in auth) {
    return auth.errorResponse
  }

  try {
    await prisma.notification.updateMany({
      where: { userId: auth.user.id, isRead: false },
      data: { isRead: true }
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
