-- Sandra Sport — Migration 005 : table session_item_checks
--
-- Tracker l'exécution item par item d'une séance pendant l'entraînement.
-- Un item du protocole (ex: "Rouleau ischio 60s") peut être coché/décoché.
--
-- Chaque row = un item coché. Le décochage = DELETE de la row.
-- UNIQUE (session_id, item_id, user_id) empêche les doubles cochages.
-- Les item_id sont stables (hash SHA1 du texte, généré par le script sync).

BEGIN;

CREATE TABLE IF NOT EXISTS public.session_item_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  checked_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS session_item_checks_session_item_user_uq
  ON public.session_item_checks (session_id, item_id, user_id);

CREATE INDEX IF NOT EXISTS session_item_checks_session_idx
  ON public.session_item_checks (session_id);

ALTER TABLE public.session_item_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sic_select_own" ON public.session_item_checks
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "sic_insert_own" ON public.session_item_checks
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "sic_delete_own" ON public.session_item_checks
  FOR DELETE USING (user_id = auth.uid());

COMMIT;
