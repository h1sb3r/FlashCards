import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthSession } from '@/lib/auth';
import { cardInclude, replaceCardImages, replaceCardTags, toCardDto } from '@/lib/cards';
import { prisma } from '@/lib/prisma';
import { cardPayloadSchema } from '@/lib/text-format';

const paramsSchema = z.object({
  id: z.string().min(1),
});

const patchSchema = cardPayloadSchema.extend({
  version: z.number().int().positive().optional(),
  updatedAt: z.string().datetime().optional(),
});

const ensureOwnership = async (cardId: string, userId: string) =>
  prisma.card.findFirst({
    where: {
      id: cardId,
      userId,
    },
    include: cardInclude,
  });

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = paramsSchema.parse(await context.params);
  const card = await ensureOwnership(params.id, session.user.id);

  if (!card) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  return NextResponse.json({ card: toCardDto(card) });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = paramsSchema.parse(await context.params);

  try {
    const payload = await request.json();
    const parsed = patchSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid card payload' }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.card.findFirst({
        where: {
          id: params.id,
          userId: session.user.id,
        },
      });

      if (!existing) {
        throw new Error('NOT_FOUND');
      }

      // Last-write-wins: latest incoming change overrides previous content.
      const next = await tx.card.update({
        where: {
          id: existing.id,
        },
        data: {
          title: parsed.data.title.trim(),
          content: parsed.data.content,
          version: existing.version + 1,
        },
      });

      await replaceCardTags(tx, next.id, parsed.data.tags);
      await replaceCardImages(tx, next.id, parsed.data.images);

      return tx.card.findUniqueOrThrow({
        where: {
          id: next.id,
        },
        include: cardInclude,
      });
    });

    return NextResponse.json({
      card: toCardDto(updated),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    console.error('Card update failed.', error);
    return NextResponse.json({ error: 'Card update failed.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = paramsSchema.parse(await context.params);

  const card = await ensureOwnership(params.id, session.user.id);
  if (!card) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  await prisma.card.delete({
    where: {
      id: card.id,
    },
  });

  return NextResponse.json({ ok: true });
}