# Schema DB (PostgreSQL)

## Tables

### `User`
- `id` (cuid, PK)
- `email` (unique)
- `name` (nullable)
- `passwordHash`
- `createdAt`, `updatedAt`

### `Card`
- `id` (cuid, PK)
- `userId` (FK -> `User.id`)
- `title`
- `content` (TEXT)
- `version` (int, default 1)
- `createdAt`, `updatedAt`

### `Tag`
- `id` (cuid, PK)
- `label` (unique)
- `createdAt`

### `CardTag`
- `cardId` (FK -> `Card.id`)
- `tagId` (FK -> `Tag.id`)
- PK composite (`cardId`, `tagId`)

### `CardImage`
- `id` (cuid, PK)
- `cardId` (FK -> `Card.id`)
- `url` (string)
- `createdAt`

## Synchronisation multi-appareils

- Source of truth: PostgreSQL.
- Chaque carte appartient a un utilisateur authentifie.
- Les clients lisent/ecrivent via `/api/*` (Vercel functions).

## Resolution de conflits

Strategie active: **Last-Write-Wins (LWW)**.

- Lors d'un `PATCH`, la derniere ecriture valide ecrase l'etat precedent.
- `version` est incrementee a chaque mise a jour serveur.
- Pour l'import `merge`, si `incoming.updatedAt` est plus ancien que la version serveur, l'enregistrement est ignore.

## Images

- Stockage actuel: URL dans `CardImage.url`.
- Production recommandee: Vercel Blob / Supabase Storage / S3.
- Le schema est deja compatible avec ce mode (URLs publiques ou signees).