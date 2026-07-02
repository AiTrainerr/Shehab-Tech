const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const apps = await prisma.application.findMany({
    select: { speakerCode: true, user: { select: { firstName: true } } }
  });
  const mariam = apps.find(a => a.user.firstName.toLowerCase().includes('mariam') || a.user.firstName.toLowerCase().includes('مريم'));
  console.log('Mariam App:', mariam);
  
  const counts = await prisma.projectSentence.groupBy({
    by: ['speakerCode'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });
  console.log('Top speaker codes by count:', counts.slice(0, 10));
  
  // also check the actual sentences for the top code
  const topCode = counts[0].speakerCode;
  const topSentences = await prisma.projectSentence.findMany({
    where: { speakerCode: topCode },
    take: 3
  });
  console.log('Sample sentences for top code:', topSentences);
}

main().then(() => prisma.$disconnect());
