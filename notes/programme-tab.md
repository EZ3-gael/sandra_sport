# Feature — Onglet "Programme" (suivi protocole tendon)

**Créé** : 2026-05-05
**Statut** : spec ouverte, à intégrer en V1.5
**Source** : conversation Sandra workspace `sport-health`, 2026-05-04 et 2026-05-05 (refonte programme phase 1 tendinopathie Achille + force jambes ménisque-compatible, horizon 12-18 mois).

---

## 1. Idée

Un onglet dédié dans l'app, conçu comme un **tableau de bord opérationnel** pour piloter au quotidien le protocole de rééducation phase 1 (W19 → W34, mai → août 2026). L'onglet répond à 4 besoins concrets de Gaël :

1. **Le matin** : *"Quelle est ma séance du jour ? Quelles charges ? Quel RPE viser ?"*
2. **Pendant la séance** : *"Je coche les exos au fur et à mesure, je note ma charge effective."*
3. **Hebdomadaire** : *"Où j'en suis du protocole ? Combien de jours consécutifs Achille ≤ 1/10 ? Quel est mon prochain palier ?"*
4. **Mensuel** : *"Quels sont mes résultats SLHRT, ma progression proprio, mes charges HSR ?"*

Sans cet onglet, Gaël doit ouvrir la fiche markdown dans Obsidian pour consulter ses charges, compter mentalement ses jours consécutifs Achille, et croiser avec les données wellness/séances éparses dans l'app. L'onglet **agrège, calcule et visualise** — il ne crée pas une nouvelle source de vérité, il consomme intelligemment ce qui existe.

**Principe directeur** : la fiche knowledge `sport-health/knowledge/protocoles/programme-phase1-W19-W34.md` reste **la source de vérité**. L'onglet la lit (via le script de sync existant) et l'enrichit avec la mesure réelle des journées (charges effectives, RPE, score Achille).

---

## 2. User stories

- **US1** — En tant que Gaël, le matin au réveil, après avoir saisi mon ressenti dans `/wellness`, je veux voir ma séance du jour avec les exos et charges précises directement dans `/programme`, sans avoir à ouvrir l'app de notes.
- **US2** — Pendant ma séance HSR, je veux cocher chaque exo terminé et saisir la charge effective utilisée par exo (différente parfois de la charge prescrite).
- **US3** — En fin de séance, je veux saisir ma douleur Achille pendant le HSR (0-10) et mon RPE final, puis voir si je suis dans les conditions pour progresser le palier suivant.
- **US4** — Le dimanche soir, je veux voir un récap visuel de ma semaine : score Achille moyen, jours HSR exécutés, marqueurs en vert/orange/rouge sur les 4 conditions de passage de palier.
- **US5** — Une fois par mois, je veux saisir mes résultats SLHRT (côté D + côté G) et voir l'évolution sur les mois précédents.
- **US6** — En cas de score Achille ≥ 4/10 un matin, je veux que l'app me signale visiblement la conduite à tenir (remplacement de la séance par vélo Z1, etc.) directement dans la séance du jour.

---

## 3. Spec UI

### Architecture de la page `/programme`

Mobile-first. Une seule route, 5 sections empilées verticalement, scroll naturel. Pas de tabs internes (la complexité serait inutile pour 5 sections déjà courtes).

```
┌──────────────────────────────────┐
│  [Brique 1]  Bandeau "Où j'en   │
│              suis"                │
├──────────────────────────────────┤
│  [Brique 2]  Séance du jour      │
│              (la plus haute)      │
├──────────────────────────────────┤
│  [Brique 3]  Score Achille 30j   │
│              (graphique)          │
├──────────────────────────────────┤
│  [Brique 4]  Tableau charges     │
│              HSR                  │
├──────────────────────────────────┤
│  [Brique 5]  Marqueurs mensuels  │
│              (compact)            │
└──────────────────────────────────┘
```

### Brique 1 — Bandeau "Où j'en suis"

Hauteur fixe ~120px. Toujours visible en haut.

- **Phase + semaine** (ex. *"Phase 1A · W19 (semaine du 11/05)"*).
- **Palier HSR actuel** (ex. *"1 séance HSR/sem · prochain palier : 2/sem en W20"*).
- **Compteur "Jours consécutifs Achille ≤ 1/10"** : grand chiffre visuel (ex. *"7 / 14"*) avec barre de progression.
- **4 indicateurs** sous forme de petits points colorés (vert / orange / rouge) avec libellé court :
  - Score Achille ≤ 2/10 (5j)
  - Douleur HSR ≤ 5/10
  - Pas de flare-up J+1
  - Sommeil non perturbé

