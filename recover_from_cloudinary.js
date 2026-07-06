require('dotenv').config(); 
const { PrismaClient } = require('@prisma/client'); 
const https = require('https');

const dbUrl = (process.env.DATABASE_URL || '').replace(':6543', ':5432').replace('pgbouncer=true&', '').replace('&pgbouncer=true', '');
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } }); 

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// List resources by prefix (folder listing)
function cloudinaryListPrefix(prefix, nextCursor) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');
    let path = `/v1_1/${CLOUD_NAME}/resources/video?type=upload&prefix=${encodeURIComponent(prefix)}&max_results=200`;
    if(nextCursor) path += `&next_cursor=${nextCursor}`;
    
    const options = {
      hostname: 'api.cloudinary.com',
      path: path,
      method: 'GET',
      headers: { 'Authorization': `Basic ${auth}` }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } 
        catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function getAllFilesWithPrefix(prefix) {
  const allFiles = [];
  let nextCursor = null;
  do {
    const result = await cloudinaryListPrefix(prefix, nextCursor);
    if(result.resources) allFiles.push(...result.resources);
    nextCursor = result.next_cursor || null;
    if(nextCursor) await sleep(300);
  } while(nextCursor);
  return allFiles;
}

const USERS = [
  { name: 'Sara Mohammed',  userId: 'c4d76e3a-483c-4926-9a86-6a1405907e7f', oldCode: 'G0277', newCode: 'G0278' },
  { name: 'Sondos Abdalla', userId: '5db5fe92-b844-4d61-ac8b-568e4fb65616', oldCode: 'G0282', newCode: 'G0288' },
  { name: 'Habiba Mansor',  userId: 'e928bbd2-9113-44c0-91f0-441e568ed179', oldCode: 'G0280', newCode: 'G0289' },
];

const PROJECT_ID = 'cmr3u2h6q002ec4c0kypprpsi';

async function main() { 
  console.log(`=== RECOVERING AUDIO VIA FOLDER LISTING ===\n`);

  for(const target of USERS) {
    await sleep(500);
    console.log(`\n--- ${target.name} | ${target.oldCode} -> ${target.newCode} ---`);

    // Get old code sentences (Cloudinary files named with these orders)
    const oldSentences = await prisma.projectSentence.findMany({ 
      where: { projectId: PROJECT_ID, speakerCode: target.oldCode },
      orderBy: { order: 'asc' }
    });

    // Get new code sentences 
    const newSentences = await prisma.projectSentence.findMany({ 
      where: { projectId: PROJECT_ID, speakerCode: target.newCode },
      orderBy: { order: 'asc' }
    });

    // Get user's recordings on new code
    const recs = await prisma.voiceRecording.findMany({ 
      where: { userId: target.userId, sentence: { projectId: PROJECT_ID, speakerCode: target.newCode } },
      include: { sentence: true },
      orderBy: { sentence: { order: 'asc' } }
    });

    // Find Cloudinary folder for this user
    const prefix = `shehab-tech/recordings/${target.userId}`;
    console.log(`  Listing Cloudinary folder: ${prefix}`);
    const cloudFiles = await getAllFilesWithPrefix(prefix);
    console.log(`  Found ${cloudFiles.length} files on Cloudinary`);

    if(cloudFiles.length === 0) {
      console.log(`  ⚠️ No files found!`);
      continue;
    }

    // Print sample file public_id
    console.log(`  Sample: ${cloudFiles[0].public_id}`);

    // Build map: old sentence order -> Cloudinary resource
    const oldOrderToResource = {};
    cloudFiles.forEach(r => {
      const match = r.public_id.match(/Sentence_(\d+)/);
      if(match) oldOrderToResource[parseInt(match[1])] = r;
    });

    const cloudOrders = Object.keys(oldOrderToResource).map(Number).sort((a,b)=>a-b);
    console.log(`  Cloudinary orders range: ${cloudOrders[0]} - ${cloudOrders[cloudOrders.length-1]} (total: ${cloudOrders.length})`);
    console.log(`  Old code sentence orders range: ${oldSentences[0]?.order} - ${oldSentences[oldSentences.length-1]?.order}`);

    // Map: new sentence id -> position index
    const newSentenceIndexMap = {};
    newSentences.forEach((s, i) => newSentenceIndexMap[s.id] = i);

    let recovered = 0, skipped = 0, notFound = 0;

    for(let i = 0; i < 40 && i < recs.length; i++) {
      const rec = recs[i];
      if(rec.fileUrl && rec.fileUrl !== '') { skipped++; continue; }

      // Position i in new code corresponds to position i in old code
      const oldSentence = oldSentences[i];
      if(!oldSentence) { notFound++; continue; }

      const resource = oldOrderToResource[oldSentence.order];
      if(!resource) {
        console.log(`  ⚠️ Position ${i+1}: old order ${oldSentence.order} not found`);
        notFound++;
        continue;
      }

      const ext = resource.format || 'wav';
      const fileUrl = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/af_48000/${resource.public_id}.${ext}`;

      await prisma.voiceRecording.update({
        where: { id: rec.id },
        data: { 
          fileUrl: fileUrl,
          publicId: resource.public_id,
          status: 'ACCEPTED',
          rejectionReason: null
        }
      });
      recovered++;
      await sleep(40);
    }

    console.log(`  ✅ Recovered: ${recovered} | Already had URL: ${skipped} | Not found: ${notFound}`);
  }

  console.log('\n=== DONE ===');
} 

main().catch(e => { console.error('Error:', e.message); process.exit(1); }).then(() => process.exit(0));
