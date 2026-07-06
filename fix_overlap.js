require('dotenv').config(); 
const { PrismaClient } = require('@prisma/client'); 
const dbUrl = (process.env.DATABASE_URL || '').replace(':6543', ':5432').replace('pgbouncer=true&', '').replace('&pgbouncer=true', '');
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } }); 

async function main() { 
  const projectId = 'cmr3u2h6q002ec4c0kypprpsi'; // UK English
  const apps = await prisma.application.findMany({ 
    where: { projectId, speakerCode: { not: null } }, 
    include: { user: true } 
  }); 

  const byCode = {}; 
  apps.forEach(a => { 
    if(!byCode[a.speakerCode]) byCode[a.speakerCode] = []; 
    byCode[a.speakerCode].push(a); 
  }); 

  for(const code in byCode) { 
    if(byCode[code].length > 1) { 
      console.log('OVERLAP:', code, byCode[code].map(a => a.user.firstName + ' ' + a.user.lastName)); 
      
      const unassigned = await prisma.projectSentence.findFirst({ 
        where: { projectId, assignedUserId: null, speakerCode: { not: null } }, 
        orderBy: { speakerCode: 'asc' } 
      }); 
      
      if(!unassigned) {
        console.log('NO UNASSIGNED CODES LEFT!');
        continue;
      }

      const newCode = unassigned.speakerCode; 
      
      // Mover should be Sara Mohammed or the second person
      let mover = byCode[code].find(a => a.user.firstName.includes('Sara') || a.user.firstName.includes('Sondos') || a.user.firstName.includes('Habiba') || a.user.firstName.includes('Mohamed Gamal'));
      if(!mover) mover = byCode[code][1];

      console.log('Moving', mover.user.firstName, 'to', newCode); 
      
      await prisma.application.update({ 
        where: { id: mover.id }, 
        data: { speakerCode: newCode } 
      }); 
      
      await prisma.projectSentence.updateMany({ 
        where: { projectId, speakerCode: newCode }, 
        data: { assignedUserId: mover.userId } 
      }); 
      
      const oldSentences = await prisma.projectSentence.findMany({ 
        where: { projectId, speakerCode: code }, 
        orderBy: { order: 'asc' } 
      }); 
      const newSentences = await prisma.projectSentence.findMany({ 
        where: { projectId, speakerCode: newCode }, 
        orderBy: { order: 'asc' } 
      }); 
      
      const recs = await prisma.voiceRecording.findMany({ 
        where: { userId: mover.userId, sentence: { projectId, speakerCode: code } }, 
        include: { sentence: true } 
      }); 
      
      let movedCount = 0;
      for(const rec of recs) { 
        const idx = oldSentences.findIndex(s => s.id === rec.sentenceId); 
        if(idx !== -1 && newSentences[idx]) { 
          await prisma.voiceRecording.update({ 
            where: { id: rec.id }, 
            data: { sentenceId: newSentences[idx].id } 
          }); 
          movedCount++;
        } 
      } 
      console.log(`Fixed ${mover.user.firstName}. Moved ${movedCount} recs to ${newCode}`); 
    } 
  } 
  
  console.log('DONE FIXING OVERLAPS');
} 

main().catch(console.error).then(() => process.exit(0));
