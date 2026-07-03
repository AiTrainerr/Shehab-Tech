import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTamara() {
  const userId = 'd22561dd-77ad-4544-ad91-c8a844c5f9dd';

  // Find all projects she has applications for
  const applications = await prisma.application.findMany({
    where: { userId },
    select: { projectId: true, status: true, speakerCode: true }
  });

  console.log('Applications:', JSON.stringify(applications, null, 2));

  // Check sentences assigned to her across all projects
  const sentences = await prisma.projectSentence.findMany({
    where: { assignedUserId: userId },
    select: { id: true, projectId: true, speakerCode: true, order: true }
  });

  console.log('Total sentences assigned to her:', sentences.length);

  if (sentences.length > 0) {
    const result = await prisma.projectSentence.updateMany({
      where: { assignedUserId: userId },
      data: { assignedUserId: null }
    });
    console.log('Released:', result.count);
  }

  // Also check if she has a speakerCode on her application
  for (const app of applications) {
    console.log(`Project ${app.projectId}: status=${app.status}, speakerCode=${app.speakerCode}`);
    
    // Check sentences with her speakerCode
    if (app.speakerCode) {
      const codeCount = await prisma.projectSentence.count({
        where: { projectId: app.projectId, speakerCode: app.speakerCode }
      });
      console.log(`  Sentences with speakerCode ${app.speakerCode}:`, codeCount);
    }
  }

  await prisma.$disconnect();
}

fixTamara().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
