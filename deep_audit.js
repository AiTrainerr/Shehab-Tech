require('dotenv').config(); 
const { PrismaClient } = require('@prisma/client'); 

const dbUrl = (process.env.DATABASE_URL || '').replace(':6543', ':5432').replace('pgbouncer=true&', '').replace('&pgbouncer=true', '');
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } }); 

const REJECTION_REASON = 'نويز + سرعات مش مظبوطه + اسمع الجمله قبل الرفع';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() { 
  const projectIds = [
    'cmr3u2h6q002ec4c0kypprpsi', // UK English
    'cmr6qa8gw00041373hf7jmmiq', // American
  ];

  // Load all apps
  const allApps = await prisma.application.findMany({ 
    where: { projectId: { in: projectIds } }, 
    include: { 
      user: { select: { id: true, firstName: true, lastName: true } }, 
      project: { select: { title: true } } 
    } 
  }); 

  console.log(`Loaded ${allApps.length} applications\n`);

  const issues = [];
  const emptyAudioUsers = [];

  // Check each app individually with a delay
  for(const app of allApps) {
    await sleep(150);
    
    const recs = await prisma.voiceRecording.findMany({ 
      where: { userId: app.userId, sentence: { projectId: app.projectId } }, 
      select: { id: true, fileUrl: true, status: true, sentence: { select: { id: true, speakerCode: true, order: true } } },
      orderBy: { sentence: { order: 'asc' } }
    });

    if(recs.length === 0) continue;

    const name = `${app.user.firstName} ${app.user.lastName}`.trim();
    const wrongRecs = recs.filter(r => r.sentence.speakerCode !== app.speakerCode);
    const emptyRecs = recs.filter(r => !r.fileUrl || r.fileUrl === '');

    if(wrongRecs.length > 0) {
      const wrongCodes = [...new Set(wrongRecs.map(r => r.sentence.speakerCode))];
      issues.push({ name, app, recs, wrongRecs, wrongCodes });
    }

    if(emptyRecs.length > 0) {
      emptyAudioUsers.push({ name, appCode: app.speakerCode, total: recs.length, empty: emptyRecs.length, emptyOrders: emptyRecs.map(r => r.sentence.order).sort((a,b)=>a-b) });
    }
  }

  console.log('=== AUDIT RESULTS ===\n');

  if(issues.length > 0) {
    console.log(`--- ❌ Wrong code (recordings not on their code): ${issues.length} users ---`);
    issues.forEach(i => {
      console.log(`   ${i.name} | App: ${i.app.speakerCode} | Recorded on: [${i.wrongCodes}] | Count: ${i.wrongRecs.length}`);
    });
  } else {
    console.log('--- ✅ No wrong-code issues found ---');
  }

  console.log('');

  if(emptyAudioUsers.length > 0) {
    console.log(`--- 🗑️  Empty audio (fileUrl cleared): ${emptyAudioUsers.length} users ---`);
    emptyAudioUsers.forEach(u => {
      const min = u.emptyOrders[0], max = u.emptyOrders[u.emptyOrders.length-1];
      console.log(`   ${u.name} | Code: ${u.appCode} | Empty: ${u.empty}/${u.total} (orders ${min}-${max})`);
    });
  } else {
    console.log('--- ✅ No empty audio issues ---');
  }

  // Fix wrong-code issues
  if(issues.length > 0) {
    console.log(`\n=== FIXING ${issues.length} WRONG-CODE USERS ===\n`);

    for(const { name, app, wrongRecs, wrongCodes } of issues) {
      const projectId = app.projectId;
      const wrongCode = wrongCodes[0];
      const correctCode = app.speakerCode;

      await sleep(200);
      const wrongSentences = await prisma.projectSentence.findMany({ 
        where: { projectId, speakerCode: wrongCode }, orderBy: { order: 'asc' } 
      });
      await sleep(200);
      const correctSentences = await prisma.projectSentence.findMany({ 
        where: { projectId, speakerCode: correctCode }, orderBy: { order: 'asc' } 
      });

      if(correctSentences.length === 0) {
        console.log(`⚠️  SKIP ${name}: no sentences for code ${correctCode}`);
        continue;
      }

      for(const rec of wrongRecs) {
        const idx = wrongSentences.findIndex(s => s.id === rec.sentence.id);
        if(idx === -1 || !correctSentences[idx]) continue;
        const order = correctSentences[idx].order;
        const isFirstHalf = order <= 40;

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
        await sleep(50);
      }

      await prisma.application.updateMany({
        where: { userId: app.userId, projectId },
        data: { status: 'WORKING' }
      });

      console.log(`✅ Fixed ${name}: ${wrongRecs.length} recs from ${wrongCode} -> ${correctCode}. 1-40 ACCEPTED, 41-80 NEED_RE_RECORD.`);
    }
  }

  console.log('\n=== DONE ===');
} 

main().catch(e => { console.error('Error:', e.message); process.exit(1); }).then(() => process.exit(0));
