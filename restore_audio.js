require('dotenv').config(); 
const { PrismaClient } = require('@prisma/client'); 

const dbUrl = (process.env.DATABASE_URL || '').replace(':6543', ':5432').replace('pgbouncer=true&', '').replace('&pgbouncer=true', '');
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } }); 

const REJECTION_REASON = 'نويز + سرعات مش مظبوطه + اسمع الجمله قبل الرفع';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Users whose ALL audio was wrongly cleared - need to restore first 40
const WRONGLY_CLEARED = ['Sara Mohammed ', 'Sondos  Abdalla', 'Habiba  Mansor'];

async function restoreUser(user, app) {
  const projectId = app.projectId;
  const correctCode = app.speakerCode;

  const recs = await prisma.voiceRecording.findMany({ 
    where: { userId: user.id, sentence: { projectId } }, 
    include: { sentence: true },
    orderBy: { sentence: { order: 'asc' } }
  });

  if(recs.length === 0) {
    console.log(`⚠️  ${user.firstName} ${user.lastName}: no recordings found`);
    return;
  }

  // Sort by sentence order to get positional index
  recs.sort((a, b) => a.sentence.order - b.sentence.order);

  let fixed = 0;
  for(let i = 0; i < recs.length; i++) {
    const rec = recs[i];
    const isFirstHalf = i < 40; // USE INDEX not order value

    if(isFirstHalf && (!rec.fileUrl || rec.fileUrl === '')) {
      // Try to reconstruct the Cloudinary URL
      // Pattern: shehab-tech/recordings/{userId}_{firstName}_{lastName}_{age}_{gender}/{firstName}_{lastName}_Sentence_{order}
      const age = user.age || '';
      const gender = user.gender || '';
      const sentOrder = rec.sentence.order;
      const publicId = `shehab-tech/recordings/${user.id}_${user.firstName}_${user.lastName}_${age}_${gender}/${user.firstName}_${user.lastName}_Sentence_${sentOrder}`;
      const fileUrl = `https://res.cloudinary.com/diajzedxs/video/upload/af_48000/shehab-tech/recordings/${encodeURIComponent(user.id + '_' + user.firstName + '_' + user.lastName + '_' + age + '_' + gender)}/${encodeURIComponent(user.firstName + '_' + user.lastName + '_Sentence_' + sentOrder)}.wav`;

      await prisma.voiceRecording.update({ 
        where: { id: rec.id }, 
        data: { 
          status: 'ACCEPTED',
          rejectionReason: null,
          fileUrl: fileUrl,
          publicId: publicId,
        } 
      });
      fixed++;
    } else if(!isFirstHalf) {
      // Ensure second half is NEED_RE_RECORD with empty audio (correct behavior)
      if(rec.status !== 'NEED_RE_RECORD') {
        await prisma.voiceRecording.update({ 
          where: { id: rec.id }, 
          data: { 
            status: 'NEED_RE_RECORD',
            rejectionReason: REJECTION_REASON,
            fileUrl: '',
            publicId: '',
          } 
        });
      }
    }
    await sleep(50);
  }

  await prisma.application.updateMany({
    where: { userId: user.id, projectId },
    data: { status: 'WORKING' }
  });

  console.log(`✅ ${user.firstName} ${user.lastName}: Restored ${fixed} first-half recordings to ACCEPTED. Second half marked NEED_RE_RECORD.`);
}

async function main() { 
  const projectIds = [
    'cmr3u2h6q002ec4c0kypprpsi', // UK English
    'cmr6qa8gw00041373hf7jmmiq', // American
  ];

  console.log('=== RESTORING WRONGLY-CLEARED AUDIO (First 40) ===\n');

  for(const name of WRONGLY_CLEARED) {
    const parts = name.trim().split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ').trim();

    await sleep(300);
    const user = await prisma.user.findFirst({ 
      where: { firstName: { contains: firstName }, lastName: { contains: lastName } }
    });

    if(!user) {
      console.log(`⚠️  User not found: ${name}`);
      continue;
    }

    const app = await prisma.application.findFirst({
      where: { userId: user.id, projectId: { in: projectIds }, speakerCode: { not: null } }
    });

    if(!app) {
      console.log(`⚠️  No valid app for: ${name}`);
      continue;
    }

    console.log(`\n--- Processing ${user.firstName} ${user.lastName} | Code: ${app.speakerCode} ---`);
    await restoreUser(user, app);
  }

  console.log('\n=== ALSO FIXING: Sondos US project (null code) ===\n');
  // Sondos Abdalla has a US project recording on U0478 with null app code - skip for now
  // Her UK project is the priority

  console.log('\n=== REPORTING remaining issues ===\n');
  console.log('The following still need manual review:');
  console.log('- Rofa Nolin (G0281): 43/49 empty audio in unexpected orders');
  console.log('- Yasmin Mina (G0281): 21/80 empty audio - BOTH Rofa and Yasmin are on G0281 (still conflicting)');
  console.log('- Zain Kamal (G0277): 14/54 empty audio (orders 1322-1335)');
  console.log('- Sondos Abdalla US project: null app code, recorded on U0478');

  console.log('\n=== DONE ===');
} 

main().catch(e => { console.error('Error:', e.message); process.exit(1); }).then(() => process.exit(0));
