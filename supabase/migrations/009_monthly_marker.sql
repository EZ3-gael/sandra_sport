-- Sandra Sport — Migration 009 : monthly_marker
--
-- Marqueurs mensuels de progression : SLHRT (Single Leg Heel Rise Test),
-- proprio unipodale, validation kiné, écho de contrôle, etc.
-- Saisie manuelle, fréquence ~1/mois.

BEGIN;

CREATE TABLE IF NOT EXISTS public.monthly_marker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  marker_type text NOT NULL,           -- 'slhrt' | 'proprio_unipodal_g' | 'proprio_unipodal_d' | 'kine_validation' | 'echo'
  measured_at date NOT NULL,

  value_numeric numeric,               -- ex. nb reps SLHRT (côté unique), durée en secondes
  value_text text,                     -- ex. note kiné brève
  metadata jsonb,                      -- structure libre : SLHRT { droite, gauche, asymetrie }, etc.

  notes text,

  captured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS monthly_marker_user_type_idx
  ON public.monthly_marker (user_id, marker_type, measured_at DESC);

ALTER TABLE public.monthly_marker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monthly_marker_select_own" ON public.monthly_marker
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "monthly_marker_insert_own" ON public.monthly_marker
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "monthly_marker_update_own" ON public.monthly_marker
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "monthly_marker_delete_own" ON public.monthly_marker
  FOR DELETE USING (user_id = auth.uid());

CREATE TRIGGER monthly_marker_updated_at
  BEFORE UPDATE ON public.monthly_marker
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;
