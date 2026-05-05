-- Sandra Sport — Migration 007 : program_phase + program_phase_active view
--
-- Représente la phase active du protocole de rééducation pour chaque user.
-- 1 ligne active à la fois (ended_at IS NULL).
--
-- Sub-phases supportées : 'phase-1a', 'phase-1b', ... — la freq HSR/sem peut
-- varier dans une même phase (ex. 1A: [1,2,3,3] sur W19-W22), on stocke ici
-- la valeur courante et on l'incrémente quand on change de semaine.

BEGIN;

CREATE TABLE IF NOT EXISTS public.program_phase (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  phase_code text NOT NULL,           -- 'phase-1a' | 'phase-1b' | ...
  phase_label text NOT NULL,          -- 'Phase 1A — Établir la tolérance'
  hsr_frequency_per_week int NOT NULL CHECK (hsr_frequency_per_week BETWEEN 0 AND 7),

  started_at date NOT NULL,
  ended_at date,                      -- NULL si en cours

  source_md_path text,                -- ex: 'sport-health/knowledge/protocoles/programme-phase1-W19-W34.md'
  notes text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT program_phase_dates_chk CHECK (ended_at IS NULL OR ended_at >= started_at)
);

-- Une seule phase active (ended_at IS NULL) par user.
CREATE UNIQUE INDEX IF NOT EXISTS program_phase_one_active_per_user_uq
  ON public.program_phase (user_id)
  WHERE ended_at IS NULL;

CREATE INDEX IF NOT EXISTS program_phase_user_started_idx
  ON public.program_phase (user_id, started_at DESC);

ALTER TABLE public.program_phase ENABLE ROW LEVEL SECURITY;

CREATE POLICY "program_phase_select_own" ON public.program_phase
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "program_phase_insert_own" ON public.program_phase
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "program_phase_update_own" ON public.program_phase
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "program_phase_delete_own" ON public.program_phase
  FOR DELETE USING (user_id = auth.uid());

-- Vue dérivée : la phase active courante par user.
-- Distinct on user_id pour ne renvoyer qu'une ligne par user (au cas où,
-- même si l'index unique partial ci-dessus garantit déjà l'invariant).
CREATE OR REPLACE VIEW public.program_phase_active AS
  SELECT DISTINCT ON (user_id) *
  FROM public.program_phase
  WHERE ended_at IS NULL
  ORDER BY user_id, started_at DESC;

CREATE TRIGGER program_phase_updated_at
  BEFORE UPDATE ON public.program_phase
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;
