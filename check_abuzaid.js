const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  let retries = 5;
  while(retries > 0) {
    try {
      const proj = await prisma.project.findUnique({ where: { id: 'cmr3u2h6q002ec4c0kypprpsi' } });
      console.log('Script type:', proj.scriptType);

      const sents = await prisma.projectSentence.count({ where: { speakerCode: 'G0274' } });
      console.log('Total sentences for G0274:', sents);

      const sentences = await prisma.projectSentence.findMany({ where: { assignedUserId: 'a45b87af-e0b4-47c5-9d53-ac64121bb9a1' } });
      console.log('abuzaidnoor assigned sentences:', sentences.length);
      return;
    } catch(e) {
      console.error('DB error, retrying...', retries);
      retries--;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}
main().finally(() => prisma.$disconnect());
