import { describe, expect, it } from 'vitest';
import {
  checkinAverage,
  computeWellnessStreak,
  dailyAverages,
  dailyLatestCheckin,
  topDimensionsAtRisk,
  type WellnessSnapshot,
} from './wellness-streak';

function snap(overrides: Partial<WellnessSnapshot>): WellnessSnapshot {
  return {
    date: '2026-05-06',
    captured_at: '2026-05-06T07:00:00.000Z',
    sleep_quality: null,
    physical_energy: null,
    mental_energy: null,
    mood: null,
    motivation: null,
    calm: null,
    physical_comfort: null,
    ...overrides,
  };
}

describe('checkinAverage', () => {
  it('moyenne des dimensions saisies, ignore les NULL', () => {
    const c = snap({
      sleep_quality: 4,
      physical_energy: 3,
      mood: 5,
    });
    expect(checkinAverage(c)).toBeCloseTo((4 + 3 + 5) / 3, 5);
  });

  it('null si toutes les dimensions sont NULL', () => {
    expect(checkinAverage(snap({}))).toBeNull();
  });

  it('moyenne sur les 7 si toutes saisies', () => {
    const c = snap({
      sleep_quality: 4,
      physical_energy: 4,
      mental_energy: 4,
      mood: 4,
      motivation: 4,
      calm: 4,
      physical_comfort: 4,
    });
    expect(checkinAverage(c)).toBe(4);
  });
});

describe('dailyLatestCheckin', () => {
  it('garde le check-in le plus récent par date', () => {
    const checkins = [
      snap({ date: '2026-05-06', captured_at: '2026-05-06T07:00:00Z', mood: 3 }),
      snap({ date: '2026-05-06', captured_at: '2026-05-06T18:00:00Z', mood: 5 }),
      snap({ date: '2026-05-05', captured_at: '2026-05-05T08:00:00Z', mood: 2 }),
    ];
    const out = dailyLatestCheckin(checkins);
    expect(out.get('2026-05-06')?.mood).toBe(5);
    expect(out.get('2026-05-05')?.mood).toBe(2);
  });
});

describe('dailyAverages', () => {
  it('null pour un jour sans saisie ou tout NULL', () => {
    const out = dailyAverages([snap({ date: '2026-05-06' })]);
    expect(out.get('2026-05-06')).toBeNull();
    expect(out.get('2026-05-05')).toBeUndefined();
  });
});

describe('computeWellnessStreak', () => {
  it("compte les jours consécutifs avec moyenne ≥ threshold", () => {
    const checkins = [
      snap({ date: '2026-05-06', sleep_quality: 4, mood: 4 }),
      snap({ date: '2026-05-05', sleep_quality: 3, mood: 4 }),
      snap({ date: '2026-05-04', sleep_quality: 3, mood: 3 }),
      snap({ date: '2026-05-03', sleep_quality: 2, mood: 2 }), // < 3 → coupe
      snap({ date: '2026-05-02', sleep_quality: 5, mood: 5 }),
    ];
    expect(computeWellnessStreak(checkins, 3, '2026-05-06')).toBe(3);
  });

  it('coupe sur jour sans saisie', () => {
    const checkins = [
      snap({ date: '2026-05-06', sleep_quality: 5 }),
      // 05-05 manquant
      snap({ date: '2026-05-04', sleep_quality: 5 }),
    ];
    expect(computeWellnessStreak(checkins, 3, '2026-05-06')).toBe(1);
  });

  it('coupe sur jour avec moyenne null (toutes dimensions NULL)', () => {
    const checkins = [
      snap({ date: '2026-05-06', sleep_quality: 5 }),
      snap({ date: '2026-05-05' /* tout null */ }),
    ];
    expect(computeWellnessStreak(checkins, 3, '2026-05-06')).toBe(1);
  });

  it('renvoie 0 si rien saisi aujourd\'hui', () => {
    expect(computeWellnessStreak([], 3, '2026-05-06')).toBe(0);
  });
});

describe('topDimensionsAtRisk', () => {
  it('retourne les dimensions au plus bas avg7 dans l\'ordre croissant', () => {
    // 7 jours avec sommeil bas et énergie correcte
    const checkins: WellnessSnapshot[] = [];
    for (let i = 0; i < 7; i++) {
      const date = `2026-05-${String(6 - i).padStart(2, '0')}`;
      checkins.push(
        snap({
          date,
          captured_at: `${date}T07:00:00Z`,
          sleep_quality: 2,
          physical_energy: 4,
          mood: 5,
        }),
      );
    }
    const top = topDimensionsAtRisk(checkins, '2026-05-06', 3);
    expect(top[0].dimension).toBe('sleep_quality');
    expect(top[0].avg7).toBeCloseTo(2, 5);
    expect(top.length).toBe(3); // les 3 plus bas (les autres dim sont null donc filtrées)
  });

  it('calcule la tendance vs 7j précédents quand les deux sont saisis', () => {
    const checkins: WellnessSnapshot[] = [];
    // 7 derniers jours : sommeil 3
    for (let i = 0; i < 7; i++) {
      const date = `2026-05-${String(13 - i).padStart(2, '0')}`;
      checkins.push(
        snap({ date, captured_at: `${date}T07:00:00Z`, sleep_quality: 3 }),
      );
    }
    // 7 jours d'avant : sommeil 4
    for (let i = 0; i < 7; i++) {
      const date = `2026-05-${String(6 - i).padStart(2, '0')}`;
      checkins.push(
        snap({ date, captured_at: `${date}T07:00:00Z`, sleep_quality: 4 }),
      );
    }
    const top = topDimensionsAtRisk(checkins, '2026-05-13', 3);
    const sleep = top.find((t) => t.dimension === 'sleep_quality');
    expect(sleep?.avg7).toBeCloseTo(3, 5);
    expect(sleep?.avg7Prev).toBeCloseTo(4, 5);
    expect(sleep?.trend).toBeCloseTo(-1, 5);
  });
});
