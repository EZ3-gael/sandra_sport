# Sandra Sport — Roadmap

## V1 — MVP fonctionnel (objectif : ce soir / demain)

### Milestones

- [ ] **M1 — Setup** : create-next-app, deps installées, Supabase projet lié, premier `hello world` déployé sur Vercel.
- [ ] **M2 — Schema DB** : migrations SQL `001_init.sql` créée (tables `morning_checkin`, `sessions`, `session_notes`) avec RLS policies.
- [ ] **M3 — Auth** : magic link via Supabase, pages `/login` + `/auth/callback`, middleware protège les routes authentifiées.
- [ ] **M4 — Page Wellness** (`/wellness`) : form 7 dimensions, Server Action de save, vue historique 7 derniers jours.
- [ ] **M5 — Page Séances** (`/sessions`) : liste chrono, détail séance, form ressenti post-séance.
- [ ] **M6 — Script sync** : `scripts/sync-sessions.py` lit `sport-sante/seances-du-jour/*.md` → upsert `sessions` Supabase.
- [ ] **M7 — Deploy prod** : push `main`, vérif env vars Vercel, test end-to-end sur mobile.

### Découpage horaire (23-24/04/2026)

| Jour | Créneau | Tâche |
|---|---|---|
| Jeudi 23 matin | 10h30-12h30 | M1 Setup + M2 Schema |
| Jeudi 23 après-midi | 14h30-16h | Séance sport (pause projet) |
| Jeudi 23 soir | 16h30-22h | M3 Auth + M4 Wellness + M5 Séances |
| Vendredi 24 matin | — | M6 Sync + M7 Deploy + tests |

## V1.5 — Consolidation (1-2 semaines après V1)

- [ ] Dashboard home `/` : vue rapide du jour (wellness fait ? séance prévue ? dernier ressenti ?)
- [ ] Toggle dark/light (dark par défaut).
- [ ] Feature Recettes (`/recipes`) : catalogue + filtres + détail.
- [ ] Feature Courses (`/shopping`) : sélection recettes → agrégation ingrédients → export PDF.
- [ ] Sentry monitoring + alertes.
- [ ] Tests critiques Vitest (auth flow, RLS policies, form validations).
- [ ] PWA manifest (installable sur écran d'accueil Android).

## V2 — Commercialisation (date ouverte)

- [ ] Landing page marketing.
- [ ] Signup flow multi-user (test RLS en charge).
- [ ] Onboarding (wizard initial : programme d'entraînement, objectifs, blessures).
- [ ] Stripe billing (freemium : wellness gratuit, séances + analytics premium).
- [ ] Intégration API officielle Garmin (Developer Program) pour import données brutes.
- [ ] Intégration Hevy API (pour import muscu).
- [ ] Export données RGPD (droit à la portabilité).
- [ ] Flow suppression compte (cascade).
- [ ] CGU / Politique de confidentialité.
- [ ] Analytics produit (PostHog ou équivalent).

## Décisions architecturales figées

- **Multi-tenant dès V1** : toutes les tables portent `user_id`, RLS activée. Pas de "single-user hack" à refacto plus tard.
- **Magic link auth only** en V1 : pas de password. OAuth (Google/Apple) possible en V2.
- **Données santé EU** : Supabase région EU obligatoire (RGPD).
- **Sandra = source de vérité séances** en V1 : elle écrit les `.md`, un script sync vers Supabase. En V2 on pourra inverser le flow.
- **Shadcn/ui > composants from scratch** : on copie, on adapte, on ne réinvente pas.
