const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projectId = 'cmr3u2h6q002ec4c0kypprpsi'; 
  const sentences = await prisma.projectSentence.findMany({
    where: { projectId, speakerCode: 'G0269' },
    select: { id: true, text: true }
  });
  
  console.log("Total G0269 sentences:", sentences.length);
  console.log("First 5:");
  sentences.slice(0, 5).forEach(s => console.log(s.text));
  
  console.log("... and the ones starting from 80:");
  sentences.slice(80, 85).forEach(s => console.log(s.text));
} 

main().then(() => prisma.$disconnect()).catch(console.error);
