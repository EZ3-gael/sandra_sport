# Feature — RPE conseillé par section + slider ressenti

**Créé** : 2026-04-23
**Statut** : spec ouverte, à intégrer dans V1.5 ou V2
**Source** : conversation Sandra workspace racine, 2026-04-23

## Idée

Chaque section du protocole de séance (ex: Échauffement, Corps de séance, Récup, Post-séance) porte un **RPE conseillé** par Sandra au moment de la planification. L'athlète saisit son **RPE ressenti** sur cette section via un **curseur** (slider), pas des boutons cliquables.

**Double valeur** :
1. **Guide en amont** — l'athlète sait quelle intensité viser sur chaque bloc (cohérence pédagogique, évite de bourriner sur l'échauffement).
2. **Signal en aval** — le delta entre RPE ressenti et RPE conseillé est un marqueur précieux :
   - Ressenti >> conseillé sur plusieurs séances → fatigue accumulée, adapter la charge.
   - Ressenti << conseillé → forme du jour bonne, on peut pousser la séance suivante.
   - Sur la journée : recoupement avec wellness matinal + Body Battery Garmin + sommeil.

## Spec UI

### Curseur unique par section, pas de boutons cliquables

- **Curseur (slider)** de 1 à 10, **crans entiers uniquement** (snapping). Pas de valeur 2.5 possible, le curseur s'aimante sur chaque entier.
- Orientation horizontale, pleine largeur de la carte section sur mobile.
- Labels aux extrémités : "1 très facile" / "10 max".

### Jauge bicolore visualisant le RPE conseillé

