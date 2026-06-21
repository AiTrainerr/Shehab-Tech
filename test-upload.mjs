import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key';

async function testUpload() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const buffer = Buffer.from("Hello world!");
  
  console.log("Attempting to upload to 'uploads' bucket...");
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload('test/test.txt', buffer, {
      contentType: 'text/plain',
      upsert: true
    });
    
  if (error) {
    console.error("Upload failed:", error.message);
  } else {
    console.log("Upload success:", data);
  }
}

testUpload();
