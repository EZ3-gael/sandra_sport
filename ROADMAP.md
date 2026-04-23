# Sandra Wellness — Roadmap

> **Dernière refonte : 2026-04-23**
> Source de vérité pour les jalons long terme. Pour les détails tactiques, voir les `notes/` (vision globale, module recettes, pivot 3 piliers, benchmark).
>
> **Nom de code intérimaire** : `sandra-wellness`. Nom produit final à trancher avant V2 (ouverture publique). Dossier `sandra_sport/` **non renommé** pour l'instant (rename différé au moment du nom final, pour éviter de renommer deux fois). Voir [`notes/vision-globale.md`](./notes/vision-globale.md).

## 1. Vision et positionnement

**Sandra Wellness** (nom de code) est une app **wellness corporel** mobile-first, multi-tenant, articulée autour de 3 piliers : **sommeil / activité / nutrition**. Cible : sportif pratiquant structuré (préparation Hyrox, trail, triathlon) avec ambition long terme grand public wellness.

**Scope négatif** : pas de santé mentale / esprit (Calm, Headspace occupent le terrain). Pas de clinique / médical. Pas de social / community.

**Positionnement candidat (à confirmer)** :
> *"La seule app qui relie ton ressenti du matin et tes séances à des conseils concrets, avec un coach qui te parle — pas un tableau de macros."*

Trois déclinaisons produit, de la plus captive à la plus commerciale :
1. **Perso** (V1 actuelle) — outil quotidien de Gaël.
2. **B2C athletes** (V2) — signup public, freemium.
3. **B2C + B2B hybride** (V3-V4) — athletes + coachs + coach IA premium.

Voir [`notes/pivot-3-piliers-et-journal.md`](./notes/pivot-3-piliers-et-journal.md) pour la réflexion sur un éventuel re-cadrage "3 piliers santé" (sommeil / activité / nutrition) — décision post-V1.

## 2. Séquence time-to-market recommandée

**Objectif** : sortir une première version publique simple rapidement, puis itérer.

**Nomenclature coaching Gaël** (validée 2026-04-23, voir [`notes/vision-globale.md`](./notes/vision-globale.md)) :

