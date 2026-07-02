const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.projectSentence.count({
    where: { projectId: 'cmr3u2h6q002ec4c0kypprpsi', speakerCode: 'G0269' }
  });
  console.log('G0269 count:', count);
}
main().then(() => prisma.$disconnect()).catch(console.error);
