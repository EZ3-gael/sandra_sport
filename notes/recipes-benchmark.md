# Benchmark — Apps meal planning / food-sport (avril 2026)

**Créé** : 2026-04-23
**Contexte** : alimenter `recipes-module.md`. Objectif = comprendre le paysage pour positionner le futur module recettes de sandra_sport.

---

## TL;DR — Ce qu'il faut retenir

1. **Marché saturé** sur le meal planning générique (Mealime, Eat This Much, Yazio, Lifesum, Ollie, Melio, FoodiePrep, SummitPlate, MealChef AI…). La vague d'apps IA-natives 2025-2026 est forte mais indifférenciée.
2. **Angle sport-nutrition** déjà occupé par **Fitia**, **Strongr Fastr**, **UltraFit360**, **Prospre** — mais tous restent dans le registre *macros/calories*. Personne ne fait un coaching narratif "séance → recette → conseils comme Sandra le fait à Gaël".
3. **EverFit** (testé par Gaël) est une **plateforme B2B pour coachs**, pas une app B2C. Complexité normale : c'est fait pour un pro qui gère plusieurs clients. Bon pour étudier les features coaching, pas le modèle distribution.
4. **PlateJoy** — leader de la personnalisation profonde — a **fermé en juillet 2025**. Signal fort que le B2C pur meal planning est difficile à rentabiliser sans *stickiness* supplémentaire.
5. **Jow domine les partenariats courses en France** (Carrefour, Monoprix, Auchan, Leclerc, Intermarché, Chronodrive). Frontal = suicide. Potentielle intégration future via leurs APIs partenaires.
6. **Case vide identifiée** : *"coach narratif humain + adaptation à l'effort physique réel + UX minimaliste FR"*. C'est le positionnement candidat pour sandra_sport.

---

## Fiches concurrents

### 1. EverFit (testé par Gaël)

- **Catégorie** : plateforme B2B coaching fitness + nutrition.
- **Modèle** : SaaS pour coachs sportifs → gèrent leurs clients via l'app.
- **Features nutrition** :
  - 500+ recettes validées par diététiciennes.
  - Meal plans semaine avec macros exactes par repas.
  - AI assistant pour variantes (vegan, low-carb, high-protein).
  - Shopping lists auto-générées.
  - Log 1-tap depuis Recipe Collections (update 2026).
- **Intégrations** : Apple Health, MyFitnessPal, Google Fit, Fitbit, Cronometer, **Garmin, Oura**.
- **Positionnement** : outil de travail pour coachs → effet "complexe" pour Gaël = normal, pas la cible.
- **À retenir** : la richesse des features nutrition + sport (intégration Garmin/Oura notamment). Bon modèle pour le backend, pas pour l'UX client final.

### 2. Fitia — *le plus proche de notre vision*

- **Catégorie** : AI nutrition + body tracking.
- **Origine** : Pérou, international.
- **Features** :
  - Algo basé sur 150+ études scientifiques (fat loss, muscle gain, recomposition).
  - Calcul caloriques adaptés à l'activity level, body composition, objectifs.
  - Tracking body fat, mensurations (taille, hanches, bras, cuisses, torse).
  - Plan adaptatif : détecte les plateaux et ajuste.
  - Log par photo, voix, barcode, manuel.
  - Chat assistant "Fitia Coach" (timing, substitutions, plate building).
- **Intégrations** : sync Apple Health + Health Connect (importe séances, poids, nutrition).
- **Pricing** : freemium, premium ~?/an (à confirmer).
- **À retenir** : c'est le concurrent le plus dangereux sur l'angle "adaptation sport". Ils ont le scientifique et l'adaptatif. Ce qu'ils **n'ont pas** : le coaching narratif humain ("pourquoi ce plat ce soir, voilà ce qu'on ajuste si tu as mal dormi").

### 3. Strongr Fastr

- **Catégorie** : AI nutrition + workouts combinés.
- **Features** :
  - Workout builder avec progressive overload adaptatif.
  - Meal planning AI optimisé sur macros/calories.
  - Macro/calorie tracking + barcode scanner.
  - Régimes : Keto, Paleo, Vegan.
- **Pricing** : workouts + macros gratuits, meal planning premium (~$60/an).
- **À retenir** : approche *"programme fitness + nourriture qui va avec"*, très mécanique. Peu d'âme narrative.

### 4. UltraFit360

