import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { cardInclude, toCardDto } from '@/lib/cards';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cards = await prisma.card.findMany({
    where: {
      userId: session.user.id,
    },
    include: cardInclude,
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    cards: cards.map(toCardDto),
  });
}