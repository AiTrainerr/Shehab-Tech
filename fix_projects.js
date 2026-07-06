const fs = require('fs');
let c = fs.readFileSync('src/app/actions/projects.ts', 'utf8');

const replacement = `if (newStatus === "ACCEPTED" && !speakerCode) {
      speakerCode = await prisma.$transaction(async (tx) => {
        // Lock the project row to serialize parallel approvals
        await tx.$executeRaw\`SELECT id FROM "Project" WHERE id = \${currentApp.projectId} FOR UPDATE\`;

        const batchSentences = await tx.projectSentence.findMany({
          where: { projectId: currentApp.projectId, speakerCode: { not: null } },
          select: { speakerCode: true },
          distinct: ['speakerCode']
        });

        if (batchSentences.length > 0) {
          const allBatchCodes = batchSentences.map(s => s.speakerCode);
          const assignedApps = await tx.application.findMany({
            where: {
              projectId: currentApp.projectId,
              speakerCode: { not: null }
            },
            select: { speakerCode: true }
          });

          const assignedSentences = await tx.projectSentence.findMany({
            where: {
              projectId: currentApp.projectId,
              assignedUserId: { not: null },
              speakerCode: { not: null }
            },
            select: { speakerCode: true }
          });

          const assignedCodes = [
            ...assignedApps.map(a => a.speakerCode),
            ...assignedSentences.map(s => s.speakerCode)
          ];

          const availableCode = allBatchCodes.find(code => !assignedCodes.includes(code));
          return availableCode || \`NO_CODE_AVAILABLE_TEMP_\${Date.now()}\`;
        } else {
          const lastApp = await tx.application.findFirst({
            where: {
              projectId: currentApp.projectId,
              speakerCode: { not: null }
            },
            orderBy: { speakerCode: 'desc' }
          });

          let nextNumber = 1;
          if (lastApp && lastApp.speakerCode) {
            const match = lastApp.speakerCode.match(/G(\\d+)/);
            if (match) {
              nextNumber = parseInt(match[1]) + 1;
            }
          }
          return \`G\${nextNumber.toString().padStart(4, '0')}\`;
        }
      });
    }

    const application = await prisma.application.update({`;

c = c.replace(/if \(newStatus === "ACCEPTED" && !speakerCode\) \{[\s\S]*?const application = await prisma\.application\.update\(\{/, replacement);
fs.writeFileSync('src/app/actions/projects.ts', c);
