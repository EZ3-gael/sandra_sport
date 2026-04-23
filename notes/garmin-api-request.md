# Demande accès Garmin Connect Developer Program

**Créé** : 2026-04-23
**Mis à jour** : 2026-04-23 (vérification état des formulaires)
**Statut** : 📨 **email envoyé à `connect-support@developer.garmin.com` le 2026-04-23**. Attente réponse.
**Relance prévue** : **2026-04-30** si pas de réponse (J+5 ouvrés).
**Délai attendu** : incertain — officiellement 2 jours ouvrés via formulaire, mais vu que le formulaire est HS, la voie email est moins garantie.

---

## ⚠️ État réel du process (avril 2026)

Vérifié le 2026-04-23 :
- **https://www.garmin.com/en-US/forms/GarminConnectDeveloperAccess/** → "under construction", identique à la homepage Garmin. HS.
- **https://www.garmin.com/en-US/forms/developercontactus/** → même renvoi vers homepage. HS aussi.
- **Forum officiel Garmin** (discussion 434761, Connect IQ) : plusieurs devs confirment la panne depuis "weeks". Certains ont emailé sans réponse.
- **Commentaire forum réaliste** : Garmin approuve surtout des "big name firms". Les structures plus petites ont historiquement du mal — à savoir.

### Plan actuel

1. **Plan A (prioritaire)** : envoyer un email complet à `connect-support@developer.garmin.com` avec le dossier ci-dessous. On leur évite de nous relancer pour compléter.
2. **Plan B (en parallèle)** : re-tester le formulaire web dans 1-2 semaines. Le remettre au jour quand il fonctionne.
3. **Plan C (fallback technique V1)** : utiliser la lib non-officielle **`python-garminconnect`** (GitHub `cyberjunky/python-garminconnect`) pour ingérer les données Garmin de Gaël dans sa DB locale, via son login/password Garmin Connect. Parfaitement acceptable pour **l'usage perso V1** (c'est ses propres données, automatisation de sa propre session). **Non viable pour prod B2C** (CGU Garmin interdisent d'utiliser ça pour d'autres users que soi-même). À utiliser comme pont technique pendant qu'on attend la voie officielle.

---

## Liens utiles

- ⚠️ **Formulaire de demande (HS en avril 2026)** : https://www.garmin.com/en-US/forms/GarminConnectDeveloperAccess/
- ✉️ **Email support dev** : `connect-support@developer.garmin.com`
- 📖 **Overview programme** : https://developer.garmin.com/gc-developer-program/
- 💡 **Health API doc** : https://developer.garmin.com/gc-developer-program/health-api/
- 🏃 **Activity API doc** : https://developer.garmin.com/gc-developer-program/activity-api/
- ❓ **FAQ programme** : https://developer.garmin.com/gc-developer-program/program-faq/
- 🔧 **Lib fallback V1 perso** : https://github.com/cyberjunky/python-garminconnect
- 💬 **Forum où la panne est discutée** : https://forums.garmin.com/developer/connect-iq/f/discussion/434761/apply-for-connect-developer-program-access-request-form-down

---

## ⚠️ Points d'attention avant soumission

1. **Business use only** — Garmin accepte le programme **uniquement pour des usages business** (pas hobby personnel). Il faut présenter **Sandra Wellness** comme un projet SaaS en développement, pas "je veux mes données perso". Gaël se présente en tant que fondateur / porteur de projet.
2. **Entité légale** — Garmin demandera probablement une raison sociale. Gaël a une **micro-entreprise** (workspace `01_Brainstorming/pro/`) — utiliser ce statut. Si non active, indiquer "en cours de création, statut micro-entrepreneur prévu".
3. **Licences additionnelles** — certaines métriques avancées (Body Battery, HRV détaillée, etc.) peuvent requérir une licence payante ou commande minimale d'appareils. Acceptable — on commencera sans.
4. **Gratuité de base** — pas de frais de licence/maintenance pour le programme standard. Bon signal.

---

## Éléments à préparer pour le formulaire

### 1. Identité demandeur

| Champ | Valeur |
|---|---|
| **Nom / Prénom** | Gaël VIBET |
| **Email pro** | gael.vibet@gmail.com (ou email pro si Gaël en a un) |
| **Société / Raison sociale** | À compléter par Gaël (micro-entreprise existante ou "Sandra Wellness — en cours de constitution") |
| **Pays** | France |
| **Site web** | `https://sandra-sport-beige.vercel.app` (app déployée V1, temporaire — domaine custom à prévoir pour V2) |

### 2. Description du projet (à copier-coller)

