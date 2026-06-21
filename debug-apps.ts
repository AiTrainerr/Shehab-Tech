import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugApps() {
  const apps = await prisma.application.findMany({
    where: { status: { in: ['APPROVED', 'PAID'] } },
    include: { project: true, user: true }
  })
  
  for (const app of apps) {
    if (app.project.title.toLowerCase().includes('german') || app.project.title.toLowerCase().includes('spanish') || app.project.title.toLowerCase().includes('المان') || app.project.title.toLowerCase().includes('اسبان')) {
      const count = await prisma.voiceRecording.count({
        where: { userId: app.userId, sentence: { projectId: app.projectId } }
      })
      const projectCount = await prisma.projectSentence.count({ where: { projectId: app.projectId } })
      console.log(`User: ${app.user.firstName} ${app.user.lastName}, Project: ${app.project.title}, Status: ${app.status}, Sentences: ${projectCount}, Recorded: ${count}`)
    }
  }
}

debugApps().catch(console.error).finally(() => prisma.$disconnect())
