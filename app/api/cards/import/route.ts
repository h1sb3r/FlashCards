import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthSession } from '@/lib/auth';
import { cardInclude, replaceCardImages, replaceCardTags, toCardDto } from '@/lib/cards';
import { prisma } from '@/lib/prisma';

const cardSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(160),
  content: z.string().min(1),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  version: z.number().int().positive().optional(),
});

const importSchema = z.object({
  cards: z.array(cardSchema).max(500),
  strategy: z.enum(['merge', 'replace']).default('merge'),
});

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const parsed = importSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid import payload' }, { status: 400 });
    }

    const { cards, strategy } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      if (strategy === 'replace') {
        await tx.card.deleteMany({
          where: {
            userId: session.user.id,
          },
        });
      }

      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (const incoming of cards) {
        const existing = await tx.card.findFirst({
          where: {
            id: incoming.id,
            userId: session.user.id,
          },
        });

        if (!existing) {
          const created = await tx.card.create({
            data: {
              id: incoming.id,
              userId: session.user.id,
              title: incoming.title,
              content: incoming.content,
              version: incoming.version ?? 1,
              createdAt: incoming.createdAt ? new Date(incoming.createdAt) : undefined,
            },
          });

          await replaceCardTags(tx, created.id, incoming.tags);
          await replaceCardImages(tx, created.id, incoming.images);
          createdCount += 1;
          continue;
        }

        if (strategy === 'merge' && incoming.updatedAt) {
          const incomingUpdated = new Date(incoming.updatedAt);
          if (!Number.isNaN(incomingUpdated.getTime()) && existing.updatedAt > incomingUpdated) {
            skippedCount += 1;
            continue;
          }
        }

        const updated = await tx.card.update({
          where: {
            id: existing.id,
          },
          data: {
            title: incoming.title,
            content: incoming.content,
            version: Math.max(existing.version + 1, incoming.version ?? existing.version + 1),
          },
        });

        await replaceCardTags(tx, updated.id, incoming.tags);
        await replaceCardImages(tx, updated.id, incoming.images);
        updatedCount += 1;
      }

      const finalCards = await tx.card.findMany({
        where: {
          userId: session.user.id,
        },
        include: cardInclude,
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return {
        createdCount,
        updatedCount,
        skippedCount,
        cards: finalCards.map(toCardDto),
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Import failed.', error);
    return NextResponse.json({ error: 'Import failed.' }, { status: 500 });
  }
}