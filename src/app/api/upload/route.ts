import { NextRequest, NextResponse } from "next/server"
import { uploadToSupabase } from "@/lib/storage"
import { requireApiAuth } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiAuth(["ADMIN", "SUPER_ADMIN"])
    if ("errorResponse" in auth) {
      return auth.errorResponse
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const folder = formData.get("folder") as string || "general"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const url = await uploadToSupabase(file, folder)

    return NextResponse.json({ success: true, url })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 })
  }
}
