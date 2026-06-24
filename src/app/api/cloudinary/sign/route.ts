import { NextResponse } from "next/server"
import { cloudinary } from "@/lib/cloudinary"

export async function POST(req: Request) {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000)
    const folder = "shehab-tech/transcription"
    
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
      },
      process.env.CLOUDINARY_TRANSCRIPTION_API_SECRET!
    )

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
