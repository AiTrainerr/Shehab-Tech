const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function undoDuplicates2() {
  const projectId = 'cmr3u2h6q002ec4c0kypprpsi';
  
  const mappings = [
    { newCode: 'G0320', oldCode: 'G0307', userId: '8801ab4f-f1a4-4000-8624-592d4debc47b' },
    { newCode: 'G0321', oldCode: 'G0308', userId: 'c4dd5b63-be12-4fc0-a8c8-4a330a2f5687' },
  ];

  const cutoff = new Date(Date.now() - 3600000); // 1 hour ago

  for (const map of mappings) {
    console.log(`Reverting ${map.newCode} back to ${map.oldCode} for user ${map.userId}`);
    
    // 1. Get the cloned sentences
    const clonedSents = await prisma.projectSentence.findMany({
      where: { projectId, speakerCode: map.newCode, createdAt: { gt: cutoff } }
    });
    
    if (clonedSents.length === 0) {
      console.log(`No cloned sentences found for ${map.newCode}`);
      continue;
    }

    // 2. Get the original sentences
    const originalSents = await prisma.projectSentence.findMany({
      where: { projectId, speakerCode: map.oldCode },
      orderBy: { order: 'asc' }
    });

    console.log(`Found ${clonedSents.length} cloned and ${originalSents.length} original sentences`);

    await prisma.$transaction(async (tx) => {
      // 3. Move recordings back to original sentences
      for (const cloned of clonedSents) {
        // Find matching original sentence by order
        const orig = originalSents.find(s => s.order === cloned.order);
        if (orig) {
          await tx.voiceRecording.updateMany({
            where: { userId: map.userId, sentenceId: cloned.id },
            data: { sentenceId: orig.id }
          });
        }
      }

      // 4. Delete the cloned sentences
      await tx.projectSentence.deleteMany({
        where: { id: { in: clonedSents.map(s => s.id) } }
      });

      // 5. Re-lock the original sentences to this user
      await tx.projectSentence.updateMany({
        where: { projectId, speakerCode: map.oldCode },
        data: { assignedUserId: map.userId }
      });

      // 6. Update the Application back to the old code
      await tx.application.updateMany({
        where: { projectId, userId: map.userId, speakerCode: map.newCode },
        data: { speakerCode: map.oldCode }
      });
    }, { timeout: 100000 });
    
    console.log(`Successfully reverted ${map.newCode} -> ${map.oldCode}`);
  }
}

undoDuplicates2().catch(console.error).finally(() => prisma.$disconnect());
