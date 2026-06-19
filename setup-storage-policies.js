const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log("Setting up Supabase Storage Policies via SQL...")
  try {
    // Drop existing policies
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Allow public read" ON storage.objects;`).catch(() => {})
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Allow authenticated inserts" ON storage.objects;`).catch(() => {})
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;`).catch(() => {})
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;`).catch(() => {})

    // 1. Allow public SELECT (read) for all buckets
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow public read" ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id IN ('avatars', 'portfolio', 'projects', 'verification', 'learning'));
    `)

    // 2. Allow authenticated INSERT for all buckets
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow authenticated inserts" ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id IN ('avatars', 'portfolio', 'projects', 'verification', 'learning'));
    `)

    // 3. Allow authenticated UPDATE for all buckets
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow authenticated updates" ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id IN ('avatars', 'portfolio', 'projects', 'verification', 'learning'));
    `)

    // 4. Allow authenticated DELETE for all buckets
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow authenticated deletes" ON storage.objects
      FOR DELETE
      TO authenticated
      USING (bucket_id IN ('avatars', 'portfolio', 'projects', 'verification', 'learning'));
    `)

    console.log("Storage policies executed successfully!")
  } catch (err) {
    console.error("Global Error:", err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
