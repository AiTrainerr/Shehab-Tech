const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDuplicates() {
  const projectId = 'cmr3u2h6q002ec4c0kypprpsi';
  
  // Find all applications in this project with a speakerCode
  const apps = await prisma.application.findMany({
    where: { projectId, speakerCode: { not: null } },
    orderBy: { createdAt: 'asc' }
  });

  const codesMap = {};
  const duplicates = [];
  
  for (const app of apps) {
    if (codesMap[app.speakerCode]) {
      duplicates.push(app);
    } else {
      codesMap[app.speakerCode] = true;
    }
  }
  
  console.log(`Found ${duplicates.length} duplicate assignments.`);
  
  // Find highest current code
  const lastApp = await prisma.application.findFirst({
    where: { projectId, speakerCode: { not: null } },
    orderBy: { speakerCode: 'desc' }
  });
  
  let nextNumber = 318;
  if (lastApp && lastApp.speakerCode) {
    const match = lastApp.speakerCode.match(/G(\d+)/);
    if (match) {
      nextNumber = Math.max(nextNumber, parseInt(match[1]) + 1);
    }
  }

  for (const dup of duplicates) {
    // If it was already updated, skip
    if (dup.speakerCode !== 'G0304' && dup.speakerCode !== 'G0303' && dup.speakerCode !== 'G0307' && dup.speakerCode !== 'G0308' && dup.speakerCode !== 'G0311' && dup.speakerCode !== 'G0313' && dup.speakerCode !== 'G0312') {
      continue;
    }

    const newCode = `G${nextNumber.toString().padStart(4, '0')}`;
    nextNumber++;
    
    console.log(`Fixing duplicate for user ${dup.userId} (old: ${dup.speakerCode} -> new: ${newCode})`);
    
    await prisma.$transaction(async (tx) => {
      // 1. Update Application to new code
      await tx.application.update({
        where: { id: dup.id },
        data: { speakerCode: newCode }
      });
      
      // 2. Clone the original sentences to the new code
      const originalSentences = await tx.projectSentence.findMany({
        where: { projectId, speakerCode: dup.speakerCode },
        orderBy: { order: 'asc' }
      });
      
      for (const sent of originalSentences) {
        // Create cloned sentence
        const newSent = await tx.projectSentence.create({
          data: {
            projectId,
            text: sent.text,
            speakerCode: newCode,
            order: sent.order,
            audioId: sent.audioId,
            speed: sent.speed,
            assignedUserId: dup.userId
          }
        });
        
        // 3. Move recordings for this user from old sentence to new sentence
        await tx.voiceRecording.updateMany({
          where: { 
            userId: dup.userId, 
            sentenceId: sent.id 
          },
          data: { sentenceId: newSent.id }
        });
      }
      
      // 4. Also release the old sentences from this user just in case they were locked
      await tx.projectSentence.updateMany({
        where: { projectId, speakerCode: dup.speakerCode, assignedUserId: dup.userId },
        data: { assignedUserId: null }
      });
    }, { timeout: 100000 });
    
    console.log(`Successfully migrated user ${dup.userId} to ${newCode}`);
  }
}

fixDuplicates().catch(console.error).finally(() => prisma.$disconnect());
