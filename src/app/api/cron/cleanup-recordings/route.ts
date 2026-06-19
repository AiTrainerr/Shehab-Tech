import { NextRequest, NextResponse } from "next/server"
import { cleanupExpiredRecordings } from "@/app/actions/recordings"

// This route is called by Vercel Cron every hour
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await cleanupExpiredRecordings()
  return NextResponse.json(result)
}
