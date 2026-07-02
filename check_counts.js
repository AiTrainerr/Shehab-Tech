const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projectId = 'cmr3u2h6q002ec4c0kypprpsi'; 
  const sentencesCount = await prisma.projectSentence.groupBy({ 
    by: ['speakerCode'], 
    where: { projectId }, 
    _count: { _all: true } 
  }); 
  console.log(sentencesCount.slice(0, 10)); 
} 

main().then(() => prisma.$disconnect()).catch(console.error);
