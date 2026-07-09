import { prisma } from './src/lib/prisma'; async function run() { const res = await prisma.projectSentence.deleteMany({ where: { audioId: '??id' } }); console.log('Deleted:', res.count); } run();
