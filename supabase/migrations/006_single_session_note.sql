-- Sandra Sport — Migration 006 : un seul ressenti par (user_id, session_id)
--
-- Avant cette migration, `session_notes` acceptait plusieurs lignes pour une
-- même séance : chaque submit du form "Ressenti post-séance" créait une
-- nouvelle row. L'intention produit est UN seul ressenti par séance,
-- éditable, et l'historique multi-ressentis n'est plus affiché.
--
-- Étape 1 : dédupliquer les doublons existants en gardant le plus récent
--           (captured_at DESC, id DESC en tie-breaker).
-- Étape 2 : créer la contrainte UNIQUE pour que l'upsert applicatif
--           (actions.ts:saveSessionNote) garantisse désormais l'invariant.

BEGIN;

-- Étape 1 : dédup
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, session_id
      ORDER BY captured_at DESC, id DESC
    ) AS rn
  FROM public.session_notes
)
DELETE FROM public.session_notes
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Étape 2 : contrainte unique
-- Pattern idempotent : DROP puis ADD (ADD CONSTRAINT n'accepte pas IF NOT EXISTS).
ALTER TABLE public.session_notes
  DROP CONSTRAINT IF EXISTS session_notes_user_session_uq;

ALTER TABLE public.session_notes
  ADD CONSTRAINT session_notes_user_session_uq UNIQUE (user_id, session_id);

COMMIT;
