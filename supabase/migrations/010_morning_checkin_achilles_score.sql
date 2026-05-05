-- Sandra Sport — Migration 010 : achilles_score sur morning_checkin
--
-- Ajoute un champ dédié pour le score d'auto-éval matinal du tendon d'Achille
-- (échelle 0-10, NULL autorisé). Évite le parsing fragile de `pain_zones` /
-- `notes` côté app pour calculer le streak et déclencher les alertes.
--
-- Sémantique : 0 = aucune douleur, 10 = douleur maximale (inversée par rapport
-- aux 7 dimensions wellness 1-5 où plus c'est haut, mieux c'est).

BEGIN;

ALTER TABLE public.morning_checkin
  ADD COLUMN IF NOT EXISTS achilles_score int
  CHECK (achilles_score IS NULL OR (achilles_score BETWEEN 0 AND 10));

-- Index optionnel : on filtre régulièrement sur (user_id, date) pour le streak.
-- L'index morning_checkin_user_date_idx existant couvre déjà ce cas, pas
-- besoin d'index dédié sur achilles_score.

COMMIT;
