import { createClientServer } from "./supabase"

export async function uploadToSupabase(file: File, folder: string = 'general'): Promise<string> {
  const supabase = await createClientServer()
  
  // Create a unique file path
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
  const filePath = `${folder}/${fileName}`

  // In Next.js Server Actions, it's safer to upload as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Upload the file
  let { data, error } = await supabase.storage
    .from('uploads')
    .upload(filePath, buffer, {
      contentType: file.type || 'image/jpeg',
      upsert: true
    })

  // If the bucket does not exist, try to create it and retry upload
  if (error && error.message.includes("Bucket not found")) {
    console.log("Bucket 'uploads' not found. Creating it automatically...")
    await supabase.storage.createBucket('uploads', { public: true })
    
    // Retry upload
    const retryRes = await supabase.storage
      .from('uploads')
      .upload(filePath, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true
      })
    
    data = retryRes.data
    error = retryRes.error
  }

  if (error) {
    console.error("Supabase Storage Error:", error)
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('uploads')
    .getPublicUrl(filePath)

  return publicUrl
}
