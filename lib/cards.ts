import type { Prisma, PrismaClient } from '@prisma/client';
import type { CardDto } from '@/types';
import { normalizeImages, normalizeTags } from './text-format';

type Tx = Prisma.TransactionClient | PrismaClient;

type CardWithRelations = Prisma.CardGetPayload<{
  include: {
    tags: {
      include: {
        tag: true;
      };
    };
    images: true;
  };
}>;

export const cardInclude = {
  tags: {
    include: {
      tag: true,
    },
  },
  images: true,
} as const;

export const toCardDto = (card: CardWithRelations): CardDto => ({
  id: card.id,
  title: card.title,
  content: card.content,
  tags: card.tags.map((entry) => entry.tag.label).sort((a, b) => a.localeCompare(b, 'fr')),
  images: card.images.map((image) => image.url),
  createdAt: card.createdAt.toISOString(),
  updatedAt: card.updatedAt.toISOString(),
  version: card.version,
});

export const replaceCardTags = async (tx: Tx, cardId: string, tags: string[]): Promise<void> => {
  const normalizedTags = normalizeTags(tags);

  await tx.cardTag.deleteMany({
    where: {
      cardId,
    },
  });

  for (const label of normalizedTags) {
    const tag = await tx.tag.upsert({
      where: {
        label,
      },
      create: {
        label,
      },
      update: {},
    });

    await tx.cardTag.create({
      data: {
        cardId,
        tagId: tag.id,
      },
    });
  }
};

export const replaceCardImages = async (tx: Tx, cardId: string, images: string[]): Promise<void> => {
  const normalizedImages = normalizeImages(images);

  await tx.cardImage.deleteMany({
    where: {
      cardId,
    },
  });

  if (normalizedImages.length === 0) {
    return;
  }

  await tx.cardImage.createMany({
    data: normalizedImages.map((url) => ({
      cardId,
      url,
    })),
  });
};

export const getAvailableTags = async (tx: Tx, userId: string): Promise<string[]> => {
  const tags = await tx.tag.findMany({
    where: {
      cards: {
        some: {
          card: {
            userId,
          },
        },
      },
    },
    select: {
      label: true,
    },
    orderBy: {
      label: 'asc',
    },
  });

  return tags.map((tag) => tag.label);
};