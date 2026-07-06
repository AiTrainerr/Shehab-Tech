require('dotenv').config(); 
const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } }); 

async function main() { 
  const projectId = 'cmr3u2h6q002ec4c0kypprpsi'; // UK English
  const americanId = 'cmr6qa8gw00041373hf7jmmiq'; // American

  const allApps = await prisma.application.findMany({ 
    where: { projectId: { in: [projectId, americanId] } }, 
    include: { user: true, project: true } 
  }); 
  
  console.log(`\nAuditing ${allApps.length} applications...\n`);
  const issues = [];
  
  for(const app of allApps) { 
    const recs = await prisma.voiceRecording.findMany({ 
      where: { userId: app.userId, sentence: { projectId: app.projectId } }, 
      include: { sentence: true },
      orderBy: { sentence: { order: 'asc' } }
    }); 
    
    const empty = recs.filter(r => !r.fileUrl || r.fileUrl === ''); 
    const wrongCode = recs.filter(r => r.sentence.speakerCode !== app.speakerCode);
    const wrongCodes = [...new Set(wrongCode.map(r => r.sentence.speakerCode))];
    
    if(empty.length > 0 || wrongCode.length > 0) { 
      issues.push({ 
        project: app.project.title.trim(),
        name: (app.user.firstName + ' ' + app.user.lastName).trim(), 
        appCode: app.speakerCode, 
        appStatus: app.status,
        total: recs.length, 
        emptyUrls: empty.length,
        emptyRanges: empty.map(r => r.sentence.order).slice(0, 5).join(', ') + (empty.length > 5 ? '...' : ''),
        wrongCodeCount: wrongCode.length, 
        recordedOnCodes: wrongCodes,
        note: wrongCode.length === recs.length ? '⚠️ ALL recs on wrong code' : `⚠️ ${wrongCode.length} on wrong code`
      }); 
    } 
  } 
  
  if(issues.length === 0) {
    console.log('✅ No issues found! All recordings match their speaker codes.');
  } else {
    console.log('=== ISSUES FOUND ===\n');
    issues.forEach(i => {
      console.log(`👤 ${i.name} | Project: ${i.project}`);
      console.log(`   App Code: ${i.appCode} | Status: ${i.appStatus} | Total recs: ${i.total}`);
      if(i.emptyUrls > 0) console.log(`   🗑️  Empty fileUrl (no audio): ${i.emptyUrls} recordings`);
      if(i.wrongCodeCount > 0) console.log(`   ❌ ${i.note} — recorded on: [${i.recordedOnCodes.join(', ')}]`);
      console.log('');
    });
  }
} 

main().then(() => process.exit(0)).catch(e => { console.error(e.message); process.exit(1); });
