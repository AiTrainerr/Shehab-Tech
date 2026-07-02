const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.projectSentence.deleteMany({
    where: { projectId: 'cmr3u2h6q002ec4c0kypprpsi', speakerCode: 'G0269' }
  });
  console.log('Deleted G0269 entirely');
}
main().then(() => prisma.$disconnect()).catch(console.error);
