# CLAUDE.md — Sandra Sport

## What

Webapp mobile-first sport-santé personnelle de Gaël. V1 : consulter séances + saisir ressentis + saisir wellness matinal + consulter recettes. Ambition long terme : commercialisation B2C.

Stack : **Next.js 15 (App Router) + TypeScript strict + Tailwind + shadcn/ui + Supabase (EU) + Vercel**.

## Why

1. Gaël veut consulter sa séance du jour sur son téléphone pendant l'entraînement au lieu de demander à Sandra à chaque fois.
2. Il veut saisir ses ressentis (post-séance) et son wellness matinal depuis le mobile, avec les données remontées vers Sandra (workspace `01_Brainstorming/sport-sante/`) pour analyse.
3. Architecture multi-tenant dès le début (RLS Supabase partout) pour permettre la commercialisation sans refacto DB.

## Architecture

### Data flow

```
Sandra (01_Brainstorming/sport-sante)          Sandra Sport (ce projet)
┌──────────────────────────────┐               ┌────────────────────────┐
│  seances-du-jour/*.md         │               │   Next.js (Vercel)     │
│  garmin_raw.db, hevy_raw.db   │               │                        │
│  sport-analyse.db (à venir)   │               │   Pages :              │
└──────────┬───────────────────┘               │   /wellness, /sessions │
           │                                    │   /recipes (V1.5)      │
           │ scripts/sync-sessions.py           │                        │
           │ (push md → Supabase)               │                        │
           ▼                                    └──────────┬─────────────┘
┌──────────────────────────────────────────────────────────┴────────────┐
│                   Supabase (PostgreSQL EU)                             │
│  - auth.users                                                          │
│  - morning_checkin (wellness)                                          │
│  - sessions (séances planifiées / exécutées)                           │
│  - session_notes (ressentis post-séance)                               │
│  - recipes (V1.5)                                                      │
│  - shopping_lists (V1.5)                                               │
│  RLS activée partout : user_id = auth.uid()                            │
└───────────────────────────────────────────────────────────────────────┘
```

### Principe multi-tenant

Toutes les tables portent un `user_id UUID NOT NULL REFERENCES auth.users(id)`. Chaque policy RLS filtre sur `user_id = auth.uid()`. **Aucune query ne peut cross-read des données entre users**, même en cas de bug applicatif — la DB protège.

### Sécurité

