-- Sandra Sport — Migration 008 : hsr_exercise_log
--
-- Journal de chaque exo HSR effectivement réalisé. Une ligne par exo par
-- séance (4 exos HSR par séance HSR : mollets-charges, chaise-unilaterale,
-- hip-thrust-bosu, releves-tibial).
--
-- Lié à `sessions` via session_id (ON DELETE SET NULL : on garde la trace
-- même si la séance est purgée).

BEGIN;

CREATE TABLE IF NOT EXISTS public.hsr_exercise_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,

  exercise_key text NOT NULL,          -- 'mollets-charges' | 'chaise-unilaterale' | 'hip-thrust-bosu' | 'releves-tibial' | (étendu en V1.5e2+)
  performed_at date NOT NULL,

  charge_kg numeric,                   -- nullable (poids du corps possible)
  reps int CHECK (reps IS NULL OR reps >= 0),
  rpe int CHECK (rpe IS NULL OR (rpe BETWEEN 1 AND 10)),
  pain_during int CHECK (pain_during IS NULL OR (pain_during BETWEEN 0 AND 10)),

  notes text,

  captured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hsr_log_user_date_idx
  ON public.hsr_exercise_log (user_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS hsr_log_user_exo_idx
  ON public.hsr_exercise_log (user_id, exercise_key, performed_at DESC);

ALTER TABLE public.hsr_exercise_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hsr_log_select_own" ON public.hsr_exercise_log
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "hsr_log_insert_own" ON public.hsr_exercise_log
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "hsr_log_update_own" ON public.hsr_exercise_log
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "hsr_log_delete_own" ON public.hsr_exercise_log
  FOR DELETE USING (user_id = auth.uid());

CREATE TRIGGER hsr_exercise_log_updated_at
  BEFORE UPDATE ON public.hsr_exercise_log
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;
