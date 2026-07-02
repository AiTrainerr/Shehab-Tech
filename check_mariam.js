const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projectId = 'cmr3u2h6q002ec4c0kypprpsi'; 
  const apps = await prisma.application.findMany({
    where: { projectId },
    include: { user: true }
  });
  
  const mariamApp = apps.find(a => a.user.firstName.toLowerCase().includes('mariam') || a.user.firstName.toLowerCase().includes('مريم'));
  
  if (!mariamApp) {
    console.log("Mariam not found");
    return;
  }
  
  console.log("Mariam's app:", mariamApp.id, "Status:", mariamApp.status, "SpeakerCode:", mariamApp.speakerCode);
  
  if (mariamApp.speakerCode) {
    const sentences = await prisma.projectSentence.findMany({
      where: { projectId, speakerCode: mariamApp.speakerCode }
    });
    console.log("Sentences for this code:", sentences.length);
  }
} 

main().then(() => prisma.$disconnect()).catch(console.error);
