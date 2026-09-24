const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres.rettlkmmznhdmdgqrhbc:ShehabTech2026%21@aws-0-eu-west-1.pooler.supabase.com:5432/postgres' } } });

async function fix() {
  const sentences = await prisma.projectSentence.findMany({
    where: { projectId: 'cmrdvg2zw0001piril2jsy6fp' },
    orderBy: { order: 'asc' },
    select: { id: true, order: true }
  });
  
  console.log('Found', sentences.length, 'sentences');
  
  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    // Calculate 1 to 80 based on the order
    const relativeOrder = (s.order - 1) % 80 + 1;
    const newAudioId = 'N' + String(relativeOrder).padStart(4, '0');
    
    await prisma.projectSentence.update({
      where: { id: s.id },
      data: { audioId: newAudioId }
    });
    if (i % 100 === 0) console.log(`Updated ${i}`);
  }
  console.log('Done!');
}

fix().catch(console.error);
