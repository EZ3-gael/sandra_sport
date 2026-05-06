import { describe, expect, it } from 'vitest';
import {
  achillesMorningEvalSchema,
  computeScoreMax,
  countMeasuresFilled,
} from './achilles-eval';

describe('computeScoreMax', () => {
  it('renvoie le max strict des 4 mesures saisies', () => {
    expect(
      computeScoreMax({
        score_rest: 0,
        score_three_steps: 1,
        score_ten_raises: 2,
        score_palpation: 3,
      }),
    ).toBe(3);
  });

  it('ignore les NULL et renvoie le max des valeurs présentes', () => {
    expect(
      computeScoreMax({
        score_rest: null,
        score_three_steps: null,
        score_ten_raises: 4,
        score_palpation: null,
      }),
    ).toBe(4);
  });

  it('ignore les undefined comme des NULL', () => {
    expect(
      computeScoreMax({
        score_rest: 2,
        score_three_steps: undefined,
        score_ten_raises: undefined,
        score_palpation: 5,
      }),
    ).toBe(5);
  });

  it('renvoie null si aucune mesure saisie', () => {
    expect(
      computeScoreMax({
        score_rest: null,
        score_three_steps: null,
        score_ten_raises: null,
        score_palpation: null,
      }),
    ).toBeNull();
  });

  it('gère le cas du 0 (score = pas de douleur)', () => {
    expect(
      computeScoreMax({
        score_rest: 0,
        score_three_steps: 0,
        score_ten_raises: 0,
        score_palpation: 0,
      }),
    ).toBe(0);
  });
});

describe('countMeasuresFilled', () => {
  it('compte les mesures non-null et non-undefined', () => {
    expect(
      countMeasuresFilled({
        score_rest: 0,
        score_three_steps: null,
        score_ten_raises: 3,
        score_palpation: undefined,
      }),
    ).toBe(2);
  });

  it('renvoie 0 si toutes les mesures sont vides', () => {
    expect(
      countMeasuresFilled({
        score_rest: null,
        score_three_steps: null,
        score_ten_raises: null,
        score_palpation: null,
      }),
    ).toBe(0);
  });

  it('renvoie 4 si toutes les mesures sont saisies (même à 0)', () => {
    expect(
      countMeasuresFilled({
        score_rest: 0,
        score_three_steps: 0,
        score_ten_raises: 0,
        score_palpation: 0,
      }),
    ).toBe(4);
  });
});

describe('achillesMorningEvalSchema', () => {
  it('accepte une saisie complète valide', () => {
    const result = achillesMorningEvalSchema.safeParse({
      date: '2026-05-06',
      score_rest: 0,
      score_three_steps: 1,
      score_ten_raises: 2,
      score_palpation: 3,
      raises_quality: 'easy',
      bonus_heel_off_done: true,
      bonus_heel_off_pain: 1,
      pain_zones: 'Achille D',
      notes: 'RAS',
    });
    expect(result.success).toBe(true);
  });

  it('accepte une saisie partielle (que la date)', () => {
    const result = achillesMorningEvalSchema.safeParse({ date: '2026-05-06' });
    expect(result.success).toBe(true);
  });

  it('refuse un score hors plage 0-10', () => {
    const result = achillesMorningEvalSchema.safeParse({
      date: '2026-05-06',
      score_rest: 11,
    });
    expect(result.success).toBe(false);
  });

  it('refuse un score négatif', () => {
    const result = achillesMorningEvalSchema.safeParse({
      date: '2026-05-06',
      score_rest: -1,
    });
    expect(result.success).toBe(false);
  });

  it('refuse une date au mauvais format', () => {
    const result = achillesMorningEvalSchema.safeParse({ date: '06/05/2026' });
    expect(result.success).toBe(false);
  });

  it('refuse une date dans le futur', () => {
    const future = '2099-01-01';
    const result = achillesMorningEvalSchema.safeParse({ date: future });
    expect(result.success).toBe(false);
  });

  it('refuse une qualité de montées hors enum', () => {
    const result = achillesMorningEvalSchema.safeParse({
      date: '2026-05-06',
      raises_quality: 'okay',
    });
    expect(result.success).toBe(false);
  });
});
