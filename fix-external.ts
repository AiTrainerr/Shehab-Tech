import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixExternal() {
  console.log("Fixing Spanish and German applicants...")
  const apps = await prisma.application.findMany({
    where: { status: { in: ['APPROVED', 'PAID', 'FINAL_REVIEW'] } },
    include: { project: true }
  })
  
  for (const app of apps) {
    if (app.project.title.toLowerCase().includes('german') || app.project.title.toLowerCase().includes('spanish') || app.project.title.toLowerCase().includes('المان') || app.project.title.toLowerCase().includes('اسبان')) {
      const projectCount = await prisma.projectSentence.count({ where: { projectId: app.projectId } })
      
      if (projectCount === 0) {
        // They should be in ACCEPTED status so they can upload proof!
        await prisma.application.update({
          where: { id: app.id },
          data: { status: 'ACCEPTED' } // ACCEPTED is equivalent to WORKING in older codes, or we can use 'WORKING'
        })
        console.log(`Reset ${app.userId} in ${app.project.title} to ACCEPTED.`)
      }
    }
  }
}

fixExternal().catch(console.error).finally(() => prisma.$disconnect())
