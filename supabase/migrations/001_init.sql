-- Sandra Sport — Migration 001 : schéma initial
--
-- Tables créées :
--   - morning_checkin : wellness matinal (7 dimensions 1-5)
--   - sessions        : séances planifiées / exécutées
--   - session_notes   : ressentis post-séance
--
-- Sécurité :
--   - RLS activée sur toutes les tables
--   - Policies par défaut : user_id = auth.uid() (SELECT / INSERT / UPDATE / DELETE)
--   - ON DELETE CASCADE : suppression user -> purge auto des données
--
-- Alignement : reproduit le schéma de sport-sante/data/wellness_raw.db pour morning_checkin.

BEGIN;

-- =============================================================================
-- morning_checkin
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.morning_checkin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  date date NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL CHECK (source IN ('manual', 'voice_note')),
  source_file text,

  -- 7 dimensions, échelle 1..5, NULL autorisé (ne pas inventer un score)
  sleep_quality    int CHECK (sleep_quality BETWEEN 1 AND 5),
  physical_energy  int CHECK (physical_energy BETWEEN 1 AND 5),
  mental_energy    int CHECK (mental_energy BETWEEN 1 AND 5),
  mood             int CHECK (mood BETWEEN 1 AND 5),
  motivation       int CHECK (motivation BETWEEN 1 AND 5),
  calm             int CHECK (calm BETWEEN 1 AND 5),
  physical_comfort int CHECK (physical_comfort BETWEEN 1 AND 5),

  pain_zones text,
  verbatim   text,
  notes      text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS morning_checkin_user_date_uq
  ON public.morning_checkin (user_id, date);

CREATE INDEX IF NOT EXISTS morning_checkin_user_date_idx
  ON public.morning_checkin (user_id, date DESC);

ALTER TABLE public.morning_checkin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checkin_select_own" ON public.morning_checkin
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "checkin_insert_own" ON public.morning_checkin
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "checkin_update_own" ON public.morning_checkin
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "checkin_delete_own" ON public.morning_checkin
  FOR DELETE USING (user_id = auth.uid());


-- =============================================================================
-- sessions
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  date date NOT NULL,
  slot text,                          -- 'matin' | 'midi' | 'apres-midi' | 'soir'
  planned_start_time time,

  title text NOT NULL,                -- ex: "Course 7×1/1 + vélo récup"
  session_type text,                  -- 'course' | 'velo' | 'muscu' | 'hyrox' | 'recup' | 'mixte'

  status text NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'done', 'skipped')),

  -- JSON structuré : { warmup[], main[], cooldown[], watch_signals[], post_session[] }
  protocol jsonb,

  -- Contexte (phase de prépa, semaine, pourquoi cette séance)
  context text,

  source text NOT NULL DEFAULT 'sandra'
    CHECK (source IN ('sandra', 'manual')),
  source_file text,                   -- ex: 'seances-du-jour/2026-04-23.md'

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_user_date_idx
  ON public.sessions (user_id, date DESC);
CREATE INDEX IF NOT EXISTS sessions_user_status_idx
  ON public.sessions (user_id, status, date DESC);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_select_own" ON public.sessions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "sessions_insert_own" ON public.sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "sessions_update_own" ON public.sessions
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "sessions_delete_own" ON public.sessions
  FOR DELETE USING (user_id = auth.uid());


-- =============================================================================
-- session_notes
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.session_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,

  captured_at timestamptz NOT NULL DEFAULT now(),

  -- Structure flexible :
  --   { ressenti: 'bon'|'moyen'|'mauvais',
  --     rpe: int 1..10,
  --     zones_douleur: string[],
  --     intensite_douleur: int 0..10,
  --     fatigue: int 1..5,
  --     humeur: int 1..5,
  --     energie: int 1..5 }
  notes_struct jsonb,

  notes_brut text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS session_notes_session_idx
  ON public.session_notes (session_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS session_notes_user_idx
  ON public.session_notes (user_id, captured_at DESC);

ALTER TABLE public.session_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_notes_select_own" ON public.session_notes
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "session_notes_insert_own" ON public.session_notes
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "session_notes_update_own" ON public.session_notes
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "session_notes_delete_own" ON public.session_notes
  FOR DELETE USING (user_id = auth.uid());


-- =============================================================================
-- Triggers updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER morning_checkin_updated_at
  BEFORE UPDATE ON public.morning_checkin
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER session_notes_updated_at
  BEFORE UPDATE ON public.session_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;
