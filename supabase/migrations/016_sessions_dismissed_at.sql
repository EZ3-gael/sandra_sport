-- Sandra Sport — Migration 016 : soft-delete des séances (swipe-to-dismiss)
--
-- Contexte :
--   Sur la page d'accueil, l'utilisateur peut faire glisser une carte séance
--   vers la droite (geste type Gmail) pour la masquer. Plutôt qu'un hard
--   delete immédiat (qui réapparaîtrait au prochain `session_sync.py`), on
--   fait un soft delete via `dismissed_at`. Une purge automatique élimine
--   définitivement les lignes dismissed depuis plus de 15 jours.
--
-- Comportement :
--   - dismissed_at = NULL  → séance visible normalement.
--   - dismissed_at = now() → séance masquée des écrans, mais row préservée.
--   - dismissed_at < now() - 15 jours → ligne supprimée par pg_cron.
--   - ON DELETE CASCADE existant sur session_notes purge les ressentis liés.
--
-- Sync workflow :
--   Le script `scripts/session_sync.py` upsert sur (user_id, source_file)
--   sans toucher à `dismissed_at` (colonne absente du payload), donc une
--   séance dismissed reste dismissed même après ré-exécution du sync.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Colonne dismissed_at
-- ---------------------------------------------------------------------------

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS dismissed_at timestamptz;

-- Index partiel sur les lignes visibles (la grande majorité après purge).
-- Accélère le filtre `.is('dismissed_at', null)` des queries de l'accueil.
CREATE INDEX IF NOT EXISTS sessions_user_visible_idx
  ON public.sessions (user_id, date DESC)
  WHERE dismissed_at IS NULL;

-- Index sur les dismissed pour que le job de purge soit instantané même
-- avec beaucoup de séances actives.
CREATE INDEX IF NOT EXISTS sessions_dismissed_at_idx
  ON public.sessions (dismissed_at)
  WHERE dismissed_at IS NOT NULL;


-- ---------------------------------------------------------------------------
-- 2. Auto-purge après 15 jours via pg_cron
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Idempotence : si le job existe déjà (re-run de la migration), on l'enlève
-- avant de le recréer pour éviter les doublons.
DO $$
DECLARE
  job_id bigint;
BEGIN
  SELECT jobid INTO job_id
  FROM cron.job
  WHERE jobname = 'sessions_purge_dismissed';

  IF job_id IS NOT NULL THEN
    PERFORM cron.unschedule(job_id);
  END IF;
END;
$$;

-- Tous les jours à 03:00 UTC (≈ 04:00/05:00 Paris selon DST), on supprime
-- définitivement les séances dismissed depuis plus de 15 jours.
SELECT cron.schedule(
  'sessions_purge_dismissed',
  '0 3 * * *',
  $$
  DELETE FROM public.sessions
  WHERE dismissed_at IS NOT NULL
    AND dismissed_at < now() - interval '15 days';
  $$
);

COMMIT;
