/**
 * Helpers du suivi wellness (auto-éval ressenti) :
 *   - moyenne des 7 dimensions d'un check-in (NULL ignorés)
 *   - dernier check-in par jour (multi-saisies autorisées depuis migration 004)
 *   - streak de jours consécutifs avec moyenne ≥ threshold
 *   - dimensions à surveiller (moyenne 7j la plus basse + tendance vs 7j précédents)
 *
 * Source : table `morning_checkin` (1 à N saisies / jour / user). Pour la
 * sémantique d'un "jour", on prend le dernier check-in saisi (ordre par
 * `captured_at DESC`), cohérent avec la home et la TodayCard wellness.
 */

import { addDaysIso, todayIso, type IsoDate } from '@/lib/programme/dates';

export const WELLNESS_DIMENSIONS = [
  'sleep_quality',
  'physical_energy',
  'mental_energy',
  'mood',
  'motivation',
  'calm',
  'physical_comfort',
] as const;

export type WellnessDimensionKey = (typeof WELLNESS_DIMENSIONS)[number];

export const WELLNESS_DIMENSION_LABELS: Record<WellnessDimensionKey, string> = {
  sleep_quality: 'Sommeil',
  physical_energy: 'Énergie physique',
  mental_energy: 'Énergie mentale',
  mood: 'Humeur',
  motivation: 'Motivation',
  calm: 'Calme',
  physical_comfort: 'Confort physique',
};

export type WellnessSnapshot = {
  date: IsoDate;
  captured_at: string;
  sleep_quality: number | null;
  physical_energy: number | null;
  mental_energy: number | null;
  mood: number | null;
  motivation: number | null;
  calm: number | null;
  physical_comfort: number | null;
};

/** Moyenne des 7 dimensions saisies (NULL ignorés). null si tout est NULL. */
export function checkinAverage(c: WellnessSnapshot): number | null {
  const values = WELLNESS_DIMENSIONS.map((k) => c[k]).filter(
    (v): v is number => typeof v === 'number',
  );
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Pour chaque date, retient le check-in dont `captured_at` est le plus récent.
 * Cohérent avec la home (qui affiche déjà le dernier check-in du jour).
 */
export function dailyLatestCheckin(
  checkins: WellnessSnapshot[],
): Map<IsoDate, WellnessSnapshot> {
  const out = new Map<IsoDate, WellnessSnapshot>();
  for (const c of checkins) {
    const prev = out.get(c.date);
    if (prev === undefined || c.captured_at > prev.captured_at) {
      out.set(c.date, c);
    }
  }
  return out;
}

/** Map<date, moyenne du dernier check-in du jour>. null si pas saisi ou tout NULL. */
export function dailyAverages(
  checkins: WellnessSnapshot[],
): Map<IsoDate, number | null> {
  const latest = dailyLatestCheckin(checkins);
  const out = new Map<IsoDate, number | null>();
  for (const [date, c] of latest) {
    out.set(date, checkinAverage(c));
  }
  return out;
}

/**
 * Parcourt les jours en arrière depuis `from`. Compte tant que la moyenne
 * quotidienne est ≥ threshold. Stoppe au premier jour manquant ou < threshold.
 */
export function computeWellnessStreak(
  checkins: WellnessSnapshot[],
  threshold: number,
  from: IsoDate = todayIso(),
  maxDays = 60,
): number {
  const byDay = dailyAverages(checkins);
  let streak = 0;
  for (let i = 0; i < maxDays; i++) {
    const day = addDaysIso(from, -i);
    const avg = byDay.get(day);
    if (avg === undefined || avg === null) break;
    if (avg < threshold) break;
    streak++;
  }
  return streak;
}

export type DimensionInsight = {
  dimension: WellnessDimensionKey;
  avg7: number | null;
  avg7Prev: number | null;
  trend: number | null; // avg7 - avg7Prev, null si l'un des deux manque
};

/**
 * Identifie les dimensions à surveiller : celles dont la moyenne 7 derniers
 * jours est la plus basse, avec la tendance vs les 7 jours précédents.
 *
 * - On prend la valeur du dernier check-in du jour pour chaque dimension.
 * - Les jours sans saisie sont ignorés du calcul (pas de pénalité).
 * - On retourne les `count` dimensions triées par `avg7` croissant.
 */
export function topDimensionsAtRisk(
  checkins: WellnessSnapshot[],
  from: IsoDate = todayIso(),
  count = 3,
): DimensionInsight[] {
  const latest = dailyLatestCheckin(checkins);
  const insights: DimensionInsight[] = WELLNESS_DIMENSIONS.map((dim) => ({
    dimension: dim,
    avg7: rangeAverage(latest, dim, from, 7, 0),
    avg7Prev: rangeAverage(latest, dim, from, 7, 7),
    trend: null,
  }));
  for (const i of insights) {
    if (i.avg7 !== null && i.avg7Prev !== null) {
      i.trend = i.avg7 - i.avg7Prev;
    }
  }
  return insights
    .filter((i) => i.avg7 !== null)
    .sort((a, b) => (a.avg7 ?? 99) - (b.avg7 ?? 99))
    .slice(0, count);
}

function rangeAverage(
  latest: Map<IsoDate, WellnessSnapshot>,
  dim: WellnessDimensionKey,
  from: IsoDate,
  days: number,
  offset: number,
): number | null {
  const values: number[] = [];
  for (let i = offset; i < offset + days; i++) {
    const day = addDaysIso(from, -i);
    const c = latest.get(day);
    const v = c?.[dim];
    if (typeof v === 'number') values.push(v);
  }
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
