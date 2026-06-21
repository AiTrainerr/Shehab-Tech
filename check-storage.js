const { PrismaClient } = require('@prisma/client');

async function checkStorage() {
  const prisma = new PrismaClient();
  try {
    const buckets = await prisma.$queryRawUnsafe(`SELECT id, name, public FROM storage.buckets;`);
    console.log("Buckets:", buckets);
    
    const policies = await prisma.$queryRawUnsafe(`SELECT policyname, tablename, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'storage';`);
    console.log("Policies:", policies);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStorage();
