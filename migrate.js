require('dotenv').config(); 
const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function main() { 
  const projectId = 'cmr3u2h6q002ec4c0kypprpsi'; 
  
  const recordings = await prisma.voiceRecording.findMany({ 
    where: { sentence: { projectId } }, 
    select: { 
      sentenceId: true, 
      userId: true, 
      user: { 
        select: { 
          firstName: true, 
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
    counts[r.sentenceId].users.set(r.userId, { id: r.userId, appCode }); 
  }); 
  
  const overlapGroups = new Map(); 
  Object.values(counts).forEach(({speakerCode, users}) => { 
    if(users.size > 1) { 
      const groupKey = Array.from(users.keys()).sort().join('_'); 
      if(!overlapGroups.has(groupKey)) overlapGroups.set(groupKey, { count: 0, code: speakerCode, users: Array.from(users.values()) }); 
      overlapGroups.get(groupKey).count++; 
    } 
  }); 
  
  const toFix = Array.from(overlapGroups.values()).filter(g => g.count < 40); 
  console.log(`Found ${toFix.length} groups to fix.`); 
  
  for(const group of toFix) { 
    let intruder = group.users.find(u => u.appCode !== group.code); 
    if(!intruder) intruder = group.users[1]; 
    
    const unassignedGroup = await prisma.projectSentence.findFirst({ 
      where: { projectId, assignedUserId: null, speakerCode: { not: null } }, 
      orderBy: { speakerCode: 'asc' } 
    }); 
    
    if(!unassignedGroup) { 
      console.log('No unassigned groups left!'); 
      break; 
    } 
    
    const newCode = unassignedGroup.speakerCode; 
    console.log(`Migrating user ${intruder.id} from ${group.code} to ${newCode}`); 
    
    await prisma.application.updateMany({ 
      where: { userId: intruder.id, projectId }, 
      data: { speakerCode: newCode } 
    }); 
    
    await prisma.projectSentence.updateMany({ 
      where: { projectId, speakerCode: newCode }, 
      data: { assignedUserId: intruder.id } 
    }); 
    
    const userRecordings = await prisma.voiceRecording.findMany({ 
      where: { userId: intruder.id, sentence: { speakerCode: group.code } }, 
      include: { sentence: true } 
    }); 
    
    for(const rec of userRecordings) { 
      const newSentence = await prisma.projectSentence.findFirst({ 
        where: { projectId, speakerCode: newCode, order: rec.sentence.order } 
      }); 
      if(newSentence) { 
        await prisma.voiceRecording.update({ 
          where: { id: rec.id }, 
          data: { sentenceId: newSentence.id } 
        }); 
      } 
    } 
    
    // Release the old sentences that were assigned to the intruder
    await prisma.projectSentence.updateMany({ 
      where: { projectId, speakerCode: group.code, assignedUserId: intruder.id }, 
      data: { assignedUserId: null } 
    }); 
    console.log(`Successfully migrated user ${intruder.id} to new code ${newCode}`); 
  } 
} 

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
