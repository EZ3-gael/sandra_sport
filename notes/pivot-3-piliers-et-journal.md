# Pivot framing "3 piliers santé" + idée journal libre

**Date** : 26-04-23 — 10:23
**Statut** : à creuser (post-V1)
**Source** : conversation Sandra workspace racine

## Contexte

Pendant le développement V1 (en cours), Gaël se questionne sur le positionnement long terme de Sandra Sport. Idée émergente : recadrer l'app non pas comme une "webapp sport" mais comme une **app santé sur 3 piliers** : **sommeil, activité, nutrition** (ou équivalent).

## Ce que ça change vraiment

**Spoiler : pas grand-chose techniquement, beaucoup côté narratif.**

| Pilier | Déjà couvert dans l'archi V1 ? |
|---|---|
| **Sommeil** | ✅ Partiellement — `morning_checkin.sleep_quality` (1 dimension sur 7). À enrichir si pilier à part entière (heure coucher/lever, durée, réveils nocturnes, sieste...) |
| **Activité** | ✅ Cœur de la V1 — tables `sessions` + `session_notes` |
| **Nutrition** | ⏳ Prévu V1.5 — `recipes` + `shopping_lists`. À étendre côté tracking (apports, ressentis post-repas) si vrai pilier |

Donc le pivot est surtout un **re-framing produit** :
- Repenser la nav principale autour des 3 piliers (au lieu de wellness / séances / recettes)
- Repenser le dashboard d'accueil comme une vue 3 piliers consolidée
- Repenser le pitch et la landing (V2) autour de cette promesse santé globale

## Idée nouvelle : journal de notes libres

Gaël aimerait pouvoir **capturer des notes libres** dans l'app (humeur, événements de vie, observations) qui pourraient ensuite **alimenter un journal** consolidé.

**Pourquoi c'est intéressant** :
- Aujourd'hui les notes vivent dispersées : balades vocales (Drive), boîte à idées (`01_Brainstorming/`), questions à traiter, etc.
- Un point de capture rapide depuis le téléphone, à la volée, manque
- Une fois capturées, ces notes pourraient être enrichies/agrégées en journal hebdo/mensuel par Sandra

**Articulation possible avec les 3 piliers** :
- Une note = optionnellement taguée à un pilier (sommeil/activité/nutrition) ou "vie générale"
- Le dashboard pilier affiche les notes récentes liées
- Le journal consolidé recoupe scores + notes + événements

**Articulation possible avec l'écosystème Sandra existant** :
- Notes libres = **complément mobile** au flux balade vocale (qui restera la capture longue/réflexive du matin)
- Sync vers `dev-perso/journaling/` côté workspace pour analyse longue durée
- Ou stockage Supabase + read par Sandra workspace via API/sync inverse

## Questions ouvertes (à trancher en post-V1)

1. **Le re-framing "3 piliers"** mérite-t-il une vraie refonte UX/nav, ou se contenter de réorganiser le dashboard d'accueil V1.5 ?
2. **Sommeil comme pilier autonome** = nouvelle table `sleep_log` (heure coucher/lever, durée, réveils) ou enrichissement de `morning_checkin` ?
3. **Nutrition comme pilier autonome** = au-delà des recettes, faut-il un vrai tracking (carnet alimentaire) ? Ça change l'ampleur du chantier nutrition.
4. **Journal libre** — V1.5 ou V2 ? Quel est le minimum viable (juste capture + liste) vs. version riche (tags, recherche, journal consolidé Sandra) ?
5. **Conflit avec balades vocales** ? Risque de double capture (Gaël ne sait plus où mettre quoi). Définir une règle simple (court à la volée = app, long réflexif = balade).
6. **Impact sur la landing V2** : si la promesse change vers "3 piliers santé", repositionner toute la com produit.

## Décisions provisoires (à confirmer)

- ✅ **Pas toucher au cadrage V1 actuel** — on livre wellness + séances comme prévu ce soir/demain.
- ✅ **Garder cette note comme matière première** pour la rétro post-V1 et le cadrage V1.5.
- ⏳ **Update CLAUDE.md / ROADMAP** : à faire SI le pivot est confirmé après réflexion, pas avant.
- ⏳ **Brainstorm dédié post-V1** : prendre 1h pour trancher les questions ouvertes ci-dessus avant d'attaquer V1.5.

## Lien transverse

- **Sandra Desktop** (boîte à idées workspace, 26-04-23 10:14) : même problème de "centraliser une vue multi-piliers visuelle". Si Sandra Desktop se construit avant V1.5 Sandra Sport, l'expérience UX visuelle des piliers desktop pourrait inspirer la nav mobile.
- **Notes vocales matinales** (workspace) : pipeline existant, à articuler avec capture mobile rapide pour ne pas créer de friction "où je note ça ?".
