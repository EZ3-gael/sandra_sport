import { describe, expect, it } from 'vitest';
import {
  CLINICAL_TESTS,
  clinicalTestRoundSchema,
  evaluateRoundVerdict,
  isResultPathological,
} from './clinical-test';

describe('isResultPathological', () => {
  it('renvoie false pour un résultat normal connu', () => {
    expect(isResultPathological('T1_dorsiflexion_active', 'symmetric')).toBe(false);
    expect(isResultPathological('T4_tinel_fibula', 'negative')).toBe(false);
    expect(isResultPathological('T5_heel_walk', 'passed')).toBe(false);
  });

  it('renvoie true pour un résultat pathologique connu', () => {
    expect(isResultPathological('T1_dorsiflexion_active', 'severe_deficit')).toBe(true);
    expect(isResultPathological('T4_tinel_fibula', 'positive')).toBe(true);
    expect(isResultPathological('T5_heel_walk', 'cannot_perform')).toBe(true);
  });

  it('renvoie null si le résultat est vide', () => {
    expect(isResultPathological('T1_dorsiflexion_active', null)).toBeNull();
    expect(isResultPathological('T1_dorsiflexion_active', undefined)).toBeNull();
    expect(isResultPathological('T1_dorsiflexion_active', '')).toBeNull();
  });

  it('renvoie null pour un résultat inconnu (typo, valeur tordue)', () => {
    expect(isResultPathological('T1_dorsiflexion_active', 'totally_fine')).toBeNull();
  });
});

describe('evaluateRoundVerdict', () => {
  it('"all_normal" si ≥ 3 tests saisis et tous non-pathologiques', () => {
    expect(
      evaluateRoundVerdict([
        { test_code: 'T1_dorsiflexion_active', result_qualitative: 'symmetric' },
        { test_code: 'T2_hallux_extension', result_qualitative: 'symmetric' },
        { test_code: 'T3_dorsal_sensitivity', result_qualitative: 'normal' },
        { test_code: 'T4_tinel_fibula', result_qualitative: 'negative' },
        { test_code: 'T5_heel_walk', result_qualitative: 'passed' },
      ]),
    ).toBe('all_normal');
  });

  it('"has_concerns" dès qu\'un test est pathologique', () => {
    expect(
      evaluateRoundVerdict([
        { test_code: 'T1_dorsiflexion_active', result_qualitative: 'symmetric' },
        { test_code: 'T2_hallux_extension', result_qualitative: 'symmetric' },
        { test_code: 'T3_dorsal_sensitivity', result_qualitative: 'normal' },
        { test_code: 'T4_tinel_fibula', result_qualitative: 'positive' },
        { test_code: 'T5_heel_walk', result_qualitative: 'passed' },
      ]),
    ).toBe('has_concerns');
  });

  it('"inconclusive" si moins de 3 tests saisis', () => {
    expect(
      evaluateRoundVerdict([
        { test_code: 'T1_dorsiflexion_active', result_qualitative: 'symmetric' },
        { test_code: 'T2_hallux_extension', result_qualitative: null },
        { test_code: 'T3_dorsal_sensitivity', result_qualitative: '' },
        { test_code: 'T4_tinel_fibula', result_qualitative: undefined },
        { test_code: 'T5_heel_walk', result_qualitative: null },
      ]),
    ).toBe('inconclusive');
  });

  it('"all_normal" sur exactement 3 tests saisis valides', () => {
    expect(
      evaluateRoundVerdict([
        { test_code: 'T1_dorsiflexion_active', result_qualitative: 'symmetric' },
        { test_code: 'T2_hallux_extension', result_qualitative: 'symmetric' },
        { test_code: 'T3_dorsal_sensitivity', result_qualitative: 'normal' },
        { test_code: 'T4_tinel_fibula', result_qualitative: null },
        { test_code: 'T5_heel_walk', result_qualitative: null },
      ]),
    ).toBe('all_normal');
  });
});

describe('clinicalTestRoundSchema', () => {
  it('accepte un round complet avec 5 tests', () => {
    const round = {
      performed_at: '2026-05-08',
      tests: CLINICAL_TESTS.map((t) => ({
        test_code: t.code,
        performed_at: '2026-05-08',
        side: t.side,
        result_qualitative: Object.keys(t.resultsEnum)[0],
      })),
    };
    const result = clinicalTestRoundSchema.safeParse(round);
    expect(result.success).toBe(true);
  });

  it('accepte un round avec liste de tests vide', () => {
    const result = clinicalTestRoundSchema.safeParse({
      performed_at: '2026-05-08',
      tests: [],
    });
    expect(result.success).toBe(true);
  });

  it('refuse un test_code inconnu', () => {
    const result = clinicalTestRoundSchema.safeParse({
      performed_at: '2026-05-08',
      tests: [
        {
          test_code: 'T99_unknown',
          performed_at: '2026-05-08',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('défaut side="left" appliqué automatiquement', () => {
    const result = clinicalTestRoundSchema.safeParse({
      performed_at: '2026-05-08',
      tests: [
        {
          test_code: 'T1_dorsiflexion_active',
          performed_at: '2026-05-08',
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tests[0].side).toBe('left');
    }
  });

  it('refuse un side hors enum', () => {
    const result = clinicalTestRoundSchema.safeParse({
      performed_at: '2026-05-08',
      tests: [
        {
          test_code: 'T1_dorsiflexion_active',
          performed_at: '2026-05-08',
          side: 'top',
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
