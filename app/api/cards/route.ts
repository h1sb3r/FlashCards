import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthSession } from '@/lib/auth';
import { cardInclude, getAvailableTags, replaceCardImages, replaceCardTags, toCardDto } from '@/lib/cards';
import { prisma } from '@/lib/prisma';
import { cardPayloadSchema } from '@/lib/text-format';

const listQuerySchema = z.object({
  q: z.string().optional(),
  tags: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsedQuery = listQuerySchema.parse({
    q: url.searchParams.get('q') ?? undefined,
    tags: url.searchParams.get('tags') ?? undefined,
  });

  const search = parsedQuery.q?.trim();
  const selectedTags = parsedQuery.tags
    ? parsedQuery.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  const cards = await prisma.card.findMany({
    where: {
      userId: session.user.id,
      ...(search
        ? {
            OR: [
              {
                title: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                content: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                tags: {
                  some: {
                    tag: {
                      label: {
                        contains: search,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
              },
            ],
          }
        : {}),
      ...(selectedTags.length > 0
        ? {
            AND: selectedTags.map((label) => ({
              tags: {
                some: {
                  tag: {
                    label,
                  },
                },
              },
            })),
          }
        : {}),
    },
    include: cardInclude,
    orderBy: {
      updatedAt: 'desc',
    },
  });

  const availableTags = await getAvailableTags(prisma, session.user.id);

  return NextResponse.json({
    cards: cards.map(toCardDto),
    availableTags,
  });
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const parsed = cardPayloadSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid card payload' }, { status: 400 });
    }

    const card = await prisma.$transaction(async (tx) => {
      const created = await tx.card.create({
        data: {
          userId: session.user.id,
          title: parsed.data.title.trim(),
          content: parsed.data.content,
        },
      });

      await replaceCardTags(tx, created.id, parsed.data.tags);
      await replaceCardImages(tx, created.id, parsed.data.images);

      return tx.card.findUniqueOrThrow({
        where: {
          id: created.id,
        },
        include: cardInclude,
      });
    });

    return NextResponse.json({
      card: toCardDto(card),
    });
  } catch (error) {
    console.error('Card creation failed.', error);
    return NextResponse.json({ error: 'Card creation failed.' }, { status: 500 });
  }
}