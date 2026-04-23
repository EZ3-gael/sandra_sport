import { z } from 'zod';

/**
 * Schéma de validation du check-in matinal / intra-journée.
 *
 * Aligné sur `public.morning_checkin` (migrations 001 + 004).
 * Plusieurs check-ins par jour sont autorisés depuis la migration 004.
 * Les 7 dimensions 1-5 acceptent `null` — ne jamais inventer un score.
 */
const scoreOrNull = z
  .number()
  .int()
  .min(1, 'Le score doit être entre 1 et 5.')
  .max(5, 'Le score doit être entre 1 et 5.')
  .nullable()
  .optional();

export const morningCheckinSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format attendu : YYYY-MM-DD'),

  sleep_quality: scoreOrNull,
  physical_energy: scoreOrNull,
  mental_energy: scoreOrNull,
  mood: scoreOrNull,
  motivation: scoreOrNull,
  calm: scoreOrNull,
  physical_comfort: scoreOrNull,

  pain_zones: z.string().trim().max(500).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

export type MorningCheckin = z.infer<typeof morningCheckinSchema>;

/**
 * Liste des 7 dimensions dans l'ordre d'affichage.
 * Utilisée par le formulaire pour générer les sliders/boutons.
 */
export const CHECKIN_DIMENSIONS = [
  {
    key: 'sleep_quality' as const,
    label: 'Sommeil ressenti',
    low: 'mal dormi, fatigué',
    high: 'parfaitement reposé',
  },
  {
    key: 'physical_energy' as const,
    label: 'Énergie physique',
    low: 'vidé, jambes lourdes',
    high: 'en pleine forme',
  },
  {
    key: 'mental_energy' as const,
    label: 'Énergie mentale',
    low: 'cerveau à plat',
    high: 'intellect affûté',
  },
  {
    key: 'mood' as const,
    label: 'Humeur',
    low: 'morose, irritable',
    high: 'joyeux, léger',
  },
  {
    key: 'motivation' as const,
    label: 'Motivation',
    low: 'flemme, envie de rien',
    high: "envie d'attaquer",
  },
  {
    key: 'calm' as const,
    label: 'Calme',
    low: 'tendu, pensées qui tournent',
    high: 'serein, posé',
  },
  {
    key: 'physical_comfort' as const,
    label: 'Confort physique',
    low: 'douleur intense',
    high: 'aucune douleur',
  },
] as const;
