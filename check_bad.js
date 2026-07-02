const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const badSentences = await prisma.projectSentence.findMany({
    where: { text: { contains: '录音人id' } }
  });
  console.log('Bad sentences:', badSentences);
}

main().then(() => prisma.$disconnect());
