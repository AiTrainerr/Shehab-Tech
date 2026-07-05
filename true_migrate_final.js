require('dotenv').config(); 
const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function main() { 
  const projectId = 'cmr3u2h6q002ec4c0kypprpsi'; 
  const users = [
    { name: 'Mohamed Gamal', oldCode: 'G0291', newCode: 'G0292' },
    { name: 'Sondos Abdalla', oldCode: 'G0282', newCode: 'G0288' },
    { name: 'Habiba Mansor', oldCode: 'G0280', newCode: 'G0289' },
    { name: 'Sara Mohammed', oldCode: 'G0277', newCode: 'G0278' }
  ];

  for(const target of users) {
    const first = target.name.split(' ')[0];
    const last = target.name.split(' ').slice(1).join(' ');
    
    const u = await prisma.user.findFirst({ where: { firstName: first, lastName: last } });
    if(!u) continue;
    
    const app = await prisma.application.findFirst({ where: { userId: u.id, projectId } });
    if(!app) continue;
    const currentCode = app.speakerCode; 
    
    // Find recordings not on the current code
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

    // Delete new recordings
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
