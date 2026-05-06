import { z } from 'zod';

const scoreOrNull = z
  .number()
  .int()
  .min(0, 'Le score doit être entre 0 et 10.')
  .max(10, 'Le score doit être entre 0 et 10.')
  .nullable()
  .optional();

const raisesQualitySchema = z
  .enum(['easy', 'with_discomfort', 'impossible'])
  .nullable()
  .optional();

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export const achillesMorningEvalSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format attendu : YYYY-MM-DD')
    .refine((d) => d <= todayIso(), {
      message: 'La date ne peut pas être dans le futur.',
    }),
  score_rest: scoreOrNull,
  score_three_steps: scoreOrNull,
  score_ten_raises: scoreOrNull,
  score_palpation: scoreOrNull,
  raises_quality: raisesQualitySchema,
  bonus_heel_off_done: z.boolean().nullable().optional(),
  bonus_heel_off_pain: scoreOrNull,
  pain_zones: z.string().trim().max(500).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

export type AchillesMorningEval = z.infer<typeof achillesMorningEvalSchema>;

export type AchillesMeasureKey =
  | 'score_rest'
  | 'score_three_steps'
  | 'score_ten_raises'
  | 'score_palpation';

/** Pire des 4 mesures non-NULL. NULL si aucune mesure saisie. */
export function computeScoreMax(
  measures: Pick<AchillesMorningEval, AchillesMeasureKey>,
): number | null {
  const values = [
    measures.score_rest,
    measures.score_three_steps,
    measures.score_ten_raises,
    measures.score_palpation,
  ].filter((s): s is number => typeof s === 'number');
  if (values.length === 0) return null;
  return Math.max(...values);
}

/** Combien de mesures sur 4 ont été saisies. Sert au badge "saisie partielle". */
export function countMeasuresFilled(
  measures: Pick<AchillesMorningEval, AchillesMeasureKey>,
): number {
  return [
    measures.score_rest,
    measures.score_three_steps,
    measures.score_ten_raises,
    measures.score_palpation,
  ].filter((s): s is number => typeof s === 'number').length;
}

export const RAISES_QUALITY_LABELS: Record<
  Exclude<NonNullable<AchillesMorningEval['raises_quality']>, undefined>,
  string
> = {
  easy: 'Facile',
  with_discomfort: 'Avec gêne',
  impossible: 'Impossible',
};

export const ACHILLES_MEASURES: ReadonlyArray<{
  key: AchillesMeasureKey;
  label: string;
  helper: string;
}> = [
  {
    key: 'score_rest',
    label: 'Repos couché',
    helper: 'Avant tout mouvement, encore allongé.',
  },
  {
    key: 'score_three_steps',
    label: 'Trois premiers pas',
    helper: 'Lève-toi, fais 3 pas. La pire douleur ressentie.',
  },
  {
    key: 'score_ten_raises',
    label: 'Dix montées sur pointes',
    helper:
      'Pieds parallèles, montée 1 s, descente 2 s. Pire douleur de la série.',
  },
  {
    key: 'score_palpation',
    label: 'Palpation tendon',
    helper:
      'Pouce-index sur le corps tendineux, ~4-6 cm au-dessus du calcanéum. Pression franche.',
  },
];
