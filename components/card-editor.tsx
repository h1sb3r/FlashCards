'use client';

import { useMemo } from 'react';
import type { CardDto, CardPayload } from '@/types';

type CardEditorProps = {
  draft: CardPayload;
  activeCard: CardDto | null;
  isSaving: boolean;
  isAssisting: boolean;
  onDraftChange: (next: CardPayload) => void;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
  onAssist: () => Promise<void>;
  onReset: () => void;
};

export function CardEditor({
  draft,
  activeCard,
  isSaving,
  isAssisting,
  onDraftChange,
  onSave,
  onDelete,
  onAssist,
  onReset,
}: CardEditorProps) {
  const tagsText = useMemo(() => draft.tags.join(', '), [draft.tags]);
  const imagesText = useMemo(() => draft.images.join('\n'), [draft.images]);

  return (
    <section className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:p-5">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">
            {activeCard ? 'Modifier la carte' : 'Nouvelle carte'}
          </h2>
          {activeCard && (
            <p className="text-xs text-zinc-500">
              Maj: {new Date(activeCard.updatedAt).toLocaleString('fr-FR')}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void onAssist()}
            disabled={isAssisting || isSaving || !draft.content.trim()}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAssisting ? 'Assistant...' : 'Assistant Gemini'}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
          >
            Reinitialiser
          </button>
          {activeCard && (
            <button
              type="button"
              onClick={() => void onDelete()}
              disabled={isSaving}
              className="rounded-lg border border-red-300 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Supprimer
            </button>
          )}
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={isSaving || !draft.title.trim() || !draft.content.trim()}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </header>

      <div className="mt-4 grid flex-1 gap-4 overflow-y-auto pr-1">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Titre
          </span>
          <input
            value={draft.title}
            onChange={(event) =>
              onDraftChange({
                ...draft,
                title: event.target.value,
              })
            }
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
            placeholder="Titre de la carte"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Tags (separes par des virgules)
          </span>
          <input
            value={tagsText}
            onChange={(event) =>
              onDraftChange({
                ...draft,
                tags: event.target.value
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              })
            }
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
            placeholder="nextjs, vercel, postgres"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">
            URLs images (une par ligne)
          </span>
          <textarea
            value={imagesText}
            onChange={(event) =>
              onDraftChange({
                ...draft,
                images: event.target.value
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean),
              })
            }
            className="h-24 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
            placeholder="https://..."
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Contenu Markdown
          </span>
          <textarea
            value={draft.content}
            onChange={(event) =>
              onDraftChange({
                ...draft,
                content: event.target.value,
              })
            }
            className="h-72 w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm outline-none transition focus:border-zinc-500"
            placeholder="Collez votre contenu ici..."
          />
        </label>
      </div>
    </section>
  );
}