- **Catégorie** : tout-en-un IA (meal + workouts + photos progression + coach reports).
- **Features** : AI meal logging, structured workouts, progress photo analysis, Apple Health sync, weekly "Coach's Corner" qui connecte nutrition + training + santé.
- **Pricing** : gratuit (monétisation à creuser).
- **À retenir** : l'idée du *weekly report narratif* qui lie tous les volets est bonne. À s'inspirer pour Sandra.

### 5. Prospre

- **Catégorie** : meal planning macros-first.
- **Cible** : bodybuilders, athlètes de force, compétiteurs fitness.
- **À retenir** : niche macros pure. Pas notre angle (trop technique, pas de narratif).

### 6. Jow — *la référence FR*

- **Catégorie** : meal planning + courses 1-clic.
- **Modèle** : gratuit, meals à partir de 1,45€/portion.
- **Partenaires FR** : **Carrefour, Monoprix, Auchan, Leclerc, Intermarché, Chronodrive** (maillage très dense).
- **Features** :
  - Recettes "family-friendly" simples et rapides.
  - Smart cart optimization (économie moyenne ~10%).
  - Listes de courses automatiques.
  - Options vegan/végé/sans gluten.
- **Levées** : $27M cumulés.
- **Ce qu'ils n'ont pas** : zéro intégration sport. Zéro tracking effort. Zéro coaching nutrition lié à une séance. Angle 100% "dîner famille qui cuisine 15 min".
- **À retenir** : bataille frontale perdue. Mais leur position sur les partenariats grande distribution = **impossible à rattraper à court terme**. À terme, étudier s'ils ouvrent des APIs ou s'il existe d'autres rails (Chronodrive direct API, Barbora, etc.).

### 7. Mealime

- **Catégorie** : meal planning minimaliste B2C.
- **Features** : meal planning simple, UX mobile soignée, grocery lists.
- **Pricing** : freemium, premium ~$9.99/mois.
- **À retenir** : benchmark UX minimaliste. "Simple, efficace, je prends".

### 8. Eat This Much — *CNN #1 en 2026*

- **Catégorie** : meal planning calorie-first.
- **Features** : génération quotidienne/hebdo sur target calories + préférences + budget. 200+ options perso.
- **Pricing** : freemium, premium ~$9.99/mois.
- **À retenir** : fort sur la personnalisation, mais reste centré objectif "perte de poids" → pas sport-performance.

### 9. Yazio — *référence européenne*

- **Catégorie** : calorie tracker + meal planning.
- **Origine** : Allemagne.
- **Features** :
  - 3000+ recettes (Yazio Pro).
  - Food database européen localisé (produits FR, DE, ES, IT).
  - Tracking humeur, intolérances, cycles (femmes), allaitement, médicaments.
  - Jeûne intermittent.
- **Pricing** : Pro à **$39.99/an** (très compétitif).
- **À retenir** : meilleur rapport qualité/prix du marché européen. Food DB localisé = actif rare. Pas d'angle sport intégré en natif.

### 10. Lifesum

- **Catégorie** : tracking + recettes holistique.
- **Origine** : Suède.
- **Features** :
  - 12 programmes diététiques (keto, Méditerranéen, jeûne, Paléo, Sugar Detox, plant-based).
  - "Life Score" — évaluation santé globale > juste calories.
  - Recipe library étendue.
- **Pricing** : $99.99/an.
- **À retenir** : positionnement "lifestyle/wellness" premium. Cher et segmentant.

### 11. PlateJoy — *CLOSÉ*

- **Statut** : **shut down juillet 2025**, acquis par RVO Health.
- **Héritage** : algo personnalisation à 50 data points, 14+ régimes, intégration Instacart + Amazon Fresh.
- **À retenir** : l'un des plus personnalisés du marché **n'a pas tenu économiquement** en B2C pur. Signal d'alerte sur le modèle économique. Peut vouloir dire : soit intégrer une dimension "collante" (sport, social, contenu), soit rester une feature d'une app plus large (comme sandra_sport).

### 12. MyFitnessPal

- **Catégorie** : calorie tracker historique → a ajouté meal planning.
- **À retenir** : réservoir d'utilisateurs énorme. À considérer uniquement en cas d'intégration (import de données), pas en concurrence directe.

### 13. Nouvelle vague IA 2025-2026 (rapide)

