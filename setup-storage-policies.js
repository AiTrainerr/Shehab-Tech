const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log("Setting up Supabase Storage Policies via SQL...")
  try {
    // 1. Allow public SELECT (read) for all buckets
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow public read" ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id IN ('avatars', 'portfolio', 'projects'));
    `).catch(e => console.log("Select policy might exist:", e.message))

    // 2. Allow authenticated INSERT for all buckets
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow authenticated inserts" ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id IN ('avatars', 'portfolio', 'projects'));
    `).catch(e => console.log("Insert policy might exist:", e.message))

    // 3. Allow authenticated UPDATE for all buckets
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow authenticated updates" ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id IN ('avatars', 'portfolio', 'projects'));
    `).catch(e => console.log("Update policy might exist:", e.message))

    // 4. Allow authenticated DELETE for all buckets
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow authenticated deletes" ON storage.objects
      FOR DELETE
      TO authenticated
      USING (bucket_id IN ('avatars', 'portfolio', 'projects'));
    `).catch(e => console.log("Delete policy might exist:", e.message))

    console.log("Storage policies executed successfully!")
  } catch (err) {
    console.error("Global Error:", err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
