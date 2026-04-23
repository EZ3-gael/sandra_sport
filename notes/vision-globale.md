# Vision globale — Sandra Sport (nom de code à trancher)

**Créé** : 2026-04-23
**Statut** : décision structurante — à stabiliser puis reporter dans `CLAUDE.md` + `ROADMAP.md`.

---

## Nom du projet

### Constat

- Nom actuel `sandra_sport` = nom de code interne de Gaël, hérité de la conversation quotidienne avec Sandra.
- Il devient étroit dès qu'on assume les 3 piliers (sport seul ≠ wellness corporel intégré).
- Il ne sera pas le nom produit final — à remplacer au plus tard avant ouverture publique.

### Noms de code candidats (shortlist)

| Candidat | Pourquoi | Contre |
|---|---|---|
| **keel** | Quille — stabilité, ancrage corporel, équilibre des 3 piliers. Court, rare, sobre, prononçable EN/FR. Métaphore forte "ce qui te garde droit". | Moins direct que `wellness`. |
| **vitals** | Données vitales — direct, quantified-self, tableau de bord du corps. Aligne bien avec Garmin/Oura/ressentis. | Nom déjà utilisé par d'autres produits (banal). |
| **ember** | Braise — petite flamme qu'on entretient, vitalité. Chaleureux, moins techy. | Moins performatif, plus "bien-être doux". |
| **core** | Fondation corporelle + référence sportive (gainage). Très rassurant. | Extrêmement générique (des milliers d'apps). |
| **anchor** | Ancrage corporel, stabilité quotidienne. | Passif, moins énergique. |
| **forge** | On forge son corps — actif, sportif. | Trop agressif pour un positionnement wellness intégré. |
| **wellness** | Proposition Gaël — direct, descriptif. | Nom générique qui ne distingue pas le produit. Bon comme descripteur de catégorie, faible comme marque. |

### Nom de code acté (2026-04-23)

**`sandra-wellness`** — intérimaire, le temps de trouver le vrai nom produit avant ouverture publique (V2).

**Rename technique différé** : on ne renomme PAS le dossier `sandra_sport/` → `sandra-wellness/` maintenant, pour éviter de renommer deux fois (code de base → nom produit final). Le rename interviendra au moment où le nom produit est choisi (avant V2 public).

**Candidats pour le nom produit final** (à trancher avant V2) : `keel`, `vitals`, `ember`, `core`, `anchor`, `wellness`, ou autre à trouver.

---

## Positionnement

### Pitch en une phrase

> *"L'app tout-en-un du bien-être du corps : ton sommeil, ton activité, ta nutrition — reliés par un coach qui te parle."*

### Ce qu'on fait (scope)

Trois piliers du **bien-être corporel** :

1. **Sommeil / wellness** — check-in matinal (7 dimensions 1-5), métriques Garmin (HRV, sommeil, Body Battery).
2. **Activité** — séances planifiées + réalisées, ressentis post-séance, RPE, checklist protocole.
3. **Alimentation** — catalogue recettes, recettes personnalisées par séance/objectif, liste de courses, partenariats supermarchés (vision long terme).

### Ce qu'on ne fait pas (scope négatif)

- **Santé mentale / esprit** — méditation, journaling émotionnel profond, gestion stress psychologique. Calm, Headspace, Petit BamBou occupent le terrain, et ce n'est pas notre angle.
- **Medical / clinique** — pas de diagnostic, pas de plan thérapeutique. On reste wellness grand public.
- **Social / community** — pas de feed type Strava. Angle perso.

### Case vide dans le marché (validée par le benchmark 2026)

Personne ne croise :
- Narratif humain (coach qui parle, pas tableau de macros).
- Adaptation à l'effort réel (RPE, sommeil, humeur — pas objectif théorique).
- FR native (produits, culture, saisonnalité).
- Module wellness corporel intégré (sport + nutrition + sommeil lié).
- Safety-first allergies.

Sources : `recipes-benchmark.md` (13 apps analysées).

---

## Progression produit — nomenclature Gaël vs ROADMAP technique

**Gaël raisonne en 3 paliers coaching**, le `ROADMAP.md` technique en 5 phases. Voici le mapping clair :

| Palier coaching (Gaël) | Description | Phases techniques (ROADMAP.md) |
|---|---|---|
| **V1 — Sandra MCP** | Sandra (workspace brainstorming) lit les données via MCP Supabase et coache Gaël en conversation. Aucun coach IA dans l'app. | `V1` (perso actuel) + `V1.5` (consolidation mobile, nutrition consultation) + `V2` (ouverture B2C athlete, mais sans coach IA) |
| **V2 — Coach IA via API** | Export des apprentissages Sandra → prompts structurés → Claude/GPT API intégré dans l'app. Chaque athlete a son coach IA persona (nom, ton, expertise). | `V4` du ROADMAP (coach IA personnalisable) |
| **V3 — Coach humain** | Vrais coachs sur la plateforme type EverFit/TrueCoach, avec dashboard client, assignation séances, messagerie, facturation Stripe Connect. | `V3` du ROADMAP (interface coach dual-role) |

**Remarque importante** : dans le ROADMAP existant, `V3` (coach humain) précède `V4` (coach IA). Le palier V2/V3 de Gaël **inverse cet ordre** — coach IA avant coach humain. À arbitrer en fonction de la traction :

- **Si early users demandent un coach IA** (probable) → faire V4 avant V3 (= suivre nomenclature Gaël).
- **Si early users demandent la connexion à un coach humain existant** → faire V3 avant V4.

Mon intuition : **coach IA avant coach humain**. Parce que :
1. Coach IA est monétisable dès le premier user (pas besoin d'onboarder des coachs).
2. L'IA est le vrai angle unique du produit (benchmark : aucun concurrent ne fait coach IA narratif persona en 2026).
3. Interface coach humain est un chantier plus lourd (Stripe Connect, dashboard complet, workflow pro).

→ **Reco** : reporter dans ROADMAP que V4 passe avant V3 (ou les renommer pour refléter la nouvelle priorité). À acter avec Gaël.

---

## Module recettes — quand il entre

Scope défini dans [`recipes-module.md`](./recipes-module.md) et [`recipes-benchmark.md`](./recipes-benchmark.md).

**Séquençage recommandé** :

1. **V1.5b du ROADMAP** — phase minimale "consultation" : catalogue en lecture seule synchronisé depuis `sport-sante/knowledge/recettes/` + liste de courses basique. Pas d'IA. Rapide à sortir.
2. **Après V2 ouverture publique** — phase "sur-mesure IA" : recettes adaptées séance + objectif + ressenti. Liste de courses optimisée. Génération photo IA validée.
3. **V3/V4** — intégration avec coach IA (le coach propose la recette du soir en fonction des données) + partenariats supermarchés si traction.

**Pourquoi cette séquence** :
- Sortir public avec une version "consultation" = crédible et utile sans grever le roadmap.
- Le "sur-mesure IA" est le gros différenciateur marketing → à garder pour la V2 communication publique, une fois qu'on a des early users pour valider.
- Les partenariats supermarchés sont un pari long (Jow a mis 4 ans) → V3+.

---

## Décisions

### Actées 2026-04-23

- [x] **Nom de code intérimaire** : `sandra-wellness`. Nom produit final à trancher avant V2 public.
- [x] **Ordre V3/V4** : coach IA (V4) avant coach humain (V3). Voir ROADMAP §2.
- [x] **Framing nav 3 piliers** : **pivot au moment de la V2** (ouverture publique), pas en V1.5. Raisons :
  1. V1.5 = consolidation perso pour Gaël, pas de valeur à re-framer maintenant.
  2. V2 = moment où on définit la landing / marketing / pitch → pivoter là fait sens et évite le jetable.
  3. La V1.5b (recettes consultation) donnera un signal sur la pertinence réelle de la promesse 3 piliers avant le pivot.
- [x] **Demande API Garmin Developer Program** : à lancer maintenant (délai admin 2-4 semaines), pour être aligné avec la V2 (S+10-16). Préparation du dossier par Sandra, soumission par Gaël.

### Reportées

- [ ] **Rename dossier projet** : `sandra_sport/` → nom produit final, quand nom tranché. Implique renommer dossier + workspace code + imports + remote GitHub. Pas urgent.

## Ressources stratégiques

### Beta testeuse coach identifiée

- **Amie coach de Gaël** — disponible pour bêta-tester l'app.
- **Usage phase 1 (V1.5 / V2)** : en tant qu'**athlète** simple, elle utilise l'app comme n'importe quelle utilisatrice. Feedback UX, wellness, sessions, recettes.
- **Usage phase 2 (V3 coach humain)** : elle devient **coach** sur la plateforme, teste l'interface coach avec ses propres clients réels. Vraie validation produit avant ouverture du mode coach à d'autres pros.
- **Impact ROADMAP** : ne change pas la priorité V4 avant V3 (coach IA reste le premier différenciateur monétisable). Mais constitue un accélérateur fort pour V3 — on aura un vrai pilote coach dès la sortie de V3, pas besoin de chercher un premier pro à convaincre.
- **À faire** : la solliciter pour beta V1.5 quand elle est prête (feedback athlète, flux de données réelles, stress test RLS).

---

## Historique

- **2026-04-23** — Ouverture. Vision 3 piliers + positionnement "corps pas esprit" acté par Gaël. Nomenclature V1/V2/V3 coaching clarifiée avec mapping vers le ROADMAP technique. Reco coach IA avant coach humain. Nom de code à choisir.
- **2026-04-23 (soir)** — Décisions actées par Gaël : nom de code intérimaire `sandra-wellness`, ordre V4 avant V3 confirmé, framing 3 piliers reporté à V2 (pas V1.5), demande API Garmin à lancer maintenant. Amie coach ajoutée comme ressource stratégique (beta athlète V1.5, beta coach V3).