| App | Angle | À noter |
|---|---|---|
| **Ollie** | Famille, grocery list par rayon | "Learning" sur les préférences réelles |
| **FoodiePrep** | Régimes larges (vegan/keto/halal/kosher/FODMAP) | Bon sur l'inclusivité régimes |
| **Melio** | Multi-participants, mode hybride parents/enfants | Niche famille intéressante |
| **SummitPlate** | Comparateur d'AI meal planners | Meta-player |
| **MealChef AI**, **MealThinker** | AI meal plan généraliste | Forte concurrence, peu différenciés |

### 14. Apps niche adjacentes

- **Foodient** : scanner allergies/intolérances produits. Angle **safety-first**, à étudier si on pousse fort sur la dimension allergie.
- **Yuka** : scan produit (pas meal planning). Référence UX "scan et comprends".

---

## Insights transversaux

### Ce que tout le monde a déjà

- Meal planning hebdo avec régimes multiples.
- Grocery list auto.
- Barcode scan + logging calories/macros.
- Sync Apple Health / Health Connect.
- Recipe library 500-3000 items.
- AI variants (swap ingrédients selon préférences/allergies).

### Ce qui est mal fait

- **Allergies traitées comme métadonnées** et pas comme contraintes de sécurité (risque utilisateur réel).
- **Angle narratif humain** quasi absent. Tout est tableau, graphique, macro. Personne ne *parle* à l'utilisateur comme Sandra parle à Gaël.
- **Lien séance-réelle → recette** se limite à "tu as dépensé X kcal, reprends Y". Aucun ne fait *"tu as fait une séance RPE 8 ce matin, tu as mal dormi, ce soir on mise sur X parce que Y"*.
- **UX FR native** : presque aucune app non-FR n'a de food DB / recettes culturellement adaptées. Jow le fait mais sans sport. Yazio le fait un peu (DB localisée).

### Cases vides / opportunités

1. **Coach narratif sport-nutrition** → sandra_sport pourrait être *"la première app qui te parle comme un vrai coach, pas comme un tableur"*.
2. **Adaptation à l'état physique réel** (RPE, sommeil, humeur, douleurs) et pas seulement à l'objectif théorique.
3. **FR native avec contenu culturel** (produits locaux, saisonnalité FR, recettes FR).
4. **Safety-first sur les allergies** (angle différenciateur clair).
5. **Module intégré à une app sport** (modèle V2 de sandra_sport) → plus collant qu'un meal planner isolé. PlateJoy a fermé car pas assez sticky en solo.

---

## Implications pour sandra_sport

### Ce qu'on peut prendre

- **Yazio** : food DB européen comme référence de qualité / coverage.
- **Fitia** : logique adaptative (plateau detection, scientifique basé études).
- **EverFit** : structure du modèle de données (recettes, meal plans, intégrations trackers).
- **UltraFit360** : pattern "weekly report narratif" qui lie nutrition + sport + bien-être.
- **Mealime** : benchmark UX minimaliste.
- **Jow** : référence benchmark sur courses (vision long terme, pas compétition frontale).

### Ce qu'on doit absolument ne pas faire comme eux

