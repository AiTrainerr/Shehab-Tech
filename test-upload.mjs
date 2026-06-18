import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // User actually used service role key here!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testUpload() {
  const dummyFile = new Blob(['hello world'], { type: 'text/plain' })
  console.log("Uploading test file to avatars...")
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload('test.txt', dummyFile, { upsert: true })

  if (error) {
    console.error("Upload failed:", error.message)
  } else {
    console.log("Upload successful:", data)
    
    // Now get public URL
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl('test.txt')
    console.log("Public URL:", publicUrl)
  }
}

testUpload()
