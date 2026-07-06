require('dotenv').config(); 
const { PrismaClient } = require('@prisma/client'); 

// Use direct connection (port 5432) to avoid pooler P1017 drops
const dbUrl = (process.env.DATABASE_URL || '').replace(':6543', ':5432').replace('pgbouncer=true&', '').replace('&pgbouncer=true', '');
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } }); 

const REJECTION_REASON = 'نويز + سرعات مش مظبوطه + اسمع الجمله قبل الرفع';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() { 
  const projectIds = [
    'cmr3u2h6q002ec4c0kypprpsi', // UK English
    'cmr6qa8gw00041373hf7jmmiq', // American
  ];

  console.log('=== STEP 1: AUDIT ===\n');

  // Load all recordings grouped by user+project in ONE query
  const allRecs = await prisma.voiceRecording.findMany({ 
    where: { sentence: { projectId: { in: projectIds } } }, 
    select: { id: true, userId: true, fileUrl: true, status: true, sentence: { select: { id: true, projectId: true, speakerCode: true, order: true } } }
  }); 

  // Load all apps
  const allApps = await prisma.application.findMany({ 
    where: { projectId: { in: projectIds } }, 
    include: { user: { select: { firstName: true, lastName: true } }, project: { select: { title: true } } } 
  }); 

  // Build map: userId_projectId -> { appCode, name, projectTitle }
  const appMap = {};
  allApps.forEach(a => {
    appMap[`${a.userId}_${a.projectId}`] = { 
      appCode: a.speakerCode, 
      name: `${a.user.firstName} ${a.user.lastName}`.trim(),
      projectTitle: a.project.title.trim(),
      appId: a.id
    };
  });

  // Group recordings by userId_projectId
  const recsByUser = {};
  allRecs.forEach(r => {
    const key = `${r.userId}_${r.sentence.projectId}`;
    if(!recsByUser[key]) recsByUser[key] = [];
    recsByUser[key].push(r);
  });

  // Find issues
  const toFix = [];
  for(const [key, recs] of Object.entries(recsByUser)) {
    const app = appMap[key];
    if(!app || !app.appCode) continue;
    
    const wrongRecs = recs.filter(r => r.sentence.speakerCode !== app.appCode);
    const emptyRecs = recs.filter(r => !r.fileUrl || r.fileUrl === '');
    
    if(wrongRecs.length > 0) {
      const wrongCodes = [...new Set(wrongRecs.map(r => r.sentence.speakerCode))];
      console.log(`❌ ${app.name} | ${app.projectTitle}`);
      console.log(`   App Code: ${app.appCode} | Total recs: ${recs.length} | On wrong code: ${wrongRecs.length} (codes: ${wrongCodes.join(', ')})`);
      if(emptyRecs.length > 0) console.log(`   🗑️  Empty audio: ${emptyRecs.length}`);
      toFix.push({ key, app, recs, wrongRecs });
    }
  }

  if(toFix.length === 0) {
    console.log('✅ No code mismatches found!');
    return;
  }

  console.log(`\n=== STEP 2: FIX ${toFix.length} USERS ===\n`);

  for(const { app, recs, wrongRecs } of toFix) {
    const projectId = wrongRecs[0].sentence.projectId;
    const wrongCode = wrongRecs[0].sentence.speakerCode; // The code they recorded on
    const correctCode = app.appCode; // Their actual code

    // Load sentences for both codes ordered by position
    const wrongSentences = await prisma.projectSentence.findMany({ 
      where: { projectId, speakerCode: wrongCode }, 
      orderBy: { order: 'asc' } 
    });
    const correctSentences = await prisma.projectSentence.findMany({ 
      where: { projectId, speakerCode: correctCode }, 
      orderBy: { order: 'asc' } 
    });

    if(correctSentences.length === 0) {
      console.log(`⚠️  SKIP ${app.name}: no sentences found for code ${correctCode}`);
      continue;
    }

    let moved = 0;
    for(const rec of wrongRecs) {
      const idx = wrongSentences.findIndex(s => s.id === rec.sentence.id);
      if(idx === -1 || !correctSentences[idx]) continue;

      const isFirstHalf = correctSentences[idx].order <= 40;
      await prisma.voiceRecording.update({ 
        where: { id: rec.id }, 
        data: { 
          sentenceId: correctSentences[idx].id,
          status: isFirstHalf ? 'ACCEPTED' : 'NEED_RE_RECORD',
          rejectionReason: isFirstHalf ? null : REJECTION_REASON,
          fileUrl: isFirstHalf ? undefined : '',
          publicId: isFirstHalf ? undefined : '',
        } 
      });
      moved++;
    }

    // Ensure application is in correct state
    await prisma.application.updateMany({
      where: { userId: wrongRecs[0].userId, projectId },
      data: { status: 'WORKING' }
    });

    console.log(`✅ Fixed ${app.name}: moved ${moved} recs from ${wrongCode} -> ${correctCode}. 1-40 ACCEPTED, 41-80 NEED_RE_RECORD.`);
    await sleep(300);
  }

  console.log('\n=== DONE ===');
} 

main().catch(e => { console.error('Error:', e.message); process.exit(1); }).then(() => process.exit(0));
