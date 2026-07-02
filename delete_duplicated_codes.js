const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projectId = 'cmr3u2h6q002ec4c0kypprpsi';
  
  const sentencesCount = await prisma.projectSentence.groupBy({ 
    by: ['speakerCode'], 
    where: { projectId }, 
    _count: { _all: true } 
  }); 
  
  const duplicated = sentencesCount.filter(s => s._count._all > 80);
  console.log("Duplicated speaker codes:", duplicated);
  
  if (duplicated.length > 0) {
    const codesToDelete = duplicated.map(d => d.speakerCode);
    const res = await prisma.projectSentence.deleteMany({
      where: { projectId, speakerCode: { in: codesToDelete } }
    });
    console.log("Deleted all sentences for these codes. Count:", res.count);
  } else {
    console.log("No duplicated speaker codes found.");
  }
} 

main().then(() => prisma.$disconnect()).catch(console.error);
