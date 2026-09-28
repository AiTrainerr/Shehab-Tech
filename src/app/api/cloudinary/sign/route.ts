import { NextResponse } from "next/server"
import { createHash } from "crypto"
import { requireApiAuth } from "@/lib/auth"

export async function POST(req: Request) {
  const auth = await requireApiAuth()
  if ("errorResponse" in auth) {
    return auth.errorResponse
  }

  try {
    const timestamp = Math.round(new Date().getTime() / 1000)
    const folder = "shehab-tech/transcription"
    const apiSecret = process.env.CLOUDINARY_TRANSCRIPTION_API_SECRET!

    if (!apiSecret) {
      return NextResponse.json({ error: "Cloudinary configuration missing" }, { status: 500 })
    }

    // Build signature manually (matches Cloudinary's signing algorithm)
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`
    const signature = createHash("sha256").update(paramsToSign).digest("hex")

    return NextResponse.json({
      timestamp,
      signature,
      folder,
      apiKey: process.env.CLOUDINARY_TRANSCRIPTION_API_KEY,
      cloudName: process.env.CLOUDINARY_TRANSCRIPTION_CLOUD_NAME,
    })
  } catch (error: any) {
    console.error("Cloudinary sign error:", error)
    return NextResponse.json({ error: "Failed to sign request" }, { status: 500 })
  }
}
