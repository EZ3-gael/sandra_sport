# Module Recettes — Brainstorm

**Créé** : 2026-04-23
**Statut** : brainstorm ouvert, pas d'engagement roadmap
**Scope actuel dans `CLAUDE.md`** : "consulter recettes" (V1.5, simple). Ce brainstorm décrit une vision beaucoup plus large — probable V2 ou module à part entière.

---

## Vision

App de recettes pensée pour un sportif, adaptée à sa pratique :

- Catalogue de recettes personnalisé en fonction des goûts, allergies, allergènes.
- Adaptation IA selon les séances de sport prévues (avant/après, type d'effort, objectif).
- Planification des repas de la semaine.
- Liste de courses optimisée générée automatiquement.
- Long terme : partenariats supermarchés → courses en 1 clic.
- UX minimaliste, belle, donne envie de manger.
- Chaque recette = conseils / commentaires (comme Sandra le fait pour Gaël : pourquoi ce plat à ce moment, quoi ajuster si on a couru le matin, etc.).

## Différenciation potentielle

L'angle fort et quasi inexploité : **"recettes calibrées sur ton effort physique"**.

- Jow, Mealime, PlateJoy font du meal planning généraliste.
- MyFitnessPal fait du tracking calories sans vraie recommandation créative.
- Whoop / Oura recommandent du sommeil mais pas des recettes.
- Personne ne lie vraiment *"RPE de ce matin + séance de demain → ton dîner ce soir"*.

C'est le moat potentiel — tout le reste (liste courses, photos, meal planning) existe déjà ailleurs.

## Décisions préliminaires

### Photos des recettes (validé 2026-04-23)

- Génération IA **en amont** (côté équipe), pas en temps réel.
- **Vérification humaine** avant publication au catalogue.
- Style guide unifié à définir : lumière, angle, type d'assiette, ambiance. Éviter l'effet patchwork.
- Génération en temps réel pour les recettes personnalisées : à tester *après* validation du catalogue de base.

### Technique (pré-décisions, à confirmer)

- Stockage images : **Supabase Storage**, bucket `recipes-images`, public read, upload via `service_role`.
- Schéma : `recipes.image_url` + `recipes.image_prompt` (pour reproductibilité / régénération future).
- Outil génération : Nanobanana / Gemini 2.5 Flash Image → **vérifier licence commerciale** au moment de la V2 (ça bouge vite chez Google).
- Prompts versionnés dans le repo.

## Benchmark

**Fait le 2026-04-23** — fiche complète dans [`recipes-benchmark.md`](./recipes-benchmark.md).

### Conclusions clés

1. **Marché saturé** sur le meal planning générique. Vague d'apps IA-natives 2025-2026 nombreuses et indifférenciées (Ollie, FoodiePrep, Melio, SummitPlate, MealChef AI…).
2. **Angle sport-nutrition** déjà occupé par **Fitia** (le plus dangereux, adaptatif scientifique), **Strongr Fastr**, **UltraFit360**, **Prospre** — mais tous restent dans le registre *macros/calories*. Aucun coaching narratif humain.
3. **EverFit** (testé par Gaël) = plateforme **B2B pour coachs**, pas B2C. Sa complexité est normale, il n'est pas la cible de Gaël utilisateur final.
4. **PlateJoy a fermé en juillet 2025** (acquis par RVO Health). Signal : le meal planner B2C pur est difficile à rentabiliser. Argument fort pour rester **module intégré à sandra_sport** (plus sticky) vs app séparée.
5. **Jow domine les partenariats courses en France** (Carrefour, Monoprix, Auchan, Leclerc, Intermarché, Chronodrive). Bataille frontale impossible. Aucune intégration sport chez eux = fenêtre pour nous.
6. **Yazio** (DE, 39€/an, food DB européen FR/DE/ES/IT) = meilleur rapport qualité/prix du marché européen, benchmark à connaître.

### Cases vides identifiées

- Coach **narratif humain** sport-nutrition (tout le monde fait des tableaux de macros, personne ne *parle*).
- Adaptation à l'**état physique réel** (RPE, sommeil, humeur, douleurs) et pas seulement à l'objectif théorique.
- **FR native** avec contenu culturel (produits locaux, saisonnalité, recettes FR).
- **Safety-first sur les allergies** (la plupart traitent ça comme métadonnée optionnelle).
- **Module intégré à une app sport** (plus collant qu'un meal planner solo — leçon PlateJoy).

### Positionnement candidat

> *"La seule app qui te propose un dîner calibré sur ta séance de demain et ton ressenti de ce matin, avec un vrai coach qui t'explique pourquoi — pas un tableau de macros."*

5 piliers : narratif humain + lien sport réel → recette + FR native + safety allergies + intégré à sandra_sport.

### Questions ouvertes

- **Sourcing du catalogue de base** : on part de zéro ? on licencie une base (type Spoonacular, Edamam) ? on scrape ? on génère IA ?
- **Modèle de données recette** : ingrédients structurés (quantités, unités, substituts) vs texte libre ? Impact énorme sur la liste de courses.
- **Adaptation effort → recette** : règle déterministe (séance intense → +glucides) ou IA générative ? Commencer simple.
- **Objectifs utilisateur** : perte de poids, prise de masse, endurance, santé. Jusqu'où on personnalise ?
- **Régimes / intolérances** : gluten, lactose, végétarien, vegan, FODMAP, etc. — MVP = combien ?
- **Scope V1 réaliste vs V2 ambitieuse** : quoi livrer dans `sandra_sport` vs quoi réserver à un projet à part ?
- **Partenariats supermarchés** : Jow a mis ~4 ans à négocier Carrefour. Vision long terme, pas roadmap.

### Scope — 3 options à arbitrer

1. **Module V2 de `sandra_sport`** — intégré à l'app sportive, lien natif avec les séances. Plus cohérent pour Gaël perso, moins autonome.
2. **Projet à part (`sandra_food` ?)** — app dédiée, cible plus large, commercialisable séparément. Plus gros effort, plus de potentiel.
3. **Hybride** — module dans `sandra_sport` pour Gaël / early users sport, puis spin-off si traction.

## Prochaines étapes

- [x] Benchmark structuré (fait 2026-04-23, voir [`recipes-benchmark.md`](./recipes-benchmark.md)).
- [ ] **Creuser Fitia** (concurrent le plus proche) : s'inscrire, tester, documenter les manques.
- [ ] **Creuser EverFit côté client** (app mobile, même si c'est B2B côté modèle) : comprendre ce que voit le sportif final.
- [ ] Trancher sourcing catalogue (licence d'une base type Spoonacular/Edamam vs génération IA vs hybride vs rédaction manuelle).
- [ ] Définir modèle de données `recipes` + `ingredients` (V2 draft schema).
- [ ] Tester génération photos (5-10 recettes, 3 styles différents) → choisir style guide.
- [ ] Arbitrer scope (option 1 module V2 sandra_sport / option 2 spin-off / option 3 hybride).
  - Argument actuel penchant pour **option 1** : leçon PlateJoy = meal planner solo pas sticky.

## Historique du brainstorm

- **2026-04-23** — Ouverture. Idée déposée par Gaël. Tradeoffs identifiés : scope vs V1 actuel, piège photos IA (résolu → génération amont + validation humaine), partenariats supermarchés = vision long terme. Confirmation que le brainstorm va dans `sandra_sport/notes/` et non dans le workspace `01_Brainstorming/` (règle : projet existant → `notes/` projet).
- **2026-04-23** — Benchmark complet fait (13 apps + nouvelle vague IA). Gaël avait testé EverFit (jugé trop complexe) — clarifié : c'est une plateforme B2B pour coachs, pas un concurrent direct d'une app B2C. Découverte majeure : **PlateJoy a fermé en juillet 2025**, signal que le meal planner solo n'est pas sticky → argument pour garder le module intégré à sandra_sport. Positionnement candidat identifié (coach narratif + sport réel + FR + safety allergies). Voir [`recipes-benchmark.md`](./recipes-benchmark.md).
