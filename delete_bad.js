const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const res = await prisma.projectSentence.deleteMany({
    where: { speakerCode: null }
  });
  console.log('Deleted null speakerCode sentences:', res.count);
}

main().then(() => prisma.$disconnect());
