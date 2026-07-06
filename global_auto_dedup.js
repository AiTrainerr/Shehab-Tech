const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function globalAutoDedup() {
  console.log("Starting Global Auto Deduplication Script...");
  
  // Get all projects
  const projects = await prisma.project.findMany({
    select: { id: true, title: true }
  });
  
  for (const project of projects) {
    console.log(`\nChecking project: ${project.title} (${project.id})`);
    
    const apps = await prisma.application.findMany({
      where: { projectId: project.id, speakerCode: { not: null } },
      orderBy: { createdAt: 'asc' }
    });
    
    const codesMap = {};
    const duplicates = [];
    let maxNumber = 0;
    let codePrefix = "G";
    
    for (const app of apps) {
      if (app.speakerCode) {
        const match = app.speakerCode.match(/([A-Za-z]+)(\d+)/);
        if (match) {
          codePrefix = match[1];
          maxNumber = Math.max(maxNumber, parseInt(match[2], 10));
        }
      }
      
      if (!codesMap[app.speakerCode]) {
        codesMap[app.speakerCode] = [app];
      } else {
        codesMap[app.speakerCode].push(app);
        duplicates.push(app);
      }
    }
    
    if (duplicates.length === 0) {
      console.log(`✅ No duplicates found in project ${project.title}`);
      continue;
    }
    
    console.log(`⚠️ Found ${duplicates.length} duplicated users in project ${project.title}`);
    
    let nextNumber = maxNumber + 1;
    
    for (const dup of duplicates) {
      const newCode = `${codePrefix}${nextNumber.toString().padStart(4, '0')}`;
      nextNumber++;
      
      console.log(`   Fixing user ${dup.userId} (old: ${dup.speakerCode} -> new: ${newCode})`);
      
      try {
        await prisma.$transaction(async (tx) => {
          // 1. Update Application to new code
          await tx.application.update({
            where: { id: dup.id },
            data: { speakerCode: newCode }
          });
          
          // 2. Clone the original sentences to the new code
          const originalSentences = await tx.projectSentence.findMany({
            where: { projectId: project.id, speakerCode: dup.speakerCode },
            orderBy: { order: 'asc' }
          });
          
          if (originalSentences.length > 0) {
            for (const sent of originalSentences) {
              const newSent = await tx.projectSentence.create({
                data: {
                  projectId: project.id,
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
          }
          
          // 4. Release the old sentences from this user (if they were assigned)
          await tx.projectSentence.updateMany({
            where: { projectId: project.id, speakerCode: dup.speakerCode, assignedUserId: dup.userId },
            data: { assignedUserId: null }
          });
          
        }, { timeout: 150000 });
        console.log(`   ✅ Successfully migrated user ${dup.userId} to ${newCode}`);
      } catch (e) {
        console.error(`   ❌ Failed to migrate user ${dup.userId}: ${e.message}`);
      }
    }
  }
  
  console.log("\nAll projects checked.");
}

async function runWithRetries() {
  let retries = 5;
  while (retries > 0) {
    try {
      await globalAutoDedup();
      break;
    } catch (e) {
      console.error(`Database connection error: ${e.message}`);
      retries--;
      if (retries > 0) {
        console.log(`Waiting 5 seconds before retrying... (${retries} retries left)`);
        await delay(5000);
      } else {
        console.error("Out of retries.");
      }
    }
  }
  prisma.$disconnect();
}

runWithRetries();
