require('dotenv').config(); 
const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function main() { 
  const projectId = 'cmr6qa8gw00041373hf7jmmiq'; // American project
  
  const u = await prisma.user.findFirst({ where: { firstName: 'Asma', lastName: 'Hafiz' } });
  if(!u) return console.log('User Asma not found');
  
  // 1. Assign U0482 to her application
  await prisma.application.updateMany({
    where: { userId: u.id, projectId },
    data: { speakerCode: 'U0482', status: 'WORKING' } // Set back to WORKING so she can record
  });
  
  // 2. Find her 80 recordings on U0477
  const oldRecs = await prisma.voiceRecording.findMany({
    where: { userId: u.id, sentence: { projectId, speakerCode: 'U0477' } },
    include: { sentence: true }
  });
  
  console.log(`Found ${oldRecs.length} recordings for Asma on U0477`);
  
  const oldSentences = await prisma.projectSentence.findMany({ where: { speakerCode: 'U0477' }, orderBy: { order: 'asc' } });
  const newSentences = await prisma.projectSentence.findMany({ where: { speakerCode: 'U0482' }, orderBy: { order: 'asc' } });

  for(const rec of oldRecs) {
    const idx = oldSentences.findIndex(s => s.id === rec.sentenceId);
    if(idx !== -1 && newSentences[idx]) {
      const status = idx < 40 ? 'ACCEPTED' : 'NEED_RE_RECORD';
      const reason = idx < 40 ? null : 'نويز + سرعات مش مظبوطه + اسمع الجمله قبل الرفع';
      
      await prisma.voiceRecording.update({
        where: { id: rec.id },
        data: { sentenceId: newSentences[idx].id, status, rejectionReason: reason }
      });
    }
  }
  
  console.log(`Migrated Asma Hafiz to U0482 successfully.`);
} 

main().then(() => process.exit(0)).catch(console.error);
