import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Automatically rewrite the Database URL to use the Session pooler (5432) 
// instead of Transaction pooler (6543) which causes connection drops on Supabase.
const dbUrl = (process.env.DATABASE_URL || "")
  .replace(":6543", ":5432")
  .replace("pgbouncer=true&", "")
  .replace("&pgbouncer=true", "")
  .replace("pgbouncer=true", "");

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }
  }
})

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
