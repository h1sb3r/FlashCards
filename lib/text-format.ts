import { z } from 'zod';

const STOP_WORDS = new Set([
  'avec',
  'dans',
  'pour',
  'plus',
  'sans',
  'this',
  'that',
  'with',
  'from',
  'your',
  'about',
  'comme',
  'mais',
  'donc',
  'car',
]);

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const clean = (value: string): string =>
  value
    .replace(/\r\n?/g, '\n')
    .replace(/[\t ]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export const normalizeTags = (tags: string[]): string[] =>
  Array.from(
    new Set(
      tags
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => tag.slice(0, 40)),
    ),
  ).slice(0, 12);

export const normalizeImages = (images: string[]): string[] =>
  Array.from(
    new Set(
      images
        .map((url) => url.trim())
        .filter(Boolean)
        .filter((url) => /^https?:\/\//i.test(url)),
    ),
  ).slice(0, 12);

export const extractTagsFromContent = (content: string): string[] => {
  const tokens = clean(content)
    .replace(/[.,;:!?()[\]{}<>|/\\]/g, ' ')
    .split(/\s+/)
    .map((token) => normalize(token))
    .filter((token) => token.length >= 4 && token.length <= 24)
    .filter((token) => /^[a-z0-9-]+$/.test(token))
    .filter((token) => !STOP_WORDS.has(token));

  const scores = new Map<string, number>();
  for (const token of tokens) {
    scores.set(token, (scores.get(token) ?? 0) + 1);
  }

  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr'))
    .map(([token]) => token)
    .slice(0, 6);
};

export const simpleFormat = (content: string): string => clean(content);

export const cardPayloadSchema = z.object({
  title: z.string().min(1).max(160),
  content: z.string().min(1),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
});