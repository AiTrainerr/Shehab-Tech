import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fix() {
  console.log("Starting fix...")
  
  // Find all applications
  const apps = await prisma.application.findMany({
    where: { status: 'APPROVED' },
    include: {
      project: true
    }
  })

  let count = 0;

  for (const app of apps) {
    const totalSentences = await prisma.projectSentence.count({
      where: { projectId: app.projectId }
    })
    
    const recordedCount = await prisma.voiceRecording.count({
      where: {
        userId: app.userId,
        sentence: { projectId: app.projectId }
      }
    })

    if (totalSentences > 0 && recordedCount < totalSentences) {
      console.log(`Fixing app ${app.id} for user ${app.userId}: recorded ${recordedCount}/${totalSentences}, changing from APPROVED to ACCEPTED`)
      await prisma.application.update({
        where: { id: app.id },
        data: { status: 'ACCEPTED' }
      })
      count++;
    }
  }

  console.log(`Fixed ${count} applications!`)
}

fix().catch(console.error).finally(() => prisma.$disconnect())