### Brique 2 — Séance du jour

Le bloc le plus visuel et le plus utilisé.

- **Titre de séance** (ex. *"Lundi · HSR mollets + Muscu haut du corps"*).
- **Durée prévue** (ex. *"~1h45"*).
- **Liste des sections** (échauffement, corps, récup) en accordion (déjà en place côté `/sessions/[id]`) — chacune contenant ses exos.
- **Pour chaque exo** :
  - Nom + sets × reps cibles + charge prescrite + RPE attendu + TUT
  - Checkbox "fait"
  - Champ chiffre **"charge effective utilisée"** (modifiable, par défaut = charge prescrite)
  - Champ chiffre **"RPE final série 4"** (modifiable, optionnel)
- **En bas de la séance** :
  - Champ chiffre **"Douleur Achille pendant la séance (0-10)"**
  - Champ chiffre **"Douleur Achille immédiatement après (0-10)"**
  - Bouton "Terminer la séance" qui sauvegarde l'ensemble.

### Brique 3 — Score Achille 30 jours

Graphique simple, type sparkline ou bar chart.

- Axe X : 30 derniers jours
- Axe Y : score 0-10
- **Ligne horizontale rouge** à 3/10 (seuil d'alerte)
- **Ligne horizontale verte** à 1/10 (cible de palier)
- **Points colorés** sur les jours où il y a eu une séance HSR (orange si HSR fait, gris sinon)
- Tooltip au tap : date + score + détail (séance HSR ou non)

Lib recommandée : `recharts` ou équivalent léger, pas de Chart.js qui est lourd.

### Brique 4 — Tableau des charges HSR

Mini-table 4 lignes (les 4 exos HSR) × 4 colonnes :

| Exo | Charge actuelle | Charge suivante | 4 dernières séances |
|---|---|---|---|
| Montées mollets chargées | 16 kg | 18 kg si RPE ≤ 7 | 16 / 16 / 16 / — (RPE: 8/8/7/—) |
| Chaise unilatérale | 24 kg | passer à 12 reps avant +2kg | 24×10 / 24×10 / 24×10 / — |
| Hip thrust BOSU | poids du corps | gilet 5 kg en W26+ | ✓ / ✓ / ✓ / — |
| Relevés tibial | 4×15s bilatéral | passage unilatéral W23+ | ✓ / ✓ / ✓ / — |

Au tap d'une ligne : modal d'historique complet de l'exo (toutes les séances, charges, RPE).

### Brique 5 — Marqueurs mensuels

Bloc compact, 1 carte par marqueur.

- **SLHRT** (Single Leg Heel Rise Test) : *"Côté D : 18 reps · Côté G : 22 reps · Asymétrie : 18% (cible <10%)"*. Bouton "Saisir le test du mois".
- **Proprioception** : *"Phase B · Appui unipodal G yeux fermés sur coussin : 28s (cible 30s)"*.
- **Validation kiné** : *"Dernière séance : 2026-05-12 — Cyriax + dry needling tendon (oui)"*. Bouton "Saisir la dernière séance".

---

## 4. Spec data

### Tables existantes à exploiter (lecture uniquement)

- **`morning_checkin`** — récupérer le score Achille via `pain_zones` + `notes` (où on extrait le score 0-10 du tendon).
- **`sessions`** — récupérer la séance du jour (avec son `protocol` JSON).
- **`session_notes`** — pour le RPE final et le ressenti post-séance global.

### Nouvelles tables à créer (migrations SQL versionnées)

#### Table `hsr_exercise_log`

Journal de chaque exo HSR effectivement réalisé.

```sql
CREATE TABLE public.hsr_exercise_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  exercise_key text NOT NULL,  -- 'mollets-charges' | 'chaise-unilaterale' | 'hip-thrust-bosu' | 'releves-tibial'
  performed_at date NOT NULL,
  charge_kg numeric,            -- nullable (poids du corps possible)
  reps int,                     -- reps réellement effectuées sur la 4e série
  rpe int CHECK (rpe BETWEEN 1 AND 10),
  pain_during int CHECK (pain_during BETWEEN 0 AND 10),
  notes text,
  captured_at timestamptz DEFAULT now()
);

-- RLS standard
ALTER TABLE public.hsr_exercise_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own" ON public.hsr_exercise_log FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert own" ON public.hsr_exercise_log FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "update own" ON public.hsr_exercise_log FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "delete own" ON public.hsr_exercise_log FOR DELETE USING (user_id = auth.uid());

CREATE INDEX hsr_log_user_date_idx ON public.hsr_exercise_log (user_id, performed_at DESC);
CREATE INDEX hsr_log_user_exo_idx ON public.hsr_exercise_log (user_id, exercise_key, performed_at DESC);
```

#### Table `monthly_marker`

Marqueurs mensuels de progression (SLHRT, proprio, validations kiné).

```sql
CREATE TABLE public.monthly_marker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  marker_type text NOT NULL,  -- 'slhrt' | 'proprio_unipodal_g' | 'kine_validation' | 'echo'
  measured_at date NOT NULL,
  value_numeric numeric,       -- ex. nb reps SLHRT, durée en secondes
  value_text text,             -- ex. notes kiné, observations
  metadata jsonb,              -- structure libre (ex. SLHRT: {droite: 18, gauche: 22, asymetrie: 18})
  notes text,
  captured_at timestamptz DEFAULT now()
);

ALTER TABLE public.monthly_marker ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own" ON public.monthly_marker FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert own" ON public.monthly_marker FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "update own" ON public.monthly_marker FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "delete own" ON public.monthly_marker FOR DELETE USING (user_id = auth.uid());

CREATE INDEX monthly_marker_user_type_idx ON public.monthly_marker (user_id, marker_type, measured_at DESC);
```

#### Table `program_phase`

État de la phase en cours pour chaque utilisateur (1 ligne active par user).

```sql
CREATE TABLE public.program_phase (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phase_code text NOT NULL,            -- 'phase-1a' | 'phase-1b' | 'phase-1c' | 'phase-1d' | 'phase-2' etc.
  phase_label text NOT NULL,           -- 'Phase 1A — Établir la tolérance'
  hsr_frequency_per_week int NOT NULL, -- 1, 2, 3
  started_at date NOT NULL,
  ended_at date,                       -- null si en cours
  source_md_path text,                 -- ex. 'sport-health/knowledge/protocoles/programme-phase1-W19-W34.md'
  notes text
);

ALTER TABLE public.program_phase ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select own" ON public.program_phase FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert own" ON public.program_phase FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "update own" ON public.program_phase FOR UPDATE USING (user_id = auth.uid());

-- Vue dérivée : phase active courante
CREATE VIEW public.program_phase_active AS
  SELECT * FROM public.program_phase
  WHERE ended_at IS NULL
  ORDER BY started_at DESC LIMIT 1;
```

### Synchronisation `programme-phase1-W19-W34.md` → Supabase

Étendre le script `scripts/sync-sessions.py` (ou créer `scripts/sync-program.py`) pour parser les éléments structurés de la fiche knowledge :

- Le tableau des charges par phase → mise à jour `program_phase` + génération des templates HSR utilisés dans `sessions.protocol`.
- La structure de la semaine type → utilisée pour pré-remplir les séances futures (auto-création des séances W19 → W34).

**Frontmatter à ajouter à la fiche** `programme-phase1-W19-W34.md` (côté workspace `sport-health`) pour faciliter le parsing :

```yaml
---
program_id: phase1-tendon-2026
program_label: Phase 1 — Reconstruction tissulaire
date_start: 2026-05-11
date_end: 2026-08-30
phases:
  - code: phase-1a
    label: 1A — Établir la tolérance
    weeks: [W19, W20, W21, W22]
    hsr_frequency: [1, 2, 3, 3]
    week_decharge: W22
  - code: phase-1b
    label: 1B — Montée en charge
    weeks: [W23, W24, W25, W26]
    hsr_frequency: [3, 3, 3, 3]
    week_decharge: W26
  # ... etc.
hsr_exercises:
  mollets-charges:
    name: Montées sur mollets chargées
    base_weight: 16
    progression: +2 si RPE ≤ 7 sur 4e série
    target_max: 34
    tut_seconds: 6
    sets: 4
    reps: 8
  # ... etc.
---
```

---

## 5. Logique de calcul (règles métier)

### Calcul du compteur "jours consécutifs Achille ≤ 1/10"

```typescript
function computeAchillesStreak(checkins: MorningCheckin[]): number {
  // Parcourir checkins du jour J en arrière, jusqu'au premier jour où score Achille > 1
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = subDays(today, i);
    const checkin = checkins.find(c => isSameDay(c.checkin_date, date));
    if (!checkin) break;  // pas de saisie ce jour-là → on arrête
    const achilleScore = extractAchillesScore(checkin.pain_zones, checkin.notes);
    if (achilleScore === null || achilleScore > 1) break;
    streak++;
  }
  return streak;
}
```

### Calcul des 4 conditions de passage de palier

```typescript
type PaliPassageStatus = 'green' | 'orange' | 'red';

function evaluatePalierConditions(state: ProgramState): {
  scoreOk: PaliPassageStatus;
  painHsrOk: PaliPassageStatus;
  noFlareUp: PaliPassageStatus;
  sleepOk: PaliPassageStatus;
} {
  // Score Achille ≤ 2/10 sur 5j consécutifs
  const scoreStreak2 = computeAchillesStreakBelowThreshold(state.checkins, 2);
  const scoreOk = scoreStreak2 >= 5 ? 'green' : scoreStreak2 >= 3 ? 'orange' : 'red';

  // Douleur HSR ≤ 5/10 sur les 3 dernières séances HSR
  const recentHsr = state.hsrLogs.slice(0, 3);
  const allBelow5 = recentHsr.every(log => log.pain_during <= 5);
  const painHsrOk = allBelow5 ? 'green' : 'red';

  // Pas de flare-up J+1 (score J+1 post-HSR n'a pas augmenté de >2 points vs J0)
  const noFlareUp = checkNoFlareUpAfterHsr(state.checkins, state.hsrLogs);

  // Sommeil non perturbé : moyenne 7j sleep_quality ≥ 3 (sur l'échelle 1-5 wellness)
  const sleepAvg7d = average(state.checkins.slice(0, 7).map(c => c.sleep_quality));
  const sleepOk = sleepAvg7d >= 3.5 ? 'green' : sleepAvg7d >= 2.5 ? 'orange' : 'red';

  return { scoreOk, painHsrOk, noFlareUp, sleepOk };
}
```

### Calcul de la charge suivante (Brique 4)

Pour chaque exo HSR, regarder les 3 dernières séances :
- Si toutes ont eu un RPE final ≤ 7 → "Charge suivante : +2 kg" (vert)
- Si dernière séance RPE 8 et pénultième RPE 7 → "Charge suivante : maintenir" (orange)
- Si dernière séance RPE ≥ 9 ou douleur ≥ 5/10 → "Charge suivante : -2 kg ou retour palier précédent" (rouge)

### Alerte "score Achille ≥ 4/10"

Quand le score Achille du matin du jour J est ≥ 4 :
- **Bandeau rouge** au-dessus de la Brique 2 (séance du jour) : *"Score Achille à 4/10 ce matin. Conduite à tenir : vélo Z1 30 min uniquement, pas de HSR, pas de muscu jambes."*
- La séance du jour est **remplacée visuellement** par un encart "Séance ajustée : vélo Z1 30 min + routine matinale" (sans supprimer la séance originale dans la base — on l'enregistre comme `status='replaced_for_pain'` avec un commentaire automatique).
- Notification push si activée (V1.5+).

---

## 6. Implémentation technique

### Pages Next.js

```
src/app/(app)/programme/
├── page.tsx                  # Page principale (Server Component, fetch initial)
├── actions.ts                # Server Actions (saveHsrLog, saveMarker, etc.)
├── components/
│   ├── PhaseHeader.tsx        # Brique 1
│   ├── TodaySession.tsx       # Brique 2
│   ├── AchillesChart.tsx      # Brique 3 (recharts)
│   ├── HsrLoadTable.tsx       # Brique 4
│   ├── MonthlyMarkers.tsx     # Brique 5
│   └── PainAlert.tsx          # Bandeau alerte conditionnel
└── lib/
    ├── achilles-streak.ts     # logique compteur jours consécutifs
    ├── palier-conditions.ts   # logique 4 conditions
    └── load-progression.ts    # logique calcul charge suivante
```

### Server Actions principales

```typescript
// actions.ts
export async function saveHsrExerciseLog(input: HsrLogInput) { /* ... */ }
export async function saveMonthlyMarker(input: MarkerInput) { /* ... */ }
export async function markSessionDone(sessionId: string, finalNotes: SessionFinalInput) { /* ... */ }
export async function ackPainAlert(sessionId: string, action: 'replaced_for_pain' | 'kept_as_planned') { /* ... */ }
```

Toutes les actions valident l'input avec Zod, vérifient `auth.uid()`, et retournent une `ActionResult<T>` standardisée.

### Fetching data

`page.tsx` fait 4 queries Supabase en parallèle (Server Component) :

```typescript
const [phase, todaySession, recentCheckins, hsrLogs] = await Promise.all([
  supabase.from('program_phase_active').select('*').single(),
  supabase.from('sessions').select('*').eq('session_date', today).single(),
  supabase.from('morning_checkin').select('*').gte('checkin_date', subDays(today, 30)).order('checkin_date', { ascending: false }),
  supabase.from('hsr_exercise_log').select('*').gte('performed_at', subDays(today, 30)).order('performed_at', { ascending: false }),
]);
```

Hydratation côté client uniquement pour les composants interactifs (formulaires de saisie HSR).

### Composant `<RpeSlider>`

Réutiliser le composant prévu dans `notes/rpe-guidance-per-section.md` (V1.5e) — mêmes mécaniques (slider 1-10 avec snap entiers).

---

## 7. Marqueurs visuels & alertes

### Code couleur

- **Vert** (`bg-emerald-500`) : tout va bien, palier sécurisé.
- **Orange** (`bg-amber-500`) : vigilance, on garde le palier en cours.
- **Rouge** (`bg-red-500`) : alerte, on régresse au palier précédent ou on bascule en vélo Z1.

### Bandeaux d'alerte conditionnels

| Condition | Bandeau |
|---|---|
| Score Achille ≥ 4/10 le matin | Rouge — *"Conduite à tenir : vélo Z1 30 min, pas de HSR ni muscu jambes."* |
| 2 matins consécutifs ≥ 3/10 | Orange — *"Surveillance accrue. Si demain ≥ 3, retour au palier précédent."* |
| 3 jours consécutifs sans HSR planifié manqué | Orange — *"Tu as manqué 3 séances HSR consécutives. Vérifier que tu es toujours en phase active."* |
| Sommeil < 3/5 sur 3 nuits consécutives | Orange — *"Récup compromise — réduire l'intensité HSR de 20% jusqu'à amélioration."* |

---

## 8. Edge cases & states

- **Pas de séance prévue ce jour** (jour OFF, ou samedi/dimanche) : afficher un message *"Pas de séance programmée. Routine matinale recommandée."* + accès rapide au protocole d'auto-éval.
- **Pas de checkin matinal saisi** : Brique 1 affiche *"Saisis ton ressenti du matin pour activer le pilotage du palier."* avec lien vers `/wellness`.
- **Phase 1 terminée** (W34 dépassée) : afficher un encart *"Bilan phase 1 disponible — voir détail."* + déclencher la création de la phase 2 si critères de sortie validés.
- **Aucune table `program_phase` active** (premier usage) : modal d'onboarding *"Quelle phase démarres-tu ?"* avec sélection.
- **Donnée Garmin manquante** (sommeil, HRV) : ne pas bloquer le calcul des conditions — utiliser uniquement les données disponibles.

---

## 9. Évolutions futures (post-V1.5)

### Phase 2 et au-delà

L'onglet est conçu pour évoluer avec le programme. Phase 2 (sept-nov 2026) introduira :
- Réintroduction course → nouveaux exos à logger (volume hebdo en km, allure)
- Réintroduction Hyrox impact → tracking sled push, broad jumps, etc.
- Critères de passage de palier différents

→ La structure des tables (`program_phase`, `hsr_exercise_log` étendu) est suffisamment générique pour absorber ces évolutions sans schéma breaking. Ajouter une table `running_log` dédiée et étendre `program_phase` avec un champ `module_set jsonb` pour configurer dynamiquement les briques de l'onglet.

### Extension multi-tenant (V2)

L'onglet est par construction prêt pour le mode commercial : toutes les tables ont `user_id` + RLS. Côté UX, l'onboarding "Quelle phase démarres-tu ?" devra être étendu en V2 pour proposer des templates de programme (pas juste le programme phase 1 spécifique à Gaël).

### Intégration coach IA V4

À terme, le coach IA pourra **modifier dynamiquement** les charges suivantes en fonction des signaux croisés (charge HSR + sommeil + HRV + douleur). Côté data, le mécanisme est déjà prêt : la "charge suivante" est calculée par une fonction pure (`load-progression.ts`), il suffira de la remplacer par un appel à un service IA.

---

## 10. Roadmap d'implémentation

### V1.5e (court terme — démarrage du protocole le 11/05/2026)

L'onglet doit être **utilisable dès le 11/05** pour que Gaël puisse piloter le programme phase 1.

**Lot minimum viable (V1.5e1) — ~2-3 jours dev** :
- [ ] Migration SQL : `hsr_exercise_log`, `monthly_marker`, `program_phase` + RLS.
- [ ] Page `/programme` avec les 5 briques en lecture seule (pas encore de saisie en lot 1).
- [ ] Sync `programme-phase1-W19-W34.md` → table `program_phase` (script Python étendu).
- [ ] Brique 1 : bandeau "Où j'en suis" (calcul streak + 4 conditions).
- [ ] Brique 2 : séance du jour avec checkbox "fait" sur les exos (sans encore le champ "charge effective").

**Lot saisie complète (V1.5e2) — ~2 jours dev supplémentaires** :
- [ ] Champ "charge effective" + RPE par exo dans Brique 2.
- [ ] Server Action `saveHsrExerciseLog` + persistance.
- [ ] Brique 4 : tableau charges HSR avec calcul "charge suivante".
- [ ] Bandeau d'alerte rouge si score Achille ≥ 4/10.

**Lot visualisations (V1.5e3) — ~1-2 jours dev** :
- [ ] Brique 3 : graphique 30 jours (recharts).
- [ ] Brique 5 : marqueurs mensuels + saisie SLHRT.
- [ ] Modale historique au tap d'un exo HSR.

### V2 (commercialisation B2C)

- Onboarding multi-templates de programme (pas juste phase 1 Gaël).
- Notifications push (alertes, rappels HSR).
- Vue admin/coach (V3) pour piloter à distance.

---

## 11. Liens transverses

- **Source de vérité contenu** : `D:/SANDRA/01_second-brain/02_areas/sport-health/knowledge/protocoles/programme-phase1-W19-W34.md` (à créer après validation Gaël).
- **Protocole d'auto-éval matinal** : `D:/SANDRA/01_second-brain/02_areas/sport-health/knowledge/protocoles/auto-eval-tendon-achille-matin.md`.
- **Cadre clinique** : `D:/SANDRA/01_second-brain/02_areas/sport-health/knowledge/blessures.md`.
- **Composant slider partagé** : `notes/rpe-guidance-per-section.md` (V1.5e).
- **Vision globale app** : `notes/vision-globale.md`.
- **Pivot 3 piliers (long terme)** : `notes/pivot-3-piliers-et-journal.md`.

## 12. Questions ouvertes

1. **Extraction du score Achille depuis `morning_checkin`** : actuellement, le score d'auto-éval matinal est saisi dans `pain_zones` ou `notes` sous forme texte ("Achille D : 2/10"). Faut-il créer un champ dédié `achilles_score int` dans `morning_checkin` pour fiabiliser la lecture ? Recommandation : **oui**, migration légère, évite tout parsing fragile.

2. **Bouton "skip séance" avec raison** : si Gaël saute une séance HSR pour cause de surcharge, faut-il un workflow dédié pour tracer le motif (alternativement à `status='replaced_for_pain'`) ?

3. **Phase 1A/B/C/D ou juste "phase 1" + auto-progression interne ?** : l'app doit-elle distinguer visuellement les sous-phases (1A, 1B, etc.) ou rester sur "phase 1" + indicateur de semaine (W19, W20, etc.) ? Recommandation : montrer la sous-phase (1A) car elle correspond à des règles différentes (charges, fréquence HSR).

4. **Intégration mobile native** : à terme, voudra-t-on une app native (iOS) ou la PWA Next.js suffit-elle ? V1.5 reste PWA, à arbitrer en V2.

5. **Synchronisation bi-directionnelle** : si Gaël modifie une charge dans l'app, doit-on remonter cette modif dans la fiche knowledge `.md` côté workspace ? Recommandation : **non** en V1 — la fiche reste la source de vérité, l'app log les charges effectives séparément. La synthèse mensuelle Sandra peut suggérer de mettre à jour la fiche après analyse.
