import { GoogleGenAI, Type } from '@google/genai';
import { extractTagsFromContent, simpleFormat } from './text-format';

const MODEL = 'gemini-2.5-flash';
const EMOJI_REGEX = /\p{Extended_Pictographic}/gu;

const apiKey = process.env.GEMINI_API_KEY?.trim();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const isGeminiEnabled = (): boolean => Boolean(ai);

const ensureEmojiPreserved = (source: string, formatted: string): string => {
  const sourceEmojis = source.match(EMOJI_REGEX) ?? [];
  if (sourceEmojis.length === 0) {
    return formatted;
  }

  const formattedSet = new Set(formatted.match(EMOJI_REGEX) ?? []);
  const missing = Array.from(new Set(sourceEmojis)).filter((emoji) => !formattedSet.has(emoji));

  if (missing.length === 0) {
    return formatted;
  }

  return `${formatted}\n\n${missing.join(' ')}`;
};

export const assistFormatting = async (rawContent: string): Promise<{
  content: string;
  tags: string[];
  assisted: boolean;
  provider: 'gemini' | 'local';
}> => {
  const fallbackContent = simpleFormat(rawContent);
  const fallbackTags = extractTagsFromContent(fallbackContent);

  if (!ai) {
    return {
      content: fallbackContent,
      tags: fallbackTags,
      assisted: false,
      provider: 'local',
    };
  }

  const prompt = `Tu structures du contenu en Markdown de maniere claire et complete.

Contraintes:
1) Conserver toutes les informations utiles.
2) Utiliser titres, listes, tableaux si pertinent.
3) Retourner un JSON strict: {"content": string, "tags": string[]}.
4) 2 a 8 tags maximum, courts, en francais.
5) Preserver tous les emojis et symboles Unicode du texte source. Ne rien supprimer.

Texte source:
---
${rawContent}
---`;

  try {
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: {
              type: Type.STRING,
            },
            tags: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
            },
          },
          required: ['content', 'tags'],
        },
      },
    });

    const text = result.text?.trim();
    if (!text) {
      throw new Error('Empty Gemini response');
    }

    const parsed = JSON.parse(text) as { content?: string; tags?: string[] };
    const content =
      typeof parsed.content === 'string'
        ? ensureEmojiPreserved(rawContent, simpleFormat(parsed.content))
        : fallbackContent;
    const tags = Array.isArray(parsed.tags)
      ? Array.from(new Set(parsed.tags.map((tag) => tag.trim()).filter(Boolean))).slice(0, 8)
      : fallbackTags;

    return {
      content,
      tags: tags.length > 0 ? tags : fallbackTags,
      assisted: true,
      provider: 'gemini',
    };
  } catch (error) {
    console.error('Gemini assist failed, fallback to local formatter.', error);

    return {
      content: fallbackContent,
      tags: fallbackTags,
      assisted: false,
      provider: 'local',
    };
  }
};
