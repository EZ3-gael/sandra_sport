-- Sandra Sport — Migration 002 : unicité (user_id, source_file) pour upsert idempotent
--
-- Le script `scripts/sync_sessions.py` lit les .md du workspace sport-sante
-- et les upsert dans `sessions`. On identifie une séance de manière stable
-- par (user_id, source_file), ce qui permet au script d'être idempotent.
--
-- Les séances créées manuellement depuis l'app (source='manual', source_file NULL)
-- ne sont pas affectées : la contrainte n'est active que quand source_file n'est pas NULL.

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS sessions_user_source_file_uq
  ON public.sessions (user_id, source_file)
  WHERE source_file IS NOT NULL;

COMMIT;
