const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const apps = await prisma.application.findMany({
    select: {
      speakerCode: true,
      user: { select: { firstName: true, lastName: true, email: true } },
      project: { select: { title: true } }
    }
  });
  console.log('Apps:', JSON.stringify(apps, null, 2));

  const uniqueCodes = await prisma.projectSentence.groupBy({
    by: ['speakerCode'],
    _count: { speakerCode: true }
  });
  console.log('Batch Codes in Sentences:', JSON.stringify(uniqueCodes, null, 2));
}

main().then(() => prisma.$disconnect());