- **V1 Coach** = Sandra via MCP (état actuel, zéro coach dans l'app).
- **V2 Coach** = coach IA via API (Claude/GPT) intégré à l'app.
- **V3 Coach** = coach humain avec interface type EverFit.

Mapping vers les phases techniques ci-dessous :

| Semaine | Jalon | Livrable | Coach actif |
|---|---|---|---|
| **S0** (now) | V1 perso done | App fonctionne pour Gaël, Sandra coache via MCP workspace | V1 |
| **S+2-6** | V1.5a consolidation | Dashboard home, PWA, notifications, light/dark | V1 |
| **S+6-10** | V1.5b recettes consultation | Catalogue en lecture seule synchronisé, liste de courses basique | V1 |
| **S+10-16** | **V2 ouverture B2C** | Landing + signup public + onboarding + freemium Stripe + Garmin Connect | V1 (Sandra reste en MCP pour Gaël) |
| **S+16-24** | V4 coach IA persona | Onboarding persona (nom, ton, expertise), export apprentissages Sandra → prompts, Claude API, chat in-app | **V2** |
| **S+20-28** | Module recettes sur-mesure | Recettes IA adaptées séance/objectif/ressenti, photos IA validées | V2 |
| **S+28-40** | V3 coach humain (si traction) | Dual-role, Stripe Connect, dashboard coach, messagerie | **V3** |

**Note importante sur V3 vs V4** : le ROADMAP historique plaçait "interface coach humain" (V3) avant "coach IA" (V4). La conversation du 2026-04-23 a inversé cet ordre — **V4 (coach IA) passe avant V3 (coach humain)** car :
1. Coach IA monétisable dès le premier user (pas besoin d'onboarder des coachs humains).
2. C'est l'angle unique différenciateur (aucun concurrent 2026 ne fait coach IA narratif persona).
3. Interface coach humain = chantier plus lourd (Stripe Connect, dashboard pro, workflow).

Les sections 6 (V3) et 7 (V4) ci-dessous restent numérotées dans l'ordre historique pour lisibilité, mais **l'exécution suivra l'ordre V1 → V1.5 → V2 → V4 → V3**.

### Principe de sortie publique "minimum viable réelle"

La V2 (ouverture B2C) doit sortir **sans coach IA** dès qu'elle est utilisable seule. Le coach IA est un feature payant ajouté après — monétisation progressive. Les early users auront :

- ✅ Wellness check-in quotidien.
- ✅ Séances (consultation + ressentis).
- ✅ Catalogue recettes en lecture seule.
- ✅ Intégration Garmin (import auto).
- ✅ Freemium avec premium basique (historique illimité, export).
- ⏳ Coach IA arrive en phase suivante (V2 Coach = V4 technique).

Cette séquence permet : **feedback utilisateur dès la V2**, **itération sur le coach IA nourrie par les vrais usages**, **monétisation dès le jour 1** sans attendre que l'IA soit parfaite.

---

## 3. Architecture — principes non négociables

Choix validés dès V1, **aucun ne change** dans les jalons suivants :

- **Next.js 15 + TypeScript strict + Tailwind v4** — stack unique du frontend au backend (Server Actions + API Routes).
- **Supabase (EU region, RGPD)** — PostgreSQL managé + Auth + Storage + Realtime (V3+).
- **Multi-tenant strict via RLS** — toutes les tables portent `user_id UUID`, policies `user_id = auth.uid()` systématiques. Les étapes V2-V3-V4 **ne demandent pas de refacto DB**, uniquement des ajouts.
- **Vercel free tier** — déploiement auto sur push main, preview sur PR.
- **Magic link + password** (actuel V1) — peut s'enrichir de OAuth Google/Apple en V2.
- **Conventions Git** — feature branches + PR, jamais push direct main, commits conventionnels en anglais.

## 4. V1 — MVP perso [DONE le 2026-04-23]

Livré :

- ✅ Auth email + password (avec reset password via magic link mail).
- ✅ `/login`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/signout` fonctionnels.
- ✅ Middleware refresh session + route protection.
- ✅ Route group `(app)/` avec layout partagé + nav basse mobile-first.
- ✅ **Wellness** (`/wellness`) — form 7 dimensions (1-5) + zones douleur + notes libres + **multi check-ins/jour** + **édition/suppression d'une saisie existante** avec détection dirty + confirm natif.
- ✅ **Sessions** (`/sessions`) — liste chrono + empty state.
- ✅ **Session detail** (`/sessions/[id]`) — accordion par section, **checklist interactive** sur type `checklist` (Protocole + Post-séance), persistance `session_item_checks`, form ressenti post-séance (RPE, énergie post, zones douleur, notes libres, status `planned`/`done`/`skipped`).
- ✅ **Script sync** `scripts/session_sync.py` (+ module `scripts/session_parser.py` extrait) — parse markdown frontmatter + body + **structure JSON** (sections/subsections/items stables via SHA1), upsert dans `sessions` via SERVICE_ROLE.
- ✅ **Schéma DB** — 5 migrations appliquées (init, unique source file, fix unique, multi-checkin, item checks).
- ✅ **MCP Supabase** configuré côté workspace `sport-sante` pour que Sandra puisse lire les données en direct pendant le coaching.

Deployé sur `https://sandra-sport-beige.vercel.app`.

## 5. V1.5 — Consolidation (2-4 semaines)

Objectif : rendre l'app **confortable** au quotidien pour Gaël avant d'ouvrir à d'autres users.

### V1.5a — Dashboard et ergonomie

- [ ] Page `/` (home) : dashboard compact — dernier check-in, séance du jour (ou prochaine), alertes (wellness jamais saisi aujourd'hui ? séance en retard ?).
- [ ] Toggle light/dark (dark par défaut actuellement, light fonctionnel aussi).
- [ ] Notification push web (PWA) — rappel wellness matinal, rappel séance.
- [ ] PWA manifest — installable sur écran d'accueil Android / iOS.
- [ ] Optimisations mobile — haptic feedback sur toggle checkbox, animations smooth.

### V1.5b — Nutrition — phase "consultation" (voir note dédiée)

**Scope à arbitrer** — trois options dans [`notes/recipes-module.md`](./notes/recipes-module.md). Pour l'instant, phase minimale :

- [ ] Page `/recipes` — catalogue en lecture seule, import depuis `sport-sante/knowledge/recettes/*.md` via un script sync (comme pour les séances).
- [ ] Filtres simples : petit-déj, déjeuner, dîner, encas.
- [ ] Détail recette : ingrédients, préparation, macros, commentaires nutritionnels.
- [ ] Page `/shopping` — sélection recettes → génération liste ingrédients agrégée → export texte/PDF.

La phase "adaptation IA séance → recette" reste **hors V1.5**. Voir scope long terme dans `notes/recipes-module.md`.

### V1.5c — Data et observabilité

- [ ] Script `scripts/sync_wellness.py` miroir (export checkpoints mobile → workspace pour Sandra hors MCP).
- [ ] Sentry monitoring (erreurs front + Server Actions).
- [ ] Vitest — tests critiques : auth flow, RLS policies, Zod validations.
- [ ] Page `/account` — edit email, changer password, **supprimer compte** (cascade RGPD).

### V1.5d — Pivot "3 piliers santé" — REPORTÉ À V2 (décidé 2026-04-23)

**Décision** : le pivot nav/dashboard 3 piliers (sommeil / activité / nutrition) se fait **au moment de la V2** (ouverture publique), pas en V1.5.

Raisons :
1. V1.5 reste pour Gaël seul, pas de valeur à re-framer maintenant.
2. V2 = moment où on définit landing / marketing → pivoter là est cohérent.
3. V1.5b (recettes consultation) donnera un signal sur la pertinence réelle de la promesse 3 piliers avant le pivot.

Ce qu'on fera **en V1.5** (pas de bascule lourde) :
- Dashboard d'accueil simple, pas encore structuré en 3 cards piliers.
- Nav actuelle conservée (`wellness / sessions / recipes`).
- Enrichissement éventuel `sleep_log` reste hors V1.5.

Ce qu'on fera **en V2** (pivot assumé) :
- Nav re-framée en 3 piliers.
- Dashboard home = vue consolidée 3 piliers.
- Enrichissement `sleep_log` (heure coucher/lever, réveils) si la promesse sommeil doit être autonome.
- Landing publique centrée sur les 3 piliers.

Voir [`notes/pivot-3-piliers-et-journal.md`](./notes/pivot-3-piliers-et-journal.md) pour la matière de réflexion initiale.

## 6. V2 — Ouverture B2C Athlete (1-2 mois après V1.5)

Transformer Sandra Sport en produit auto-utilisable par n'importe quel athlete.

### V2a — Signup et onboarding

- [ ] Landing page marketing (`/landing` ou domaine custom) — pitch, features, screenshots, testimonials, pricing.
- [ ] Flow signup public (`/signup`) — email + password + consentement RGPD.
- [ ] Onboarding wizard (post-signup) — objectifs (perte de poids / perf / santé), niveau, blessures, préférences alimentaires, connexion Garmin optionnelle.
- [ ] Page `/profile` — édition profil athlete.

### V2b — Monétisation

- [ ] Stripe billing — freemium + premium.
- [ ] Limite free tier à définir : nombre séances/mois, historique limité, pas d'export PDF ?
- [ ] Premium : wellness illimité, analytics, export data, features V3+ plus tard.
- [ ] Pricing cible candidat : ~8-12 €/mois (benchmark Yazio 39€/an, TrueCoach ~$20/mo coach, Hevy Coach ~$20-30/mo).

### V2c — Intégrations wearables (inspiration Everfit)

- [ ] **Garmin Connect** via Developer Program (voir dossier séparé — process 2-4 semaines d'accès partenaire, **à lancer dès V2 scope validé**).
- [ ] Apple Health / Google Fit via connecteurs standard.
- [ ] Import auto séances + wellness biomarkers (sommeil Garmin, HRV, Body Battery) dans le dashboard.

### V2d — Notifications et habitudes (inspiration Everfit)

- [ ] Daily habits légers à cocher (hydratation, suppléments, étirements) — intégrés au dashboard piliers si pivot confirmé.
- [ ] Email/SMS digest hebdo — récap semaine + prochaine semaine.
- [ ] Rappel push personnalisé — heure de check-in matinal, rappel séance J-0.

## 7. V3 — Interface coach humain (après V4, si traction)

Transformer Sandra Sport en plateforme coach/athlete. **Inspirations benchmark** : TrueCoach (focus clean force), Trainerize (tout-en-un), Everfit (habits + wearables).

### V3a — Dual-role

- [ ] Colonne `role` sur profil user : `athlete` | `coach` | `both`.
- [ ] Interface `/coach/*` distincte — vue "j'agis en tant que coach".
- [ ] Switch rapide role en haut de la nav (si `both`).

### V3b — Liens coach-athlete

- [ ] Table `coach_athlete_links` — `coach_id`, `athlete_id`, `status` (`invited` / `active` / `revoked`), `started_at`.
- [ ] Flow invitation coach → athlete par email (magic link d'acceptation).
- [ ] Flow validation athlete → accepte l'interaction avec un coach.
- [ ] RLS étendue : coach peut lire les data de ses athletes via la jointure (via policy `EXISTS (SELECT 1 FROM coach_athlete_links WHERE ...)`).

### V3c — Features coach

- [ ] Dashboard coach — liste athletes, alertes (wellness dégradé, séance manquée, blessure déclarée).
- [ ] **Planification** — assignation de séances à un athlete (création, templates, copie/duplication).
- [ ] **Calendrier** — vue semaine/mois, drag-drop séances, cycles microcycle/mésocycle.
- [ ] **Messagerie** (minimal V3, chat riche V3.5) — commentaire en contexte d'une séance ou d'un checkin.
- [ ] **Export suivi** — rapport PDF mensuel par athlete.

### V3d — Features athlete (côté lien coach)

- [ ] Vue "mes coachs" — liste des coachs avec qui je suis en lien.
- [ ] Séances coachs visibles dans `/sessions` avec badge distinctif + source.
- [ ] Validation / feedback athlete sur séance coach (accept / decline / reschedule).

### V3e — Monétisation coach

- [ ] Stripe Connect — paiement coach → plateforme (commission % ou abo coach).
- [ ] Limite tier coach : N athletes max selon plan (inspiration TrueCoach : 5 / 20 / 50+).
- [ ] Coach dashboard facturation.

## 8. V4 — Coach IA personnalisable (priorité sur V3, voir §2)

**C'est le feature unique qu'aucun concurrent ne fait en 2026** (benchmark confirmé TrueCoach, Trainerize, Everfit, Fitia).

### Fonctionnement

- Athlete premium accède à un **coach IA persona** customisable :
  - Nom (prénom au choix)
  - Genre (F / M / N)
  - Photo (IA générée avec validation humaine, comme le plan recettes)
  - Ton (strict / pétillant / technique / bienveillant)
  - Expertise principale (course / Hyrox / muscu / endurance / récup).
- Le coach IA agit **comme Sandra ici** : lit wellness + sessions + ressentis via le MCP Supabase, génère des plans adaptatifs, débriefe les séances, ajuste selon blessures.
- **Onboarding** : questionnaire objectifs/niveau/blessures/contraintes → génération plan de N semaines.
- **Suivi** : chaque semaine, re-prompt avec les données réelles → ajustement.

### Architecture technique

- **LLM backend** : Anthropic Claude API (SDK `@anthropic-ai/sdk`) avec prompt caching activé. Migration V2 Claude possible via `claude-api` skill du workspace.
- **Stockage persona** : table `coach_ia_personas` (user_id, name, gender, photo_url, tone, expertise, created_at).
- **Stockage conversations** : table `coach_ia_conversations` + `coach_ia_messages` (historique contextualisé).
- **Tools MCP exposés au coach IA** : lecture sessions, wellness, body metrics (Garmin), recettes. Écriture uniquement sur ses propres tables (plans IA, messages).

### Monétisation

- Tier premium payant distinct — vraisemblablement ~15-25 €/mois sur top du freemium. À benchmarker avec Whoop Coach, Freeletics Coach, Strava Summit.
- Offre famille / coach pro : coach IA marque blanche intégré à un coach humain.

## 9. Module Recettes — chantier transverse

Scope et décisions complexes, **voir les notes dédiées** :
- [`notes/recipes-module.md`](./notes/recipes-module.md) — brainstorm, vision, positionnement, différenciation.
- [`notes/recipes-benchmark.md`](./notes/recipes-benchmark.md) — 13 apps comparées, conclusions sur le marché, cases vides.

**Trois options scope** (à arbitrer post-V1) :
1. Module V2 de Sandra Sport (intégré).
2. Spin-off `sandra_food` (app séparée).
3. Hybride — module intégré pour early users, spin-off si traction.

**Argument actuel penche option 1** — leçon PlateJoy (fermé juillet 2025) : le meal planner solo B2C n'est pas sticky.

## 10. Décisions techniques importantes à trancher

- **Pivot "3 piliers santé"** — voir [`notes/pivot-3-piliers-et-journal.md`](./notes/pivot-3-piliers-et-journal.md). Brainstorm dédié pré-V1.5.
- **Journal libre mobile** — V1.5 ou V2 ? Articulation avec balades vocales workspace.
- **Sourcing catalogue recettes** — licence (Spoonacular/Edamam) vs génération IA vs rédaction manuelle.
- **API officielle Garmin** — ⚠️ **formulaire officiel HS en avril 2026** (under construction depuis plusieurs semaines, confirmé forum Garmin). Plan activé : email direct à `connect-support@developer.garmin.com` avec dossier complet. Voir [`notes/garmin-api-request.md`](./notes/garmin-api-request.md) pour le template prêt à envoyer et les plans B/C (retest formulaire, fallback `python-garminconnect` pour V1 perso).
- **Migration SQLite local → Supabase miroir** — pour que Sandra workspace ait toujours un snapshot offline. V1.5.

## 11. Benchmark synthétique des concurrents (2026)

| App | Modèle | Force | Faiblesse vs Sandra Sport |
|---|---|---|---|
| **TrueCoach** | B2B coach | Clean, bon pour force | Pas d'IA, pas de wellness, pas de wearables natifs |
| **Trainerize** | B2B coach | Le plus complet, intégrations deep | Complexe, cher à scale, pas d'IA générative |
| **Hevy Coach** | B2B coach force | Simple, abordable | Workout logger pur, pas de multi-dimensionnel |
| **Everfit** | B2B coach | **Le plus proche** — habits + wearables + nutrition | B2B pur, pas B2C, pas de coaching narratif IA |
| **Fitia** | B2C sport-nutri | Macros scientifique | Tableaux seulement, zéro narratif |
| **Jow** | B2C meal planner FR | Partenariats supermarchés | Zéro sport |
| **Whoop Coach** | B2C recovery | Coach IA simple | Hardware required, narrow scope |

**Positionnement unique Sandra Sport** (croisement non occupé) :
**Coach narratif humanoïde** (IA persona) **+ lien sport-réel adaptatif** (ressenti + séances) **+ nutrition sport-calibrée** (si module recettes V2 exécuté) **+ FR native**.

---

## Historique des révisions

- **2026-04-23** — Refonte complète. Remplace l'ancien ROADMAP V1/V1.5/V2 vague. Intègre la vision coach/athlete/coach IA partagée par Gaël, le benchmark 2026 (TrueCoach/Trainerize/Everfit/Hevy/Fitia/Jow), et les notes `pivot-3-piliers-et-journal.md` + `recipes-module.md` + `recipes-benchmark.md` produites la même journée.
- **2026-04-23 (soir)** — Ajout de la §2 "Séquence time-to-market" avec mapping V1/V2/V3 coaching Gaël → phases techniques. Inversion V3/V4 : coach IA passe avant coach humain (justifié en §2). Numérotation sections décalée (+1) pour insérer la séquence. Vision détaillée dans `notes/vision-globale.md`.
- **2026-04-23 (soir, fin)** — Décisions actées par Gaël : nom de code `sandra-wellness` (titre ROADMAP renommé), pivot 3 piliers reporté à V2 (V1.5d mis à jour), demande API Garmin à lancer maintenant (§10 mise à jour). Beta testeuse identifiée (coach amie de Gaël) — sera utilisée comme athlète en V1.5 puis comme coach en V3, voir `notes/vision-globale.md`.
