const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const projects = await prisma.project.findMany({
    where: { requiredParticipants: 17 },
    select: { id: true, title: true, scriptType: true }
  });
  console.log(projects);
}
main().catch(console.error).finally(() => prisma.$disconnect());
