-- Sandra Sport — Migration 012 : verdict auto-synthèse (Achille + ressenti)
--
-- Objectif : ajouter sur achilles_morning_eval et morning_checkin deux colonnes
-- générées (verdict + verdict_message) calculées en base via des fonctions SQL
-- immutables. L'app et Sandra (côté sport-health) lisent les MÊMES colonnes —
-- zéro divergence entre l'analyse affichée et l'analyse utilisée pour le coaching.
--
-- Sources métier :
--   - sport-health/CLAUDE.md (règles Go/No-Go HSR)
--   - sport-health/knowledge/protocoles/auto-eval-tendon-achille-matin.md
--
-- Règle Achille (révision 06/05/2026) — abandonne le critère 'score_max ≥ 3' :
--   - GREEN  : tous les tests fonctionnels propres (raises ≤ 3, palpation ≤ 3,
--              heel-off ≤ 3) ET three_steps ≤ 5. La raideur matinale modérée
--              (morning stiffness chronique) ne bloque pas le HSR.
--   - AMBER  : un test fonctionnel intermédiaire (4-5/10) OU three_steps 6-7.
--   - RED    : raises_quality='impossible' OU un test fonctionnel ≥ 6 OU
--              three_steps ≥ 8.
--
-- Règle ressenti (morning_checkin, hiérarchique, premier matché gagne) :
--   - BASSE     : ≥ 3 dimensions ≤ 2 OU physical_comfort = 1.
--   - DOULEUR   : physical_comfort ≤ 2 (sans BASSE).
--   - MENTAL    : axe mental/humeur/motivation/calme bas ET physique OK.
--   - OPTIMAL   : toutes dimensions ≥ 4.
--   - VIGILANCE : reste.
--
-- Décisions techniques :
--   - GENERATED ALWAYS AS ... STORED (recalculé à chaque INSERT/UPDATE).
--   - Fonctions SQL pures IMMUTABLE (prérequis pour GENERATED STORED).
--   - COALESCE des entrées NULL avec une valeur "neutre" pour éviter les
--     déclenchements faussés par des saisies partielles.
--   - Si toutes les mesures principales sont NULL → verdict NULL.

BEGIN;

-- =============================================================================
-- 1. Fonctions Achille
-- =============================================================================

CREATE OR REPLACE FUNCTION public.compute_achilles_verdict(
  p_three_steps  int,
  p_ten_raises   int,
  p_palpation    int,
  p_heel_off_pain int,
  p_raises_quality text
) RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_three_steps IS NULL
      AND p_ten_raises IS NULL
      AND p_palpation IS NULL
    THEN NULL
    WHEN p_raises_quality = 'impossible' THEN 'RED'
    WHEN COALESCE(p_three_steps, 0)   >= 8 THEN 'RED'
    WHEN COALESCE(p_ten_raises, 0)    >= 6 THEN 'RED'
    WHEN COALESCE(p_palpation, 0)     >= 6 THEN 'RED'
    WHEN COALESCE(p_heel_off_pain, 0) >= 6 THEN 'RED'
    WHEN COALESCE(p_three_steps, 0)   >= 6 THEN 'AMBER'
    WHEN COALESCE(p_ten_raises, 0)    >= 4 THEN 'AMBER'
    WHEN COALESCE(p_palpation, 0)     >= 4 THEN 'AMBER'
    WHEN COALESCE(p_heel_off_pain, 0) >= 4 THEN 'AMBER'
    ELSE 'GREEN'
  END;
$$;

CREATE OR REPLACE FUNCTION public.compute_achilles_message(
  p_three_steps  int,
  p_ten_raises   int,
  p_palpation    int,
  p_heel_off_pain int,
  p_raises_quality text
) RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE public.compute_achilles_verdict(
                p_three_steps, p_ten_raises, p_palpation,
                p_heel_off_pain, p_raises_quality)
    WHEN 'GREEN' THEN
      'Tendon dans une fenêtre de tolérance correcte. HSR autorisé en pleine prescription. Surveille la réaction au réveil J+1.'
    WHEN 'AMBER' THEN
      'Tendon réactif. HSR adapté aujourd''hui : 3 séries au lieu de 4, charge -2 kg, RPE plafonné à 7. Si le signal s''aggrave J+1, on passe en repos.'
    WHEN 'RED' THEN
      'Tendon irrité. HSR annulé aujourd''hui. Bascule vélo Z1 30 min, FC < 100 bpm. Refais l''auto-éval demain matin.'
    ELSE NULL
  END;
$$;


-- =============================================================================
-- 2. Colonnes générées Achille
-- =============================================================================

ALTER TABLE public.achilles_morning_eval
  ADD COLUMN verdict text GENERATED ALWAYS AS (
    public.compute_achilles_verdict(
      score_three_steps, score_ten_raises, score_palpation,
      bonus_heel_off_pain, raises_quality
    )
  ) STORED;

ALTER TABLE public.achilles_morning_eval
  ADD COLUMN verdict_message text GENERATED ALWAYS AS (
    public.compute_achilles_message(
      score_three_steps, score_ten_raises, score_palpation,
      bonus_heel_off_pain, raises_quality
    )
  ) STORED;


