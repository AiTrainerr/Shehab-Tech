import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const sentences = await prisma.projectSentence.findMany({
      where: { projectId: 'cmrdvg2zw0001piril2jsy6fp' },
      select: { id: true, order: true }
    });
    
    let count = 0;
    const batchSize = 100;
    for (let i = 0; i < sentences.length; i += batchSize) {
      const batch = sentences.slice(i, i + batchSize);
      const updates = batch.map(s => prisma.projectSentence.update({
        where: { id: s.id },
        data: { audioId: 'N' + String(s.order).padStart(4, '0') }
      }));
      await prisma.$transaction(updates);
      count += batch.length;
    }
    
    return NextResponse.json({ success: true, message: `Updated ${count} sentences to N00xx format` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
