# Sandra Sport

Webapp mobile-first sport-santé personnelle de Gaël.

- **V1** : consulter séances planifiées, saisir ressentis post-séance, saisir wellness matinal.
- **V1.5** : recettes + liste de courses, dashboard.
- **V2 (plus tard)** : commercialisation B2C (signup flow, billing, onboarding).

## Stack

Next.js 15 (App Router) + TypeScript strict + Tailwind + shadcn/ui + Supabase EU + Vercel.

Voir [`CLAUDE.md`](./CLAUDE.md) pour l'architecture détaillée, les conventions et les règles métier.

## Setup dev

### Prérequis

- Node.js ≥ 20
- Un compte Supabase avec un projet dédié `sandra_sport` (région EU)
- Un compte Vercel lié au repo GitHub

### Installation

```bash
git clone https://github.com/<user>/sandra_sport.git
cd sandra_sport
npm install
cp .env.example .env.local
# Éditer .env.local avec les clés Supabase
npm run dev
```

L'app est disponible sur [http://localhost:3000](http://localhost:3000).

### Commandes utiles

```bash
npm run dev            # Dev server
npm run build          # Production build
npm run start          # Servir build local
npm run lint           # ESLint
npm run test           # Vitest
npx tsc --noEmit       # Type check sans build
```

### Migrations Supabase

Les migrations SQL sont dans `supabase/migrations/`. Pour les appliquer :

```bash
# Via Supabase CLI (recommandé, à installer : npm i -g supabase)
supabase db push

# Ou à la main via le SQL Editor du dashboard Supabase
```

## Déploiement

Vercel connecté au repo GitHub. Chaque push sur `main` déclenche un déploiement prod.

URL prod : `https://sandra-sport.vercel.app` (par défaut, ajustable).

## Roadmap

Voir [`ROADMAP.md`](./ROADMAP.md).

## Licence

Propriétaire — Gaël Vibet. Usage commercial prévu à terme.
