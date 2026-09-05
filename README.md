# marka

Monorepo da marka.ia.

## Estrutura

- `packages/ui` — design system (tokens, primitives)
- `packages/db` — Prisma schema, client e migrations (PostgreSQL)
- `packages/auth` — sessões, hashing de senha e RBAC (Business + Backoffice)
- `packages/shared` — erros, respostas HTTP, audit log, rate limit, payments/storage (interfaces)
- `apps/api` — backend (Next.js route handlers only, sem UI)
- `apps/consumer` — interface do cliente final (MVP)
- `apps/estabelecimento` — sistema operacional do estabelecimento (MVP)
- `apps/backoffice` — administração interna da marka.ia (MVP)

## Backend — desenvolvimento local

```bash
cp .env.example .env          # ajuste os valores conforme necessário
docker compose up -d          # Postgres local
pnpm --filter @marka/db exec prisma migrate dev
pnpm --filter @marka/db run seed   # cria o primeiro super_admin (Backoffice) + plano starter
pnpm --filter marka-api run dev    # http://localhost:4000
```

## Scripts

```bash
pnpm install
pnpm dev              # consumer
pnpm dev:est          # estabelecimento
```

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS + Lucide
- shadcn-inspired primitives (sem monólitos)
