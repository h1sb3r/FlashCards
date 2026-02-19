import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthSession } from '@/lib/auth';
import { assistFormatting, isGeminiEnabled } from '@/lib/gemini';

const assistSchema = z.object({
  content: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const parsed = assistSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const result = await assistFormatting(parsed.data.content);

    return NextResponse.json({
      ...result,
      geminiEnabled: isGeminiEnabled(),
    });
  } catch (error) {
    console.error('Assist formatting failed.', error);
    return NextResponse.json({ error: 'Assist formatting failed.' }, { status: 500 });
  }
}