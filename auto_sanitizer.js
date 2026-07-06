require('dotenv').config(); 
const { PrismaClient } = require('@prisma/client'); 
const dbUrl = (process.env.DATABASE_URL || '').replace(':6543', ':5432').replace('pgbouncer=true&', '').replace('&pgbouncer=true', '');
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } }); 

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function sanitizeDatabase() {
  console.log('--- STARTING SILENT DATABASE SANITIZATION ---');
  
  // 1. Fix null speakerCodes for any active application in UK/US projects
  const activeProjects = ['cmr3u2h6q002ec4c0kypprpsi', 'cmr6qa8gw00041373hf7jmmiq'];
  
  const nullCodeApps = await prisma.application.findMany({
    where: { 
      projectId: { in: activeProjects },
      speakerCode: null,
      status: { notIn: ['REJECTED'] }
    }
  });

  for(const app of nullCodeApps) {
    const unassigned = await prisma.projectSentence.findFirst({
      where: { projectId: app.projectId, assignedUserId: null, speakerCode: { not: null } },
      orderBy: { speakerCode: 'asc' }
    });
    if(unassigned) {
      await prisma.application.update({ where: { id: app.id }, data: { speakerCode: unassigned.speakerCode } });
      await prisma.projectSentence.updateMany({ where: { projectId: app.projectId, speakerCode: unassigned.speakerCode }, data: { assignedUserId: app.userId } });
      console.log(`Auto-assigned ${unassigned.speakerCode} to app ${app.id}`);
    }
  }

  // 2. Ensure all ACCEPTED recordings have fileUrls. If empty, mark them NEED_RE_RECORD automatically
  const emptyAccepted = await prisma.voiceRecording.findMany({
    where: { 
      status: 'ACCEPTED', 
      OR: [{ fileUrl: null }, { fileUrl: '' }] 
    }
  });

  if(emptyAccepted.length > 0) {
    await prisma.voiceRecording.updateMany({
      where: { id: { in: emptyAccepted.map(r => r.id) } },
      data: { status: 'NEED_RE_RECORD', rejectionReason: 'حدث خطأ تقني في رفع الملف، يرجى إعادة تسجيل هذه الجملة.' }
    });
    console.log(`Auto-fixed ${emptyAccepted.length} ACCEPTED recs with missing audio`);
  }

  // 3. Ensure no recordings are pointing to wrong codes
  const allApps = await prisma.application.findMany({ 
    where: { projectId: { in: activeProjects }, speakerCode: { not: null } }
  });

  for(const app of allApps) {
    const wrongRecs = await prisma.voiceRecording.findMany({
      where: { userId: app.userId, sentence: { projectId: app.projectId, speakerCode: { not: app.speakerCode } } },
      include: { sentence: true }
    });

    if(wrongRecs.length > 0) {
      const correctSentences = await prisma.projectSentence.findMany({
        where: { projectId: app.projectId, speakerCode: app.speakerCode },
        orderBy: { order: 'asc' }
      });
      const oldSentences = await prisma.projectSentence.findMany({
        where: { projectId: app.projectId, speakerCode: wrongRecs[0].sentence.speakerCode },
        orderBy: { order: 'asc' }
      });

      for(const rec of wrongRecs) {
        const idx = oldSentences.findIndex(s => s.id === rec.sentenceId);
        if(idx !== -1 && correctSentences[idx]) {
          await prisma.voiceRecording.update({ where: { id: rec.id }, data: { sentenceId: correctSentences[idx].id } });
        }
      }
      console.log(`Auto-migrated ${wrongRecs.length} mismatched recs for user ${app.userId}`);
    }
  }

  console.log('--- SANITIZATION COMPLETE ---');
}

sanitizeDatabase().catch(e => console.error(e)).finally(() => process.exit(0));
