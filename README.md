# The Achievement App

Application web mobile-first pour logger les choses faites dans la journée, avec un feedback toujours positif (jamais de tracker punitif, jamais de "streak" qui casse).

Voir [instructions.txt](./instructions.txt) pour les specs d'origine

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- PostgreSQL via Prisma
- Auth.js (email/mot de passe, puis magic link)
- Vitest + Testing Library (unit/composants), Playwright (e2e)
- Domain-Driven Design : `src/domain`, `src/application`, `src/infrastructure`

## Développement

```bash
npm install
cp .env.example .env       # DATABASE_URL + POSTGRES_PORT locaux
docker compose up -d       # Postgres local
npx prisma migrate dev     # applique les migrations
npm run dev                # http://localhost:3000
```

Par défaut, Postgres écoute sur le port standard **5432**. Si ce port est déjà pris sur ta machine, change `POSTGRES_PORT` dans `.env` (et le port dans `DATABASE_URL` en conséquence), puis relance `docker compose up -d`.

Autres commandes utiles :

```bash
npm run test       # Vitest en mode watch
npm run test:run   # Vitest une fois
npm run test:e2e   # Playwright
npm run lint
npm run build
```

## Déploiement

Self-host (Docker/Portainer) ou OVH — pas de Vercel. Voir le `Dockerfile` (multi-stage, sortie `standalone`) et `docker-compose.yml`.
