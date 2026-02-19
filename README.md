# FlashCards Cloud

Modern rewrite of FlashCards for multi-device sync (PC + mobile), built for Vercel.

- Next.js App Router + TypeScript strict
- PostgreSQL + Prisma
- Email/password authentication (NextAuth Credentials)
- Serverless API routes (`/api/*`)
- Optional Gemini assist (`GEMINI_API_KEY`)
- PWA basics (manifest + service worker)

## Quick Start

```bash
npm install
npm run db:generate
npm run db:push
npm run dev
```

Create `.env.local` from `.env.example` before running.

## Documentation

- French setup + deploy guide: `README_FR.md`
- Database schema + sync strategy: `docs/SCHEMA.md`
