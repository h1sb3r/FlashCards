'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CardEditor } from '@/components/card-editor';
import type { AssistResponse, CardDto, CardPayload, CardsResponse, ImportPayload } from '@/types';

const emptyDraft: CardPayload = {
  title: '',
  content: '',
  tags: [],
  images: [],
};

type DashboardProps = {
  user: {
    name: string;
    email: string;
  };
};

const toPayload = (card: CardDto): CardPayload => ({
  title: card.title,
  content: card.content,
  tags: card.tags,
  images: card.images,
});

export function Dashboard({ user }: DashboardProps) {
  const [cards, setCards] = useState<CardDto[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CardPayload>(emptyDraft);
  const [status, setStatus] = useState<string>('');
  const [loadingCards, setLoadingCards] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assisting, setAssisting] = useState(false);

  const importInputRef = useRef<HTMLInputElement>(null);

  const activeCard = useMemo(
    () => cards.find((card) => card.id === activeCardId) ?? null,
    [cards, activeCardId],
  );

  const loadCards = useCallback(async () => {
    setLoadingCards(true);

    try {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set('q', search.trim());
      }
      if (selectedTags.length > 0) {
        params.set('tags', selectedTags.join(','));
      }

      const response = await fetch(`/api/cards?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to load cards.');
      }

      const payload = (await response.json()) as CardsResponse;
      setCards(payload.cards);
      setAvailableTags(payload.availableTags);

      setActiveCardId((current) => {
        if (!current || !payload.cards.some((card) => card.id === current)) {
          if (payload.cards.length === 0) {
            setDraft(emptyDraft);
            return null;
          }

          setDraft(toPayload(payload.cards[0]));
          return payload.cards[0].id;
        }

        return current;
      });
    } catch (error) {
      console.error(error);
      setStatus('Erreur lors du chargement des cartes.');
    } finally {
      setLoadingCards(false);
    }
  }, [search, selectedTags]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadCards();
    }, 180);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [loadCards]);

  useEffect(() => {
    if (!activeCard) {
      return;
    }

    setDraft(toPayload(activeCard));
  }, [activeCard]);

  const saveCard = async () => {
    setSaving(true);
    setStatus('');

    try {
      const endpoint = activeCardId ? `/api/cards/${activeCardId}` : '/api/cards';
      const method = activeCardId ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? 'Save failed');
      }

      const payload = (await response.json()) as { card: CardDto };
      setStatus('Carte enregistree.');
      setActiveCardId(payload.card.id);
      await loadCards();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Erreur pendant la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const deleteCard = async () => {
    if (!activeCardId) {
      return;
    }

    const confirmed = window.confirm('Supprimer cette carte ?');
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setStatus('');

    try {
      const response = await fetch(`/api/cards/${activeCardId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Suppression impossible.');
      }

      setStatus('Carte supprimee.');
      setActiveCardId(null);
      setDraft(emptyDraft);
      await loadCards();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Erreur pendant la suppression.');
    } finally {
      setSaving(false);
    }
  };

  const assistDraft = async () => {
    if (!draft.content.trim()) {
      setStatus('Ajoutez du contenu avant d\'utiliser l\'assistant.');
      return;
    }

    setAssisting(true);
    setStatus('');

    try {
      const response = await fetch('/api/assist/format', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: draft.content,
        }),
      });

      if (!response.ok) {
        throw new Error('Assistant indisponible.');
      }

      const payload = (await response.json()) as AssistResponse;

      setDraft((current) => ({
        ...current,
        content: payload.content,
        tags: payload.tags.length > 0 ? payload.tags : current.tags,
      }));

      setStatus(
        payload.assisted
          ? 'Contenu reformate avec Gemini.'
          : 'Mode degrade actif (formatage local).',
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Assistant indisponible.');
    } finally {
      setAssisting(false);
    }
  };

  const exportJson = async () => {
    setStatus('');

    try {
      const response = await fetch('/api/cards/export', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Export impossible.');
      }

      const payload = await response.json();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `flashcards-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      setStatus('Export termine.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Export impossible.');
    }
  };

  const onImportFile = async (file: File) => {
    setStatus('');

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { cards?: CardDto[] } | CardDto[];
      const cardsPayload = Array.isArray(parsed) ? parsed : parsed.cards;

      if (!Array.isArray(cardsPayload)) {
        throw new Error('Fichier JSON invalide.');
      }

      const payload: ImportPayload = {
        cards: cardsPayload,
        strategy: 'merge',
      };

      const response = await fetch('/api/cards/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Import impossible.');
      }

      await loadCards();
      setStatus('Import termine.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Import impossible.');
    } finally {
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
    }
  };

  return (
    <main className="min-h-screen bg-zinc-100 p-3 md:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <header className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-zinc-900 md:text-2xl">FlashCards Cloud</h1>
              <p className="text-sm text-zinc-600">
                Connecte: {user.name} ({user.email})
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveCardId(null);
                  setDraft(emptyDraft);
                }}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                Nouvelle carte
              </button>
              <button
                type="button"
                onClick={() => void exportJson()}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                Export JSON
              </button>
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                Import JSON
              </button>
              <button
                type="button"
                onClick={() => void signOut({ callbackUrl: '/login' })}
                className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Deconnexion
              </button>
            </div>
          </div>

          <input
            ref={importInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void onImportFile(file);
              }
            }}
          />

          {status && (
            <p className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              {status}
            </p>
          )}
        </header>

        <div className="grid min-h-[72vh] gap-4 lg:grid-cols-[320px_1fr_1fr]">
          <aside className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Recherche
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
                placeholder="Titre, contenu, tag..."
              />
            </label>

            <div className="mb-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-600">Tags</p>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const selected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setSelectedTags((current) =>
                          current.includes(tag)
                            ? current.filter((entry) => entry !== tag)
                            : [...current, tag],
                        )
                      }
                      className={`rounded-full border px-2 py-1 text-xs transition ${
                        selected
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loadingCards ? (
                <p className="text-sm text-zinc-500">Chargement...</p>
              ) : cards.length === 0 ? (
                <p className="text-sm text-zinc-500">Aucune carte.</p>
              ) : (
                <ul className="space-y-2">
                  {cards.map((card) => (
                    <li key={card.id}>
                      <button
                        type="button"
                        onClick={() => setActiveCardId(card.id)}
                        className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                          card.id === activeCardId
                            ? 'border-zinc-900 bg-zinc-900 text-white'
                            : 'border-zinc-200 hover:bg-zinc-100'
                        }`}
                      >
                        <p className="truncate text-sm font-semibold">{card.title}</p>
                        <p className="mt-1 text-xs opacity-80">
                          {new Date(card.updatedAt).toLocaleDateString('fr-FR')}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          <CardEditor
            draft={draft}
            activeCard={activeCard}
            isSaving={saving}
            isAssisting={assisting}
            onDraftChange={setDraft}
            onSave={saveCard}
            onDelete={deleteCard}
            onAssist={assistDraft}
            onReset={() => {
              if (activeCard) {
                setDraft(toPayload(activeCard));
                return;
              }
              setDraft(emptyDraft);
            }}
          />

          <section className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:p-5">
            <h2 className="text-lg font-semibold text-zinc-900">Apercu</h2>
            <article className="prose prose-zinc mt-4 min-h-0 flex-1 overflow-y-auto pr-2">
              {draft.content.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft.content}</ReactMarkdown>
              ) : (
                <p className="text-sm text-zinc-500">Le rendu Markdown apparaitra ici.</p>
              )}
            </article>

            {draft.images.length > 0 && (
              <div className="mt-4 border-t border-zinc-200 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-600">Images</p>
                <div className="grid grid-cols-2 gap-2">
                  {draft.images.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-lg border border-zinc-200"
                    >
                      <Image
                        src={url}
                        alt="Card"
                        width={480}
                        height={180}
                        unoptimized
                        className="h-24 w-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
