import { createClientServer } from "./supabase"

export async function uploadToSupabase(file: File, bucket: string = 'uploads'): Promise<string> {
  const supabase = await createClientServer()
  
  // Create a unique file path
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
  const filePath = `${fileName}`

  // In Next.js Server Actions, it's safer to upload as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Upload the file
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType: file.type || 'image/jpeg',
      upsert: true
    })

  if (error) {
    console.error("Supabase Storage Error:", error)
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath)

  return publicUrl
}
