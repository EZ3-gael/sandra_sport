import { z } from 'zod';

/**
 * Schéma de validation du ressenti post-séance.
 *
 * Aligné sur la table SQL `public.session_notes` (migration 001_init.sql).
 * Structure double : `notes_struct` (JSON clés stables) + `notes_brut` (libre).
 */
export const sessionNoteStructSchema = z.object({
  ressenti: z.enum(['bon', 'moyen', 'mauvais']).optional(),
  // RPE (Rate of Perceived Exertion, échelle de Borg) : convention universelle
  // du sport — 1 = très facile, 10 = effort maximal. Non inversée pour rester
  // compatible avec les standards (coachs, Garmin, littérature).
  rpe: z
    .number()
    .int()
    .min(1, 'RPE entre 1 et 10.')
    .max(10, 'RPE entre 1 et 10.')
    .optional(),
  zones_douleur: z.array(z.string().trim().max(50)).max(10).optional(),
  intensite_douleur: z.number().int().min(0).max(10).optional(),
  // Énergie post-séance : 1 = vidé, 5 = au top. Orientation alignée sur
  // wellness (morning_checkin) où tout est "5 = bien".
  post_session_energy: z.number().int().min(1).max(5).optional(),
  humeur: z.number().int().min(1).max(5).optional(),
});

export const sessionNoteSchema = z.object({
  session_id: z.string().uuid('session_id doit être un UUID valide.'),
  notes_struct: sessionNoteStructSchema.nullable().optional(),
  notes_brut: z.string().trim().max(2000).nullable().optional(),
});

export type SessionNoteStruct = z.infer<typeof sessionNoteStructSchema>;
export type SessionNote = z.infer<typeof sessionNoteSchema>;
