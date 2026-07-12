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
# puis renseigne AUTH_SECRET dans .env (openssl rand -base64 33)
docker compose up -d       # Postgres local
npx prisma migrate dev     # applique les migrations
npm run dev                # http://localhost:3000
```

Inscription/connexion : `/signup` et `/login` (email + mot de passe, ou lien magique par email — nécessite `SMTP_*` dans `.env`).

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

Self-host (Docker/Portainer) ou OVH — pas de Vercel.

`docker-compose.prod.yml` déploie toute la stack (Postgres + migrations + app) :

```bash
cp .env.example .env
# Renseigne POSTGRES_PASSWORD et AUTH_SECRET (openssl rand -base64 33) dans .env
docker compose -f docker-compose.prod.yml up -d --build
```

Ça lance 3 services dans l'ordre : `postgres` (avec healthcheck), `migrate` (job à usage unique qui applique les migrations Prisma puis s'arrête), puis `app` (démarre seulement une fois `migrate` terminé avec succès). L'app écoute sur le port `APP_PORT` (3000 par défaut) — mets un reverse proxy (nginx, Traefik, Caddy...) devant plutôt que de l'exposer directement.

**Sur Portainer** : importer `docker-compose.prod.yml` comme stack, définir les variables d'environnement (`POSTGRES_PASSWORD`, `AUTH_SECRET`, `APP_PORT`, `ADMIN_EMAILS`, `SMTP_*` pour le magic link) dans l'UI de la stack plutôt que dans un fichier `.env`.

Point d'attention : Auth.js v5 rejette par défaut les requêtes dont l'hôte n'est pas reconnu (protection anti host-header-injection, permissive sur Vercel mais pas ailleurs). `docker-compose.prod.yml` positionne déjà `AUTH_TRUST_HOST=true` pour l'app — nécessaire dès qu'on est derrière un reverse proxy ou un nom de domaine non prévu à l'avance.

Pour re-builder après un changement de code : `docker compose -f docker-compose.prod.yml up -d --build`.

## CI/CD

`.github/workflows/ci.yml` fait tourner 4 jobs en parallèle sur **toute PR, quelle que soit la branche cible** (utile pour les PR empilées entre branches de feature), et sur push vers `main`/`develop` : `lint`, `build`, `unit-tests` (avec un vrai Postgres de service), `e2e` (Playwright). `develop` et `main` doivent être configurées avec ces 4 checks comme obligatoires avant merge (GitHub → Settings → Branches — voir la note dans `CLAUDE.md` pour le détail).

Déploiement continu de `develop` : Portainer n'étant pas exposé sur Internet, on utilise le GitOps polling intégré à Portainer (la stack va chercher les nouveaux commits elle-même, pas de webhook entrant nécessaire) plutôt qu'un déclenchement depuis GitHub Actions. Voir `CLAUDE.md` pour la procédure de création de la stack.
