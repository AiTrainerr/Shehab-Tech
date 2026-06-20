import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fix() {
  console.log("Assigning speaker codes to old completed applications...")
  
  // Find all projects
  const projects = await prisma.project.findMany({
    select: { id: true }
  })

  let count = 0;

  for (const project of projects) {
    const completedApps = await prisma.application.findMany({
      where: {
        projectId: project.id,
        status: { in: ['FINAL_REVIEW', 'APPROVED', 'PAID'] },
        speakerCode: null
      },
      orderBy: { updatedAt: 'asc' }
    });

    for (const app of completedApps) {
      // Find highest existing code for this project
      const lastApp = await prisma.application.findFirst({
        where: {
          projectId: project.id,
          speakerCode: { not: null }
        },
        orderBy: { speakerCode: 'desc' }
      });
      
      let nextNumber = 1;
      if (lastApp && lastApp.speakerCode) {
        const match = lastApp.speakerCode.match(/G(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      const speakerCode = `G${nextNumber.toString().padStart(4, '0')}`;
      
      await prisma.application.update({
        where: { id: app.id },
        data: { speakerCode }
      });
      console.log(`Assigned ${speakerCode} to app ${app.id}`);
      count++;
    }
  }

  console.log(`Assigned codes to ${count} applications!`)
}

fix().catch(console.error).finally(() => prisma.$disconnect())
