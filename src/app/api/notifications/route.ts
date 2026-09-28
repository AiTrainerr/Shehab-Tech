import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { requireApiAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth()
  if ("errorResponse" in auth) {
    return auth.errorResponse
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 20
    })
    return NextResponse.json(notifications)
  } catch (e) {
    return NextResponse.json([], { status: 500 })
  }
}