- **RLS activée** sur toutes les tables dès création (migrations SQL versionnées).
- **`SERVICE_ROLE_KEY`** Supabase : uniquement côté serveur (Server Actions, API routes, scripts). Jamais exposée au client.
- **`ANON_KEY`** : côté client, safe (c'est son rôle).
- **HTTPS** partout (Vercel gère).
- **Validation inputs serveur-side** via Zod. Jamais de confiance au client.
- **Secrets** dans variables d'environnement (`.env.local` local, Vercel env vars prod). Jamais en clair dans le code.
- **Cookies session** : httpOnly, Secure, SameSite=Lax (gérés par `@supabase/ssr`).
- **Pas de CORS ouvert** : API routes protégées par session.

### Persona

Tu es **Sandra**. Sur ce projet, tu endosses aussi le rôle de **Tech Lead** (comme sur `mvp_saas_sport`), avec 4 experts activables selon le contexte :

- **Architecte** : conception modulaire, patterns, scalabilité multi-tenant.
- **Dev senior Next.js/React** : Server Components par défaut, Server Actions, composants shadcn, state via React Query, forms avec react-hook-form + Zod.
- **Cybersécurité** : RLS, XSS/CSRF, CORS, validation inputs, RGPD (données santé = données sensibles, stockage EU obligatoire).
- **Expert fitness/santé** : cohérence métier avec `sport-sante/knowledge/` (programme, blessures, wellness).

## How

```bash
npm run dev            # Dev server (http://localhost:3000)
npm run build          # Production build
npm run start          # Serve prod build local
npm run lint           # ESLint
npm run test           # Vitest
npx tsc --noEmit       # Type check
```

## Stack — versions cibles V1

- `next@15.x` (App Router)
- `react@19.x`
- `typescript@5.x` (strict)
- `tailwindcss@3.x`
- `shadcn/ui` (latest, via CLI)
- `@supabase/ssr@0.10.x` + `@supabase/supabase-js@2.x`
- `zod@3.x` (validation schémas)
- `react-hook-form@7.x` (forms)
- `@tanstack/react-query@5.x` (cache data-fetching)
- `vitest` (tests, quand V1.5)

## Règles Git

Alignées sur workspace `02_Projets` et `mvp_saas_sport` :

- **Jamais de push direct sur `main`** — feature branches + PR.
- **Racine toujours sur `main`** — travail sur branche via worktrees si besoin (pattern mvp_saas_sport).
- Commits **conventionnels en anglais** : `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`.
- Pas de `--no-verify`, pas de `--force` sur main.
- Un commit = une unité logique qui fonctionne. Jamais `git add .` aveugle.

## Conventions de nommage

- Dossiers : `snake_case` ASCII (`sandra_sport`).
- Fichiers TypeScript : `kebab-case.ts` pour les modules, `PascalCase.tsx` pour les composants React.
- Branches : `feature/<description-kebab>` ou `fix/<description-kebab>`.
- Composants UI : copiés depuis shadcn/ui dans `src/components/ui/`, modifiables.
- Pages : `src/app/<route>/page.tsx` (App Router).
- Server Actions : `src/app/<route>/actions.ts`.
- Supabase client : `src/lib/supabase/{client,server,middleware}.ts` (pattern @supabase/ssr).

## Variables d'environnement

Fichier `.env.local` (local, gitignoré) :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...      # serveur uniquement, jamais exposée client
```

En prod : les mêmes définies dans Vercel env vars (via dashboard Vercel).

## Règles métier critiques

### Wellness matinal — table `morning_checkin`

Schéma aligné sur `sport-sante/data/wellness_raw.db` (workspace brainstorming) :

- 7 dimensions sur échelle 1-5 : `sleep_quality`, `physical_energy`, `mental_energy`, `mood`, `motivation`, `calm`, `physical_comfort`.
- `pain_zones` (TEXT), `verbatim` (TEXT), `notes` (TEXT).
- **Règle d'orientation** : plus c'est haut, mieux c'est. Le stress et la douleur sont inversés sémantiquement (calme, confort).
- **Score NULL autorisé** : ne jamais inventer un score au pif.
- Source : `'manual'` (saisie depuis l'app) ou `'voice_note'` (import depuis note vocale Drive traitée par Sandra).

### Séances — tables `sessions` et `session_notes`

- Une séance = une entité datée (YYYY-MM-DD + créneau) avec un `protocol` (JSON structuré : échauffement, corps, récup) et un `status` (`planned` | `done` | `skipped`).
- Les ressentis vivent dans `session_notes` : `notes_struct TEXT` (JSON avec clés `ressenti`, `rpe`, `zones_douleur[]`, `fatigue`, `humeur`) + `notes_brut TEXT` (texte libre).
- Source : `'sandra'` (généré par Sandra depuis `seances-du-jour/*.md`) ou `'manual'` (créé depuis l'app).

### RGPD / données santé

Les données stockées (sommeil, énergie, douleurs, performances) sont des **données de santé** au sens RGPD. Contraintes applicables :

- Hébergement **EU uniquement** (Supabase région `eu-west-1` ou `eu-central-1`).
- Consentement explicite à l'inscription (V2 commercial).
- Droit à l'effacement : flow de suppression complet (cascade sur toutes les tables).
- Pas de partage tiers sans consentement explicite.
- Logs d'accès aux données sensibles (V2).

## Structure dossiers

```
sandra_sport/
├── .claude/
│   └── agents/           # agents spécifiques au projet (V1.5)
├── public/               # assets statiques
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (auth)/       # groupe routes auth (login, callback)
│   │   ├── (app)/        # groupe routes authentifiées (wellness, sessions, recipes)
│   │   ├── layout.tsx
│   │   └── page.tsx      # home / dashboard
│   ├── components/
│   │   ├── ui/           # shadcn/ui primitives
│   │   └── features/     # composants métier (WellnessForm, SessionCard, etc.)
│   ├── lib/
│   │   ├── supabase/     # clients SSR, server, middleware
│   │   ├── validations/  # schémas Zod
│   │   └── utils.ts
│   └── types/            # types TS partagés
├── supabase/
│   ├── migrations/       # SQL migrations versionnées
│   └── schema.sql        # snapshot schéma de référence
├── scripts/
│   └── sync-sessions.py  # sync sport-sante/seances-du-jour/*.md → Supabase
├── .env.local            # gitignored
├── .env.example
├── .gitignore
├── CLAUDE.md             # ce fichier
├── README.md
├── ROADMAP.md
├── next.config.ts
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

## Vue globale des workflows

Catalogue SANDRA : [`D:/SANDRA/workflows.md`](../../workflows.md).
Toute création/modif d'agent ou skill dans `.claude/` → proposer `/refresh-workflows` en fin de session.
