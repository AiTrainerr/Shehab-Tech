import { NextRequest, NextResponse } from "next/server"
import { cleanupExpiredRecordings } from "@/app/actions/recordings"

// This route is called by Vercel Cron every hour
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await cleanupExpiredRecordings()
  return NextResponse.json(result)
}
