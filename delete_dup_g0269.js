const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projectId = 'cmr3u2h6q002ec4c0kypprpsi'; 
  const sentences = await prisma.projectSentence.findMany({
    where: { projectId, speakerCode: 'G0269' },
    orderBy: { id: 'asc' }
  });
  
  const toDelete = [];
  const seen = new Set();
  
  for (const s of sentences) {
    // we use a signature of text + speakerCode
    const sig = s.text + '_' + s.speakerCode + '_' + s.speed;
    if (seen.has(sig)) {
      toDelete.push(s.id);
    } else {
      seen.add(sig);
    }
  }
  
  console.log("Found", toDelete.length, "duplicate sentences for G0269");
  
  if (toDelete.length > 0) {
    const res = await prisma.projectSentence.deleteMany({
      where: { id: { in: toDelete } }
    });
    console.log("Deleted", res.count, "duplicates!");
  }
} 

main().then(() => prisma.$disconnect()).catch(console.error);
