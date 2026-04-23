-- Sandra Sport — Migration 004 : permettre plusieurs check-ins par jour + fusion verbatim/notes
--
-- Changements :
-- 1. Suppression de la contrainte UNIQUE (user_id, date) — chaque submit = nouvelle ligne.
-- 2. Fusion du contenu `verbatim` dans `notes` pour les lignes existantes (concat).
-- 3. Suppression de la colonne `verbatim` (redondante avec `notes` côté sémantique).
--
-- Rationale :
-- - Avant : 1 check-in/jour, upsert. On ratait l'évolution intra-journée.
-- - Après : N check-ins/jour, chaque saisie a son `captured_at`. Patterns fins détectables.
-- - `verbatim` était un héritage du pipeline vocal (phrases brutes). En pratique,
--   peu importe que le texte vienne d'une transcription ou d'une saisie clavier :
--   ce sont toujours les mots de l'utilisateur. `source` distingue déjà le canal.

BEGIN;

-- 1. Drop UNIQUE (user_id, date)
DROP INDEX IF EXISTS public.morning_checkin_user_date_uq;

-- 2. Migrer verbatim → notes (concat avec un saut de ligne double si les 2 existent)
UPDATE public.morning_checkin
SET notes = TRIM(BOTH E'\n' FROM COALESCE(notes, '') || E'\n\n' || verbatim)
WHERE verbatim IS NOT NULL AND TRIM(verbatim) <> '';

-- 3. Drop colonne verbatim
ALTER TABLE public.morning_checkin DROP COLUMN IF EXISTS verbatim;

COMMIT;
