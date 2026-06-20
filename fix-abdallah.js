const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { 
      firstName: { contains: 'Abdallah', mode: 'insensitive' },
      lastName: { contains: 'Shehab', mode: 'insensitive' }
    }
  });

  if (users.length === 0) {
    console.log("Could not find any user named Abdallah Shehab.");
    return;
  }

  console.log(`Found ${users.length} users named Abdallah Shehab.`);

  for (const user of users) {
    console.log(`\nChecking applications for: ${user.email} (ID: ${user.id})`);
    const apps = await prisma.application.findMany({
      where: { userId: user.id },
      include: { project: true }
    });

    console.log(`Found ${apps.length} total applications for this user.`);

    for (const app of apps) {
      console.log(`Project: "${app.project.title}" | Status: ${app.status} | Price: $${app.project.price}`);
      if (app.status === 'APPROVED' || app.status === 'PAID') {
        console.log(`Reverting application for project "${app.project.title}" from ${app.status} to ACCEPTED`);
        await prisma.application.update({
          where: { id: app.id },
          data: { status: 'ACCEPTED' }
        });
      }
    }
  }

  console.log("Fix completed successfully.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
