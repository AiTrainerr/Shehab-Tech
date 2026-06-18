import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // User actually used service role key here!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupBuckets() {
  const buckets = ['avatars', 'portfolio', 'projects']
  
  for (const bucket of buckets) {
    console.log(`Checking bucket: ${bucket}...`)
    const { data: existingBucket, error: getError } = await supabase.storage.getBucket(bucket)
    
    if (getError && getError.message.includes('not found')) {
      console.log(`Creating bucket: ${bucket}...`)
      const { data, error } = await supabase.storage.createBucket(bucket, {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 5242880 // 5MB
      })
      if (error) {
        console.error(`Failed to create ${bucket}:`, error.message)
      } else {
        console.log(`Bucket ${bucket} created successfully!`)
      }
    } else if (existingBucket) {
      console.log(`Bucket ${bucket} already exists. Updating to public...`)
      await supabase.storage.updateBucket(bucket, {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 5242880
      })
    } else if (getError) {
      console.error(`Error checking ${bucket}:`, getError.message)
    }
  }
}

setupBuckets()
