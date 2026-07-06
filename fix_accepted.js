require('dotenv').config(); 
const { PrismaClient } = require('@prisma/client'); 

const dbUrl = (process.env.DATABASE_URL || '').replace(':6543', ':5432').replace('pgbouncer=true&', '').replace('&pgbouncer=true', '');
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } }); 

const REJECTION_REASON = 'نويز + سرعات مش مظبوطه + اسمع الجمله قبل الرفع';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const USERS_TO_FIX = ['Sara Mohammed', 'Sondos Abdalla', 'Habiba Mansor'];
const projectIds = ['cmr3u2h6q002ec4c0kypprpsi', 'cmr6qa8gw00041373hf7jmmiq'];

async function main() { 
  console.log('=== Marking first 40 as ACCEPTED, second 40 as NEED_RE_RECORD ===\n');

  for(const fullName of USERS_TO_FIX) {
    await sleep(400);
    const [firstName, ...rest] = fullName.split(' ');
    const lastName = rest.join(' ');

    const user = await prisma.user.findFirst({ 
      where: { firstName: { contains: firstName }, lastName: { contains: lastName } }
    });
    if(!user) { console.log(`⚠️ Not found: ${fullName}`); continue; }

    const app = await prisma.application.findFirst({
      where: { userId: user.id, projectId: { in: projectIds }, speakerCode: { not: null } }
    });
    if(!app) { console.log(`⚠️ No app for: ${fullName}`); continue; }

    const recs = await prisma.voiceRecording.findMany({ 
      where: { userId: user.id, sentence: { projectId: app.projectId } }, 
      select: { id: true, status: true, sentence: { select: { order: true } } },
      orderBy: { sentence: { order: 'asc' } }
    });

    recs.sort((a, b) => a.sentence.order - b.sentence.order);

    let acceptedCount = 0, reRecordCount = 0;
    for(let i = 0; i < recs.length; i++) {
      const rec = recs[i];
      if(i < 40) {
        // First 40 -> ACCEPTED, clear rejection reason
        await prisma.voiceRecording.update({ 
          where: { id: rec.id }, 
          data: { status: 'ACCEPTED', rejectionReason: null } 
        });
        acceptedCount++;
      } else {
        // 41-80 -> NEED_RE_RECORD with reason
        await prisma.voiceRecording.update({ 
          where: { id: rec.id }, 
          data: { status: 'NEED_RE_RECORD', rejectionReason: REJECTION_REASON } 
        });
        reRecordCount++;
      }
      await sleep(40);
    }

    await prisma.application.updateMany({
      where: { userId: user.id, projectId: app.projectId },
      data: { status: 'WORKING' }
    });

    console.log(`✅ ${fullName} (${app.speakerCode}): ${acceptedCount} ACCEPTED + ${reRecordCount} NEED_RE_RECORD`);
  }

  console.log('\n=== DONE ===');
} 

main().catch(e => { console.error('Error:', e.message); process.exit(1); }).then(() => process.exit(0));
