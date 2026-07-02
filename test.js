const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const s = await prisma.projectSentence.findMany({ 
    where: { projectId: 'cmr3u22kb0001c4c0p1daa8hj' }, 
    orderBy: { order: 'asc' } 
  }); 
  console.log('Count:', s.length); 
  console.log('First 2:', s.slice(0,2));
  
  // Find Mariam application
  const app = await prisma.application.findFirst({
    where: { projectId: 'cmr3u22kb0001c4c0p1daa8hj' },
    include: { user: true }
  });
  console.log('App:', app.id, app.status, app.user.firstName);
}

main().then(() => prisma.$disconnect());
