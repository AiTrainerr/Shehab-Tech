const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const apps = await prisma.application.findMany({ 
    where: { status: 'ACCEPTED' }, 
    include: { project: true, user: true } 
  });
  
  if (apps.length === 0) return console.log('No accepted apps');
  
  const app = apps.find(a => a.user.firstName.includes('Abdallah') || a.user.firstName.includes('Mariam'));
  if (!app) return console.log('Could not find Abdallah or Mariam');

  console.log('Rejecting app for:', app.user.firstName);
  const sentences = await prisma.projectSentence.findMany({ 
    where: { projectId: app.projectId }, 
    select: { id: true } 
  });
  console.log('Sentences count:', sentences.length);
  
  const res = await prisma.voiceRecording.deleteMany({ 
    where: { 
      userId: app.userId, 
      sentenceId: { in: sentences.map(s => s.id) } 
    } 
  });
  console.log('Deleted recordings:', res.count);

  await prisma.application.delete({ where: { id: app.id } });
  console.log('Application deleted successfully!');
}

main().then(() => prisma.$disconnect()).catch(console.error);
