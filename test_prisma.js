const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projectIds = ['cmr3u2h6q002ec4c0kypprpsi'];
  const apps = await prisma.application.findMany({ where: { projectId: projectIds[0] }, take: 50 });
  const userIds = apps.map(u => u.userId);
  
  if (userIds.length === 0) return console.log('no users');
  
  try {
    const counts = await prisma.$queryRaw`
      SELECT r."userId", s."projectId", r.status, COUNT(r.id)::int as count
      FROM "VoiceRecording" r
      JOIN "ProjectSentence" s ON r."sentenceId" = s.id
      WHERE r."userId" IN (${Prisma.join(userIds)}) AND s."projectId" IN (${Prisma.join(projectIds)})
      GROUP BY r."userId", s."projectId", r.status
    `;
    console.log('Query returned rows:', counts.length);
    console.log(counts.slice(0, 5));
  } catch(e) {
    console.error('SQL Error:', e);
  }
}

main().finally(() => prisma.$disconnect());
