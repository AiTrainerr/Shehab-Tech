import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixIncompleteApplications() {
  console.log("Looking for applicants in APPROVED/FINAL_REVIEW/PAID who haven't finished...")
  
  // Find all projects that have sentences
  const projects = await prisma.project.findMany({
    include: {
      _count: { select: { sentences: true } }
    }
  })

  let fixedCount = 0;

  for (const project of projects) {
    const totalSentences = project._count.sentences;
    if (totalSentences === 0) continue; // Skip external projects

    const apps = await prisma.application.findMany({
      where: {
        projectId: project.id,
        status: { in: ['FINAL_REVIEW', 'APPROVED', 'PAID'] }
      }
    });

    for (const app of apps) {
      // Check how many recordings they have
      const count = await prisma.voiceRecording.count({
        where: {
          userId: app.userId,
          sentence: { projectId: project.id }
        }
      });

      if (count < totalSentences) {
        console.log(`Fixing user ${app.userId} in project ${project.title}. Recorded: ${count}/${totalSentences}. Resetting to WORKING...`)
        
        await prisma.application.update({
          where: { id: app.id },
          data: { status: 'WORKING' }
        });
        
        fixedCount++;
      }
    }
  }

  console.log(`Fixed ${fixedCount} applications successfully!`)
}

fixIncompleteApplications().catch(console.error).finally(() => prisma.$disconnect())
