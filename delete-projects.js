const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.rettlkmmznhdmdgqrhbc:ShehabTech2026%21@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1",
    },
  },
});

async function main() {
  console.log('Deleting all applications...');
  await prisma.application.deleteMany();

  console.log('Deleting all comments...');
  await prisma.comment.deleteMany();

  console.log('Deleting all project skills...');
  await prisma.projectSkill.deleteMany();

  console.log('Deleting all project languages...');
  await prisma.projectLanguage.deleteMany();

  console.log('Deleting all project images...');
  await prisma.projectImage.deleteMany();

  console.log('Deleting all projects...');
  const result = await prisma.project.deleteMany();
  
  console.log(`Successfully deleted ${result.count} projects.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
