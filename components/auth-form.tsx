'use client';

import { FormEvent, useMemo, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type Mode = 'login' | 'register';

export function AuthForm() {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const modeLabel = useMemo(
    () => (mode === 'login' ? 'Connexion' : 'Inscription'),
    [mode],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'register') {
        const registerResponse = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        });

        if (!registerResponse.ok) {
          const payload = (await registerResponse.json()) as { error?: string };
          throw new Error(payload.error ?? 'Impossible de creer le compte.');
        }
      }

      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (!result || result.error) {
        throw new Error('Identifiants invalides.');
      }

      router.push('/');
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Une erreur est survenue.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-zinc-900">FlashCards</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Synchronisez vos cartes sur PC et mobile.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {mode === 'register' && (
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-700">Nom</span>
            <input
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
            />
          </label>
        )}

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">Email</span>
          <input
            type="email"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">Mot de passe</span>
          <input
            type="password"
            required
            minLength={6}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </label>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Chargement...' : modeLabel}
        </button>
      </form>

      <button
        type="button"
        className="mt-4 w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100"
        onClick={() => {
          setError(null);
          setMode((current) => (current === 'login' ? 'register' : 'login'));
        }}
      >
        {mode === 'login'
          ? 'Creer un compte'
          : 'J\'ai deja un compte'}
      </button>
    </div>
  );
}