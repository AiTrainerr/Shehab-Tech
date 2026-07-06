const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUser(userId, newCode, oldCode) {
  const projectId = 'cmr3u2h6q002ec4c0kypprpsi';
  
  // 1. Get original sentences
  const originalSents = await prisma.projectSentence.findMany({
    where: { projectId, speakerCode: oldCode },
    orderBy: { order: 'asc' }
  });

  if (originalSents.length === 0) {
    console.log(`No original sentences found for ${oldCode}`);
    return;
  }

  // 2. Create cloned sentences for the new code
  console.log(`Cloning ${originalSents.length} sentences to ${newCode}...`);
  const newSentsData = originalSents.map(s => ({
    projectId,
    speakerCode: newCode,
    text: s.text,
    order: s.order,
    assignedUserId: userId
  }));

  // Create them (we might have created some before, so delete first to be safe)
  await prisma.projectSentence.deleteMany({
    where: { projectId, speakerCode: newCode }
  });

  await prisma.projectSentence.createMany({
    data: newSentsData
  });

  // 3. Fetch the newly created sentences
  const newSents = await prisma.projectSentence.findMany({
    where: { projectId, speakerCode: newCode },
    orderBy: { order: 'asc' }
  });

  // 4. Move user's recordings from the old sentences to the new sentences
  console.log(`Moving recordings for ${userId} to ${newCode} sentences...`);
  const userRecordings = await prisma.voiceRecording.findMany({
    where: { userId }
  });

  for (const rec of userRecordings) {
    // Find which old sentence it belonged to
    const oldSent = originalSents.find(s => s.id === rec.sentenceId);
    if (oldSent) {
      // Find the corresponding new sentence
      const newSent = newSents.find(s => s.order === oldSent.order);
      if (newSent) {
        await prisma.voiceRecording.update({
          where: { id: rec.id },
          data: { sentenceId: newSent.id }
        });
      }
    }
  }

  console.log(`Successfully fixed ${userId} with code ${newCode}`);
}

async function main() {
  let retries = 10;
  while(retries > 0) {
    try {
      await fixUser('333752fa-0829-44ea-b783-de6135345806', 'G0271', 'G0289'); // samyhamr643
      await fixUser('a45b87af-e0b4-47c5-9d53-ac64121bb9a1', 'G0274', 'G0278'); // abuzaidnoor472
      await fixUser('99133487-0e05-44aa-a61c-5ddb4a7cc6e0', 'G0300', 'G0292'); // maryamshabara922
      console.log('ALL DONE!');
      return;
    } catch(e) {
      console.error('DB Error:', e.message);
      retries--;
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

main().finally(() => prisma.$disconnect());
