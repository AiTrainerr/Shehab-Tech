require('dotenv').config(); 
const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function main() { 
  const projectId = 'cmr3u2h6q002ec4c0kypprpsi'; 
  const codes = ['G0276', 'G0277', 'G0280', 'G0282', 'G0286', 'G0287', 'G0288', 'G0291', 'U0477', 'G0281'];
  
  const recordings = await prisma.voiceRecording.findMany({ 
    where: { sentence: { projectId, speakerCode: { in: codes } } }, 
    select: { 
      sentenceId: true, 
      userId: true, 
      user: { 
        select: { 
          firstName: true, 
          gender: true,
          applications: { 
            select: { speakerCode: true }, 
            where: { projectId } 
          } 
        } 
      }, 
      sentence: { select: { speakerCode: true, order: true } } 
    } 
  }); 
  
  const counts = {}; 
  recordings.forEach(r => { 
    if(!counts[r.sentenceId]) counts[r.sentenceId] = { speakerCode: r.sentence.speakerCode, users: new Map() }; 
    const appCode = r.user.applications.length ? r.user.applications[0].speakerCode : null; 
    counts[r.sentenceId].users.set(r.userId, { id: r.userId, gender: r.user.gender, name: r.user.firstName, appCode }); 
  }); 
  
  const overlapGroups = new Map(); 
  Object.values(counts).forEach(({speakerCode, users}) => { 
    if(users.size > 1) { 
      const groupKey = Array.from(users.keys()).sort().join('_'); 
      if(!overlapGroups.has(groupKey)) overlapGroups.set(groupKey, { count: 0, code: speakerCode, users: Array.from(users.values()) }); 
      overlapGroups.get(groupKey).count++; 
    } 
  }); 
  
  const toFix = Array.from(overlapGroups.values()); 
  console.log(`Found ${toFix.length} groups to fix.`); 
  
  for(const group of toFix) { 
    let mover = null;
    const males = group.users.filter(u => u.gender === 'male');
    const females = group.users.filter(u => u.gender === 'female');
    
    if (males.length === 1 && females.length === 1) {
      mover = females[0];
    } else {
      mover = group.users.find(u => u.appCode !== group.code) || group.users[1];
    }
    
    const unassignedGroup = await prisma.projectSentence.findFirst({ 
      where: { projectId, assignedUserId: null, speakerCode: { not: null } }, 
      orderBy: { speakerCode: 'asc' } 
    }); 
    
    if(!unassignedGroup) { 
      console.log('No unassigned groups left!'); 
      break; 
    } 
    
    const newCode = unassignedGroup.speakerCode; 
    console.log(`Migrating user ${mover.name} (${mover.gender}) from ${group.code} to ${newCode}`); 
    
    await prisma.application.updateMany({ 
      where: { userId: mover.id, projectId }, 
      data: { speakerCode: newCode, status: 'WORKING' } 
    }); 
    
    await prisma.projectSentence.updateMany({ 
      where: { projectId, speakerCode: newCode }, 
      data: { assignedUserId: mover.id } 
    }); 
    
    const userRecordings = await prisma.voiceRecording.findMany({ 
      where: { userId: mover.id, sentence: { speakerCode: group.code } }, 
      include: { sentence: true } 
    }); 
    
    for(const rec of userRecordings) { 
      const newSentence = await prisma.projectSentence.findFirst({ 
        where: { projectId, speakerCode: newCode, order: rec.sentence.order } 
      }); 
      
      if(newSentence) { 
        if (rec.sentence.order <= 40) {
          // Keep as is
          await prisma.voiceRecording.update({ 
            where: { id: rec.id }, 
            data: { sentenceId: newSentence.id } 
          }); 
        } else {
          // Reject 41-80
          await prisma.voiceRecording.update({ 
            where: { id: rec.id }, 
            data: { 
              sentenceId: newSentence.id,
              status: 'REJECTED',
              rejectionReason: 'نويز + سرعات مش مظبوطه + اسمع الجمله قبل الرفع'
            } 
          }); 
        }
      } 
    } 
    
    // Release the old sentences that were assigned to the mover
    await prisma.projectSentence.updateMany({ 
      where: { projectId, speakerCode: group.code, assignedUserId: mover.id }, 
      data: { assignedUserId: null } 
    }); 
    console.log(`Successfully migrated user ${mover.name}`); 
  } 
} 

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