> **Sandra Wellness** est une application web mobile-first (Next.js + Supabase, hébergement EU) dédiée au wellness corporel des sportifs amateurs pratiquant de manière structurée (préparation Hyrox, trail, triathlon). L'app articule trois piliers : **sommeil / activité / nutrition**, reliés par un coaching narratif adaptatif (V2 : coach IA persona basé sur Claude API).
>
> Nous souhaitons intégrer les données Garmin Connect de nos utilisateurs afin de leur offrir une vision consolidée de leur état physique (sommeil, HRV, Body Battery, activité), combinée à leurs ressentis subjectifs quotidiens (check-in matinal 7 dimensions). Ces données nourrissent les recommandations d'entraînement et de nutrition générées par l'app.
>
> L'architecture est multi-tenant stricte (RLS Postgres via Supabase), hébergement EU (RGPD compliant), données santé traitées selon les standards européens. Les utilisateurs consentent explicitement à l'import Garmin lors du onboarding et peuvent révoquer à tout moment (droit à l'effacement cascade).

### 3. APIs demandées

- **Health API** : daily wellness summaries, sleep, stress, Body Battery, HRV.
- **Activity API** : activities / workouts détaillés (type, durée, distance, HR zones, pace, puissance).

### 4. Use cases (à copier-coller)

1. **Dashboard wellness quotidien** : afficher à l'utilisateur un score consolidé combinant son check-in subjectif + ses métriques Garmin (sommeil, HRV, Body Battery).
2. **Suivi séances automatisé** : importer automatiquement les activités Garmin et les rapprocher des séances planifiées dans l'app (matching par date + type).
3. **Adaptation des recommandations** : le coach IA (V2) utilise les métriques de récupération Garmin pour adapter la séance du jour et la nutrition du soir.
4. **Historique long terme** : conserver l'historique wellness + activités sur plusieurs années pour analyse de tendances et détection de patterns (surentraînement, sous-récupération).

### 5. Volumétrie estimée

- **V1 (perso)** : 1 utilisateur (Gaël).
- **V2 (ouverture B2C, T+3-4 mois)** : 50-500 utilisateurs early adopters.
- **V3 (coach + IA, T+9-12 mois)** : 1 000-5 000 utilisateurs.
- **Horizon 18 mois** : <10 000 utilisateurs actifs. Croissance modérée et maîtrisée.
- Fréquence de polling : 1 fois/jour par user (daily summary) + import activity event-driven.

### 6. Plan d'intégration technique

- **Authentification OAuth 2.0** Garmin Connect — token stockage côté serveur uniquement (Supabase, chiffré).
- **Server-side ingestion** via Next.js API routes / Server Actions + Supabase SERVICE_ROLE.
- **Webhook Garmin** pour les notifications d'activités terminées (sinon polling daily).
- **Stockage** : tables dédiées `garmin_wellness_daily`, `garmin_activities`, avec `user_id UUID` + RLS.
- **Rate limiting** respecté selon specs Garmin.
- **Stack** : Next.js 15 + TypeScript + Supabase (EU) + Vercel.

### 7. Sécurité et conformité

- Hébergement **EU uniquement** (Supabase region `eu-west-1`).
- RLS activée partout (aucun accès cross-user même en cas de bug applicatif).
- Chiffrement des tokens OAuth au repos.
- Consentement explicite utilisateur à l'inscription (V2) + révocation possible à tout moment.
- Droit à l'effacement RGPD avec cascade sur toutes les tables.
- Pas de partage de données tiers sans consentement additionnel.

---

## Après la soumission

- **J+0 à J+2** : Garmin confirme réception et statut. Ils peuvent demander des infos complémentaires (souvent : plus de détails sur la monétisation, le modèle business, les screenshots de l'app).
- **Si accepté** : accès au dashboard développeur, création d'une app, génération de consumer key/secret pour OAuth.
- **Si refusé** : demander les raisons, ajuster le pitch (souvent "pas assez concret" — résolu avec des screenshots de l'app actuelle).

## Todo Gaël — Plan A (email direct, prioritaire)

- [x] Rédiger un email à envoyer à `connect-support@developer.garmin.com`. Template ci-dessous (ou Sandra peut le rédiger en dur).
- [x] Joindre 2-3 screenshots de l'app V1 (pages wellness + sessions) pour renforcer la crédibilité.
- [x] **Envoyé le 2026-04-23**.
- [ ] **Relance à J+5 ouvrés (2026-04-30)** si pas de réponse.

### Template email (prêt à copier-coller)

```
Objet : Garmin Connect Developer Program — Application (form unavailable)

Hello Garmin Developer Team,

I'm writing to apply for the Garmin Connect Developer Program. The official
access request form at garmin.com/en-US/forms/GarminConnectDeveloperAccess/
has been showing "under construction" for the past several weeks, so I'm
submitting my application directly by email.

Please find below the project description, use cases, estimated volume,
and integration plan. Let me know if you need any additional information
or prefer a different format.

---

PROJECT

Sandra Wellness is a mobile-first wellness web app (Next.js + Supabase,
EU hosting, GDPR-compliant) for structured amateur athletes (Hyrox, trail,
triathlon). It integrates three health pillars — sleep / activity / nutrition —
through an adaptive AI coach (planned V2, Anthropic Claude API).

We want to integrate Garmin Connect data for our users to combine objective
biomarkers (sleep, HRV, Body Battery, activities) with subjective morning
check-ins, and feed this into personalized training and nutrition recommendations.

APIs REQUESTED
- Health API — daily wellness, sleep, stress, Body Battery, HRV.
- Activity API — full activity details (type, duration, HR zones, pace, power).

USE CASES
1. Consolidated daily wellness dashboard (Garmin + subjective check-in).
2. Automatic session ingestion, matching planned sessions with Garmin activities.
3. AI coach adapting training and nutrition based on Garmin recovery metrics.
4. Multi-year history for pattern detection (overtraining, under-recovery).

ESTIMATED VOLUME
- V1 (personal, now): 1 user (myself, for product validation).
- V2 (public beta, T+3-4 months): 50-500 early adopters.
- V3 (coach + AI features, T+9-12 months): 1,000-5,000 users.
- 18-month horizon: under 10,000 active users.
- Polling frequency: 1x/day per user for daily summaries, webhook-driven for activities.

TECHNICAL INTEGRATION
- OAuth 2.0 PKCE, tokens stored server-side (Supabase, encrypted at rest).
- Server-side ingestion via Next.js API routes + Supabase SERVICE_ROLE.
- Garmin webhook for activity notifications (daily polling as fallback).
- Dedicated tables: garmin_wellness_daily, garmin_activities, with user_id UUID + RLS.
- Rate limits respected per Garmin specs.

SECURITY AND COMPLIANCE
- EU-only hosting (Supabase eu-west-1).
- Row Level Security enforced across all tables (no cross-user access possible).
- Explicit user consent at signup, revocable at any time.
- GDPR right to erasure with cascade across all tables.

APPLICANT
- Name: Gaël VIBET
- Entity: [à compléter — raison sociale / micro-entreprise]
- Country: France
- Email: gael.vibet@gmail.com
- Current app URL: https://sandra-sport-beige.vercel.app (V1 deployed)

Looking forward to your feedback.

Best regards,
Gaël VIBET
```

---

## Todo Gaël — Plan B (formulaire web, si rétabli)

- [ ] Tester à nouveau le formulaire dans 1-2 semaines : https://www.garmin.com/en-US/forms/GarminConnectDeveloperAccess/
- [ ] Si fonctionnel : y re-soumettre les éléments (même contenu que l'email), au cas où le traitement formulaire > email.

---

## Todo Gaël — Plan C (fallback V1 perso uniquement)

Uniquement si l'API officielle tarde et que Gaël veut absolument ingérer ses données Garmin dans sandra_sport dès maintenant :

- [ ] Installer `python-garminconnect` dans `scripts/` (`pip install garminconnect`).
- [ ] Créer `scripts/sync_garmin_perso.py` — login Garmin Connect avec credentials Gaël (stockés dans `.env.local`, jamais commités).
- [ ] Créer table Supabase `garmin_wellness_daily` + `garmin_activities` (migrations SQL versionnées, RLS activée avec `user_id = auth.uid()`).
- [ ] Cron quotidien (Vercel Cron ou local) : fetch données Garmin → upsert Supabase.
- [ ] **⚠️ À isoler de la prod B2C** : cette voie ne fonctionne QUE pour les données propres de Gaël (usage perso). Elle ne doit jamais être généralisée aux autres users — violation des CGU Garmin.

---

## Historique

- **2026-04-23** — Dossier préparé par Sandra.
- **2026-04-23 (soir)** — Vérification du lien formulaire → retourne "under construction" depuis plusieurs semaines (confirmé forum Garmin). Plan B activé : email direct à `connect-support@developer.garmin.com` avec template complet. Plan C fallback documenté (`python-garminconnect` pour V1 perso uniquement).
- **2026-04-23 (soir, fin)** — ✉️ Email envoyé par Gaël à `connect-support@developer.garmin.com`. Relance programmée 2026-04-30 si pas de réponse.