- Ne pas faire un énième tableur de macros (Prospre, Strongr Fastr).
- Ne pas faire du générique IA-natif sans angle propre (Ollie, FoodiePrep, Melio sont déjà là).
- Ne pas traiter les allergies comme optional (Foodient l'a bien identifié comme problème).
- Ne pas viser seulement la perte de poids (Eat This Much le fait déjà très bien).

### Positionnement candidat pour le module recettes sandra_sport

> *"La seule app qui te propose un dîner calibré sur ta séance de demain et ton ressenti de ce matin, avec un vrai coach qui t'explique pourquoi — pas un tableau de macros."*

**Piliers** :
1. **Narratif humain** (comme Sandra parle à Gaël).
2. **Lien sport réel → recette** (pas juste objectif théorique).
3. **FR native** (produits, saisonnalité, culture).
4. **Safety allergies** sérieuse.
5. **Intégré à sandra_sport** (module, pas app séparée → plus sticky).

### Question stratégique qui reste à trancher

Est-ce qu'on reste **module dans sandra_sport** (option 1 du brainstorm initial), ou on spin-off plus tard en **app séparée** (`sandra_food` ou autre) ?

**Argument pour rester module** : PlateJoy a fermé. Le meal planner en solo n'est pas sticky. Un module lié à une app sport/santé = plus de rétention.

**Argument pour spin-off** : marché meal planning adressable >> marché app sport-santé perso. Si le module marche bien sur Gaël + early users, il peut viser une audience 10-100x plus large que sandra_sport.

→ À creuser quand on aura une première version qui tourne sur toi.

---

## Sources

### Benchmark apps

- [EverFit — Introducing Meal Plans and Recipes](https://blog.everfit.io/introducing-meal-plans-and-recipes-nutrition-coaching-made-easy)
- [EverFit — Nutrition Coaching](https://everfit.io/nutrition/)
- [EverFit — March 2026 Features](https://blog.everfit.io/march-2026-everfit-new-features)
- [EverFit — January 2026 Updates](https://blog.everfit.io/everfit-january-2026-updates)
- [EverFit Review 2026 — promealplan](https://www.promealplan.com/en/blog/everfit-review-2026)
- [Fitia — Features](https://fitia.app/features/)
- [Fitia — Are AI Meal Planning Apps Worth It in 2026](https://fitia.app/learn/article/ai-meal-planning-apps-worth-it-2026/)
- [Fitia — Top 12 Nutrition Tracking Apps 2026](https://fitia.app/learn/article/top-12-nutrition-tracking-apps-2026/)
- [Strongr Fastr](https://www.strongrfastr.com/)
- [Strongr Fastr — aitools.inc](https://aitools.inc/tools/strongr-fastr)
- [Jow — Google Play](https://play.google.com/store/apps/details?id=com.wishop.dev.jow)
- [Jow — Sifted article Series A](https://sifted.eu/articles/jow-series-a)
- [Jow — TechCrunch Series A $20M](https://techcrunch.com/2021/10/12/jow-raises-20-million-for-its-meal-and-grocery-planning-service/)
- [PlateJoy vs Mealime vs eMeals — Fin vs Fin](https://finvsfin.com/platejoy-vs-mealime-vs-emeals/)
- [Best PlateJoy Alternative (shutdown July 2025) — MealThinker](https://mealthinker.com/blog/platejoy-alternative)
- [PlateJoy Review 2026 — DeliveryRank](https://www.deliveryrank.com/reviews/platejoy)
- [Yazio Review 2026 — calorie-trackers.com](https://calorie-trackers.com/reviews/yazio/)
- [Yazio Pricing 2026 — NutriScan](https://nutriscan.app/blog/posts/yazio-pricing-2026-free-vs-pro-what-pro-unlocks-33b26f8fc7)
- [Lifesum — App Store](https://apps.apple.com/us/app/lifesum-ai-calorie-counter/id286906691)

### Panoramas 2026

- [Best AI Meal Planning Apps 2026 — Melio](https://meal-plan.app/en/resources/guides/best-ai-meal-planning-apps/)
- [Best AI Fitness Apps 2026 — welling.ai](https://www.welling.ai/articles/best-ai-fitness-apps)
- [Best AI Fitness Apps 2026 — Gymscore](https://www.gymscore.ai/best-ai-fitness-apps-2026/)
- [10 Best Meal Planning Apps 2026 — Eat This Much blog](https://blog.eatthismuch.com/best-meal-planning-apps/)
- [Best AI Meal Planner 2026 — SummitPlate](https://www.summitplate.com/best-ai-meal-planner)
- [Best Meal Planning Apps 2026 — Ollie](https://ollie.ai/2025/10/21/best-meal-planning-apps-in-2025/)
- [Best for Families 2026 — Ollie](https://ollie.ai/2025/10/29/best-meal-planning-apps-2025/)
- [10 Best Meal Planning Apps 2026 — FoodiePrep](https://www.foodieprep.ai/blog/meal-planning-apps-in-2026-which-tools-actually-simplify-your-kitchen)
- [Best AI for Recipes 2026 — FoodiePrep](https://www.foodieprep.ai/blog/discover-the-best-ai-for-recipes-a-foodieprep-guide)
- [9 Best Diet Apps 2026 — Brocoders](https://brocoders.com/blog/diet-apps-nutrition-trackers/)
- [6 Apps People Are Using in 2026 — CrispNG](https://crispng.com/6-apps-that-can-help-you-eat-healthier-every-week/)

### Allergies / Safety

- [AI-Powered Allergen Detection — IJRISS paper](https://rsisinternational.org/journals/ijriss/view/ai-powered-personalized-allergen-detection-and-recipe-modification-tool-for-safer-meal-preparation)
- [Foodient — AI Food Scanner for Allergies](https://www.foodient.app/)
- [Why AI recipe apps keep suggesting allergies — Alibaba insights](https://www.alibaba.com/product-insights/why-does-my-ai-powered-recipe-app-keep-suggesting-dishes-i-m-allergic-to.html)
