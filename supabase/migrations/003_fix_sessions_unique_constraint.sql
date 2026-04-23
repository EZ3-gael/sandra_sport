-- Sandra Sport — Migration 003 : fix contrainte UNIQUE sessions pour ON CONFLICT
--
-- Problème : la migration 002 créait un index UNIQUE partiel avec WHERE, ce qui
-- empêche Postgres de l'utiliser comme cible de ON CONFLICT (erreur 42P10
-- "there is no unique or exclusion constraint matching the ON CONFLICT specification").
--
-- Fix : on remplace par un UNIQUE total sur (user_id, source_file). Les séances
-- manuelles avec source_file = NULL restent multiples pour un même user (NULL
-- n'est pas considéré égal à NULL dans un UNIQUE Postgres standard).

BEGIN;

DROP INDEX IF EXISTS public.sessions_user_source_file_uq;

CREATE UNIQUE INDEX sessions_user_source_file_uq
  ON public.sessions (user_id, source_file);

COMMIT;
