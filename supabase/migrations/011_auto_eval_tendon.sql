-- Sandra Sport — Migration 011 : auto-évaluation tendon Achille (matinale + tests cliniques)
--
-- Sources métier :
--   - sport-health/knowledge/protocoles/auto-eval-tendon-achille-matin.md
--   - sport-health/knowledge/bilans-cliniques/2026-05-05_etat-baseline-phase1.md (Bloc G)
--
-- Décisions :
--   - Une table dédiée par sémantique : achilles_morning_eval (rituel matinal
--     unique) et clinical_test (tests neuro-moteurs ponctuels, extensible).
--   - DROP COLUMN morning_checkin.achilles_score : on supprime sans backfill.
--     Les rares saisies historiques disparaissent volontairement (sémantique
--     trop pauvre pour être réutilisée).
--   - clinical_test.side NOT NULL DEFAULT 'left' : tous les tests T1-T5 sont
--     latéralisés (gauche), pas de NULL nécessaire. Permet une contrainte
--     unique propre sans COALESCE.
--   - score_max calculé côté Server Action (pas en colonne générée) : les 4
--     sous-scores peuvent évoluer en update, on recalcule explicitement.
--
-- Sécurité : RLS, ON DELETE CASCADE sur user.

BEGIN;

-- =============================================================================
-- 1. achilles_morning_eval — 1 saisie / jour / user (rituel matinal strict)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.achilles_morning_eval (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  date date NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),

  -- 4 mesures du protocole, échelle 0-10, NULL autorisé (saisie partielle)
  score_rest        int CHECK (score_rest        IS NULL OR (score_rest        BETWEEN 0 AND 10)),
  score_three_steps int CHECK (score_three_steps IS NULL OR (score_three_steps BETWEEN 0 AND 10)),
  score_ten_raises  int CHECK (score_ten_raises  IS NULL OR (score_ten_raises  BETWEEN 0 AND 10)),
  score_palpation   int CHECK (score_palpation   IS NULL OR (score_palpation   BETWEEN 0 AND 10)),

  -- Qualité de la mesure 3 (10 montées sur pointes), NULL autorisé
  raises_quality text CHECK (raises_quality IS NULL OR raises_quality IN ('easy', 'with_discomfort', 'impossible')),

  -- Score du jour stocké en DB pour requêtes rapides (= MAX des 4 non-NULL).
  -- Calculé côté Server Action ; NULL si aucune mesure saisie.
  score_max int CHECK (score_max IS NULL OR (score_max BETWEEN 0 AND 10)),

  -- Bonus matinal heel-off (3×10 montées sur pointes après mobilité, avant marche libre).
  --   bonus_heel_off_done : NULL = pas répondu, false = sauté, true = fait.
  --   bonus_heel_off_pain : pic de douleur pendant les 3×10 (0-10), NULL autorisé.
  bonus_heel_off_done boolean,
  bonus_heel_off_pain int CHECK (bonus_heel_off_pain IS NULL OR (bonus_heel_off_pain BETWEEN 0 AND 10)),

  -- Texte libre
  pain_zones text,        -- ex. "côté talon droit, paratenon"
  notes      text,        -- contexte, événements veille, ressenti global

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Rituel unique au réveil : une saisie par jour et par user.
CREATE UNIQUE INDEX IF NOT EXISTS achilles_morning_eval_user_date_uq
  ON public.achilles_morning_eval (user_id, date);

-- Filtres usuels du dashboard (30j / 90j glissants, ordre antéchronologique).
CREATE INDEX IF NOT EXISTS achilles_morning_eval_user_date_idx
  ON public.achilles_morning_eval (user_id, date DESC);

ALTER TABLE public.achilles_morning_eval ENABLE ROW LEVEL SECURITY;

CREATE POLICY "achilles_eval_select_own" ON public.achilles_morning_eval
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "achilles_eval_insert_own" ON public.achilles_morning_eval
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "achilles_eval_update_own" ON public.achilles_morning_eval
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "achilles_eval_delete_own" ON public.achilles_morning_eval
  FOR DELETE USING (user_id = auth.uid());

CREATE TRIGGER achilles_morning_eval_updated_at
  BEFORE UPDATE ON public.achilles_morning_eval
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =============================================================================
-- 2. clinical_test — tests neuro-moteurs ponctuels (T1-T5 anti-AMI, extensible)
-- =============================================================================
-- Modèle générique : un test = une ligne. Un round complet T1-T5 = 5 lignes
-- partageant `performed_at`. Extensible : SLHRT, SEBT, knee-to-wall pourront
-- s'y loger sans nouvelle table.

CREATE TABLE IF NOT EXISTS public.clinical_test (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Code stable du test (cf. catalogue côté Zod) :
  --   T1_dorsiflexion_active, T2_hallux_extension, T3_dorsal_sensitivity,
  --   T4_tinel_fibula, T5_heel_walk.
  test_code text NOT NULL,

  -- Date de réalisation (jour). Plusieurs tests le même jour = même round.
  performed_at date NOT NULL,
  captured_at  timestamptz NOT NULL DEFAULT now(),

  -- Côté testé. T1-T5 sont tous unilatéraux gauche. Pour SEBT / knee-to-wall
  -- futurs, la valeur 'bilateral' est ouverte. NOT NULL DEFAULT 'left' évite
  -- les pièges d'index unique avec NULL.
  side text NOT NULL DEFAULT 'left' CHECK (side IN ('left', 'right', 'bilateral')),

  -- Résultat qualitatif (enum dépendant du test_code, validation Zod côté app).
  result_qualitative text,

  -- Résultat numérique optionnel (amplitude en degrés, distance en cm, etc.).
  result_value_numeric numeric,

  -- Verdict pathologique pour ce test, calculé côté Server Action via la table
  -- de mapping qualitative→bool, stocké pour requêtes rapides.
  is_pathological boolean,

  -- Texte libre (ressenti, contexte, écart par rapport au protocole).
  notes text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Un même test ne peut être saisi qu'une fois par jour, par côté et par user.
-- Évite les doublons accidentels lors d'un upsert de round complet.
CREATE UNIQUE INDEX IF NOT EXISTS clinical_test_unique_per_day
  ON public.clinical_test (user_id, test_code, performed_at, side);

-- Filtres usuels : timeline d'un user, historique d'un test précis.
CREATE INDEX IF NOT EXISTS clinical_test_user_date_idx
  ON public.clinical_test (user_id, performed_at DESC);

CREATE INDEX IF NOT EXISTS clinical_test_user_code_idx
  ON public.clinical_test (user_id, test_code, performed_at DESC);

ALTER TABLE public.clinical_test ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinical_test_select_own" ON public.clinical_test
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "clinical_test_insert_own" ON public.clinical_test
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "clinical_test_update_own" ON public.clinical_test
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "clinical_test_delete_own" ON public.clinical_test
  FOR DELETE USING (user_id = auth.uid());

CREATE TRIGGER clinical_test_updated_at
  BEFORE UPDATE ON public.clinical_test
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =============================================================================
-- 3. Suppression du champ legacy morning_checkin.achilles_score
-- =============================================================================
-- L'auto-éval Achille vit désormais exclusivement dans achilles_morning_eval.
-- Le champ legacy avait une sémantique trop pauvre (un seul score 0-10) pour
-- piloter le protocole. On supprime sans backfill : les éventuelles saisies
-- historiques disparaissent volontairement (release unique pré-W19, données
-- de baseline qui seront refaites dès lundi 11/05).

ALTER TABLE public.morning_checkin
  DROP COLUMN IF EXISTS achilles_score;

COMMIT;
