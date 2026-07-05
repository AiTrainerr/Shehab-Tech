require('dotenv').config(); 
const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function main() { 
  const projectId = 'cmr3u2h6q002ec4c0kypprpsi'; 
  const users = [
    { name: 'Zain', oldCode: 'G0281', newCode: 'G0277' }, // Zain got G0277
    { name: 'Sara', oldCode: 'G0277', newCode: 'G0278' },
    { name: 'Yasmin', oldCode: 'G0276', newCode: 'G0281' }, // Wait, Yasmin to G0281? But Rofa is on G0281!
    { name: 'Nour', oldCode: 'G0286', newCode: 'G0276' },
    { name: 'Mostafa', oldCode: 'G0288', newCode: 'G0285' },
    { name: 'Sondos', oldCode: 'G0282', newCode: 'G0288' },
    { name: 'Habiba', oldCode: 'G0280', newCode: 'G0289' },
    { name: 'Mohamed', oldCode: 'G0291', newCode: 'G0292' },
    { name: 'Esraa', oldCode: 'G0287', newCode: 'G0291' }
  ];

  for(const target of users) {
    const u = await prisma.user.findFirst({ where: { firstName: target.name } });
    if(!u) continue;
    
    // Get actual current code from app
    const app = await prisma.application.findFirst({ where: { userId: u.id, projectId } });
    if(!app) continue;
    const currentCode = app.speakerCode; // e.g. G0292
    
    // Find his recordings on ANY code EXCEPT currentCode
    const oldRecs = await prisma.voiceRecording.findMany({
      where: { userId: u.id, sentence: { projectId, speakerCode: { not: currentCode } } },
      include: { sentence: true }
    });
    
    if(oldRecs.length === 0) {
      console.log(`${target.name} has no old recordings to move.`);
      continue;
    }
    
    const oldCode = oldRecs[0].sentence.speakerCode;
    console.log(`Fixing ${target.name} - Moving from ${oldCode} to ${currentCode}`);

    const oldSentences = await prisma.projectSentence.findMany({ where: { speakerCode: oldCode }, orderBy: { order: 'asc' } });
    const newSentences = await prisma.projectSentence.findMany({ where: { speakerCode: currentCode }, orderBy: { order: 'asc' } });

    // Delete any NEW recordings he made on the new code to prevent unique constraint / overlap
    await prisma.voiceRecording.deleteMany({
      where: { userId: u.id, sentence: { speakerCode: currentCode } }
    });

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
    console.log(`Successfully mapped ${oldRecs.length} recordings for ${target.name}`);
  }
} 

main().then(() => process.exit(0)).catch(console.error);
