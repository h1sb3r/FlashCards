# FlashCards Cloud (README FR)

Application Next.js (App Router) avec synchronisation multi-appareils via PostgreSQL, authentification email/mot de passe et assistance Gemini optionnelle.

## Stack

- Next.js App Router + TypeScript strict
- Prisma + PostgreSQL (Neon / Supabase / Vercel Postgres)
- NextAuth (Credentials)
- API routes `/api/*` (serverless compatible Vercel)
- PWA basique (manifest + service worker)

## Fonctionnalites

- Authentification email + mot de passe
- CRUD cartes (titre, contenu markdown, tags, images URL)
- Recherche plein texte + filtre par tags
- Import / export JSON
- Synchronisation multi-appareils via base distante
- Assistance de formatage Gemini (optionnelle)
  - fallback local automatique si `GEMINI_API_KEY` absent/invalide

## 1) Installation locale

### Prerequis
- Node.js 20+
- PostgreSQL accessible (local ou cloud)

### Variables d'environnement
Copier `.env.example` vers `.env.local` et remplir:

```env
DATABASE_URL="..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
GEMINI_API_KEY="..." # optionnel
```

### Setup

```bash
npm install
npm run db:generate
npm run db:push
npm run dev
```

## 2) Scripts PowerShell

Depuis le repo:

- `scripts/run-dev.ps1` : install + lancement dev
- `scripts/git-pull.ps1 -Branch rewrite`
- `scripts/git-push.ps1 -Branch rewrite -Message "feat: ..."`
- `scripts/merge-rewrite-main.ps1`

## 3) GitHub (rewrite -> main)

```bash
git checkout rewrite
git add .
git commit -m "feat: rewrite Next.js + Prisma + Auth + API"
git push -u origin rewrite
```

Ensuite:

```bash
git checkout main
git pull origin main
git merge --no-ff rewrite -m "merge: rewrite"
git push origin main
```

## 4) Deploiement Vercel

1. Importer le repo GitHub dans Vercel.
2. Ajouter les variables d'env dans Vercel:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (URL prod)
   - `GEMINI_API_KEY` (optionnel)
3. Lancer deploy.
4. Executer schema DB:
   - localement sur la meme DB: `npm run db:push`
   - ou via pipeline CI selon votre workflow.

## 5) Multi-appareils

- Les cartes sont stockees en DB, pas en localStorage.
- Toute connexion avec le meme compte recupere les memes cartes.
- Compatible PC + navigateurs mobiles.

## 6) Gemini

- Route serveur: `POST /api/assist/format`
- Si la cle est absente, l'app renvoie un resultat local (`provider: local`).
- Si la cle est valide, Gemini structure le contenu (`provider: gemini`).

## 7) Notes production

- Images: aujourd'hui par URLs externes.
- Pour upload natif, brancher Vercel Blob / S3 / Supabase Storage et stocker les URLs dans `CardImage`.
- Strategie de conflit documentee dans `docs/SCHEMA.md` (LWW).