- De 1 jusqu'au RPE conseillé (inclus) → couleur **claire / pâle** (zone "recommandée").
- Du RPE conseillé+1 jusqu'à 10 → couleur **normale / soutenue** (zone "au-delà de la consigne").
- Un **marqueur distinct** (trait vertical, pictogramme, icône coach) sur la valeur conseillée, avec tooltip au tap : *"Sandra recommande 7/10 pour cette section."*
- La poignée du curseur (position actuelle choisie par l'athlete) est stylée distinctement du marqueur conseillé.

### Cohérence avec le reste de l'app

**Règle transverse à appliquer progressivement** : **toutes les saisies de RPE dans l'app passent de boutons cliquables à des sliders**.

Concrètement, les endroits à refacto quand on déploiera ce pattern :
- `/sessions/[id]` form ressenti post-séance — RPE (1-10) + énergie post (1-5) → sliders avec snap entiers.
- `/wellness` — les 7 dimensions 1-5 → à étudier, le snap à 5 crans peut être plus fluide visuellement en curseur qu'en 5 boutons, à tester UX.

Pour les échelles 1-5, valider UX : un curseur avec 5 crans peut sembler overkill vs 5 boutons. L'argument pour l'homogénéité : tous les sliders = 1 geste du pouce au même endroit de l'écran. À arbitrer.

## Spec data

### Dans le `.md` de séance (source workspace)

Ajouter dans le frontmatter YAML de chaque section un champ `rpe_guidance` :

```yaml
---
date: 2026-05-15
title: Course 7x1/1 + velo Z1
sections_rpe_guidance:
  echauffement: 3
  course-tapis: 7
  velo-z1-recup: 2
---
```

Ou plus robuste : dans le body markdown, une ligne dédiée par section H2/H3 :

```markdown
### 2. Course tapis (15 min)

**RPE conseillé : 7/10** (effort soutenu, controlable)

- 7 x 1 min course / 1 min marche
- Allure 12 km/h, cadence 170 spm
```

Le module `session_parser.py` (utilisé par `session_sync.py`) parse la mention "RPE conseillé : N/10" et l'ajoute dans le JSON `protocol.sections[i].rpe_guidance = N`.

### Dans Supabase

**Ajouter dans `sessions.protocol`** la clé `rpe_guidance` par section :

```json
{
  "sections": [
    {
      "id": "course-tapis",
      "title": "2. Course tapis",
      "type": "checklist",
      "rpe_guidance": 7,
      "items": [...]
    }
  ]
}
```

**Nouvelle table** `session_section_rpe` pour stocker le ressenti :

```sql
CREATE TABLE public.session_section_rpe (
  id uuid PK,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  rpe_felt int NOT NULL CHECK (rpe_felt BETWEEN 1 AND 10),
  captured_at timestamptz DEFAULT now(),
  UNIQUE (session_id, section_id, user_id)
);
```

RLS policies classiques (user_id = auth.uid()).

## Implémentation technique (slider)

- Pas de lib externe lourde. Un `<input type="range" min="1" max="10" step="1">` natif suffit comme base.
- Style custom Tailwind + une fine couche CSS pour :
  - Track bicolore (background gradient dynamique selon valeur conseillée — CSS custom property `--rpe-guidance`).
  - Snap entiers (step="1" natif).
  - Poignée large pour le touch (min 44x44 px pour accessibilité mobile).
  - Marqueur conseillé (un pseudo-element `::after` positionné en absolute selon `--rpe-guidance`).

Composant `<RpeSlider>` réutilisable, props :
- `guidance: number` (le RPE conseillé, affiche le marqueur et la zone pâle).
- `value: number | null` (la valeur sélectionnée par l'user).
- `onChange: (v: number) => void`.
- `max: number` (10 pour RPE, 5 pour wellness si on unifie).

## Analyse data (post-exécution — rôle Sandra)

Quand Sandra debriefe une séance ou une période :

- **Delta moyen** `ressenti - conseillé` sur N séances → signal fatigue si positif persistant.
- **Variance du delta** entre sections → incohérence de gestion de l'intensité (l'athlète pousse l'échauffement ou épargne le corps).
- **Corrélation avec wellness matinal** : quand sommeil < 3/5, les RPE ressentis sont-ils mécaniquement plus élevés que conseillés ?
- **Courbe par mésocycle** : le même type de séance devient-il plus facile au fil des semaines (ressenti descend vers conseillé → progression) ou l'inverse (overtraining) ?

## Questions ouvertes

1. **Unifier sliders partout ou garder boutons pour les petites échelles (1-5)** ? Test UX à faire sur `/wellness`.
2. **Valeur NULL autorisée** sur le RPE ressenti par section (l'user ne saisit pas) ? **Oui** — suivre la règle workspace "ne jamais inventer un score".
3. **Si `rpe_guidance` absent du .md**, comportement par défaut du slider ? Sans marqueur, jauge unicolore.
4. **Historique du RPE conseillé** : Sandra peut-elle ajuster le conseil d'une séance passée ? → Normalement non, c'est la consigne au moment T. On ne ré-écrit pas le planning.
5. **Un seul RPE global séance vs RPE par section** : on garde les deux ? Le RPE global reste dans le form ressenti post-séance (agrégé), les RPE par section sont plus fins.
6. **Affichage historique** : quand on re-visite une séance, afficher les RPE ressentis cochés + le conseillé en parallèle (delta visible). Vue compacte à designer.

## Où l'intégrer dans la ROADMAP

À insérer **en V1.5a ou V1.5b** (avant ouverture B2C V2). Raisons :

- Feature pédagogique que Gaël expérimente comme utilisateur final.
- Génère de la data utile pour le coach IA V4 (le RPE par section est un signal riche).
- Pas critique pour la V2 publique, peut arriver en V2.5 si V2 trop chargée.

**Proposition de placement** : dans la ROADMAP.md, ajouter un bloc V1.5a1 ou V1.5e :

```markdown
### V1.5e — RPE conseillé par section + sliders unifiés

- [ ] Ajout `rpe_guidance` dans le protocole des .md séance + parsing script sync
- [ ] Migration 006 : table `session_section_rpe`
- [ ] Composant `<RpeSlider>` natif Tailwind avec track bicolore
- [ ] Refacto RPE post-séance global pour utiliser le nouveau composant
- [ ] Test A/B wellness 1-5 : curseur ou boutons ? Laisser en boutons si pas concluant.
- [ ] Vue analyse delta conseillé/ressenti dans le debrief (V1.5 ou V2)

Ref : [`notes/rpe-guidance-per-section.md`](./notes/rpe-guidance-per-section.md)
```

À valider avec Gaël quand il mergera la note avec la ROADMAP.

## Lien transverse

- **Sandra workspace** (coaching Gaël actuel) : dès que la feature est en prod, Sandra lit `session_section_rpe` via MCP Supabase et l'intègre dans les bilans hebdo (*"RPE moyen sur échauffement : 4/10 vs conseillé 3/10 → bon, pas de sur-sollicitation à froid"*).
- **Notes vocales matinales** : le ressenti de fatigue verbatim ("jambes lourdes") recoupe avec un RPE matinal élevé sur la dernière séance.
- **Coach IA V4** : quand il générera des plans, il devra mettre le `rpe_guidance` par section dans les .md générés. Partie du prompt template à designer.