-- =============================================================================
-- 3. Fonctions Ressenti
-- =============================================================================

CREATE OR REPLACE FUNCTION public.compute_subjective_verdict(
  p_sleep      int,
  p_physical   int,
  p_mental     int,
  p_mood       int,
  p_motivation int,
  p_calm       int,
  p_comfort    int
) RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    -- Aucune dimension saisie -> pas de verdict
    WHEN p_sleep IS NULL AND p_physical IS NULL AND p_mental IS NULL
     AND p_mood IS NULL AND p_motivation IS NULL AND p_calm IS NULL
     AND p_comfort IS NULL
    THEN NULL

    -- BASSE : signal fort ou multi-signaux
    WHEN p_comfort = 1 THEN 'BASSE'
    WHEN (
      (CASE WHEN COALESCE(p_sleep, 5)      <= 2 THEN 1 ELSE 0 END) +
      (CASE WHEN COALESCE(p_physical, 5)   <= 2 THEN 1 ELSE 0 END) +
      (CASE WHEN COALESCE(p_mental, 5)     <= 2 THEN 1 ELSE 0 END) +
      (CASE WHEN COALESCE(p_mood, 5)       <= 2 THEN 1 ELSE 0 END) +
      (CASE WHEN COALESCE(p_motivation, 5) <= 2 THEN 1 ELSE 0 END) +
      (CASE WHEN COALESCE(p_calm, 5)       <= 2 THEN 1 ELSE 0 END) +
      (CASE WHEN COALESCE(p_comfort, 5)    <= 2 THEN 1 ELSE 0 END)
    ) >= 3 THEN 'BASSE'

    -- DOULEUR : inconfort physique sans atteindre BASSE
    WHEN COALESCE(p_comfort, 5) <= 2 THEN 'DOULEUR'

    -- MENTAL : un axe mental bas, physique solide par ailleurs
    WHEN (COALESCE(p_mental, 5) <= 2
          OR COALESCE(p_mood, 5) <= 2
          OR COALESCE(p_motivation, 5) <= 2
          OR COALESCE(p_calm, 5) <= 2)
         AND COALESCE(p_physical, 0) >= 4
         AND COALESCE(p_comfort, 0)  >= 4
    THEN 'MENTAL'

    -- OPTIMAL : toutes les dimensions saisies sont >= 4
    WHEN COALESCE(p_sleep, 5)      >= 4
     AND COALESCE(p_physical, 5)   >= 4
     AND COALESCE(p_mental, 5)     >= 4
     AND COALESCE(p_mood, 5)       >= 4
     AND COALESCE(p_motivation, 5) >= 4
     AND COALESCE(p_calm, 5)       >= 4
     AND COALESCE(p_comfort, 5)    >= 4
    THEN 'OPTIMAL'

    -- VIGILANCE : tout le reste (état moyen, signaux modérés)
    ELSE 'VIGILANCE'
  END;
$$;

CREATE OR REPLACE FUNCTION public.compute_subjective_message(
  p_sleep      int,
  p_physical   int,
  p_mental     int,
  p_mood       int,
  p_motivation int,
  p_calm       int,
  p_comfort    int
) RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE public.compute_subjective_verdict(
                p_sleep, p_physical, p_mental, p_mood,
                p_motivation, p_calm, p_comfort)
    WHEN 'OPTIMAL' THEN
      'Forme générale au top. Le robinet est ouvert : séance intensive autorisée, focus performance.'
    WHEN 'VIGILANCE' THEN
      'État correct mais sans réserve. Intensité modérée privilégiée, bonne occasion pour soigner la récup, l''hydratation et le sommeil de la nuit prochaine.'
    WHEN 'MENTAL' THEN
      'Physique OK, mental en retrait. Une séance bien dosée peut faire du bien — attention à l''exécution. Soigne le mental sur la journée (pause, lumière, marche).'
    WHEN 'DOULEUR' THEN
      'Inconfort physique signalé. Adapter les séances aux zones touchées, privilégier mobilité et zones non douloureuses. Pas de charge sur ce qui pointe.'
    WHEN 'BASSE' THEN
      'Multi-signaux bas. Journée légère ou off — on protège. Pas de séance lourde aujourd''hui. Sommeil et nutrition prioritaires.'
    ELSE NULL
  END;
$$;


-- =============================================================================
-- 4. Colonnes générées Ressenti
-- =============================================================================

ALTER TABLE public.morning_checkin
  ADD COLUMN verdict text GENERATED ALWAYS AS (
    public.compute_subjective_verdict(
      sleep_quality, physical_energy, mental_energy,
      mood, motivation, calm, physical_comfort
    )
  ) STORED;

ALTER TABLE public.morning_checkin
  ADD COLUMN verdict_message text GENERATED ALWAYS AS (
    public.compute_subjective_message(
      sleep_quality, physical_energy, mental_energy,
      mood, motivation, calm, physical_comfort
    )
  ) STORED;

COMMIT;
