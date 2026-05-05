/**
 * Streak Achille : nombre de jours consécutifs (en remontant depuis aujourd'hui)
 * où le score Achille matinal est ≤ threshold.
 *
 * Règles :
 *  - Plusieurs check-ins par jour autorisés. Pour un même `date`, on retient
 *    le MAX (le plus mauvais score de la journée) — conservatif.
 *  - Un jour sans check-in coupe la streak (pas de saisie = pas de preuve).
 *  - Un jour avec check-in mais score NULL coupe aussi (saisie partielle).
 *  - Sentinelle de boucle à 60 jours pour éviter un parcours pathologique.
 */

import { addDaysIso, todayIso, type IsoDate } from './dates';

export type AchillesCheckin = {
  date: IsoDate;
  achilles_score: number | null;
};

/** Réduit plusieurs check-ins par jour à un score MAX (pire). NULL si que des NULL. */
export function dailyMaxAchilles(
  checkins: AchillesCheckin[],
): Map<IsoDate, number | null> {
  const out = new Map<IsoDate, number | null>();
  for (const c of checkins) {
    const prev = out.get(c.date);
    if (prev === undefined) {
      out.set(c.date, c.achilles_score);
    } else if (c.achilles_score !== null) {
      if (prev === null || c.achilles_score > prev) {
        out.set(c.date, c.achilles_score);
      }
    }
  }
  return out;
}

/**
 * Parcourt les jours en arrière depuis `from` (par défaut aujourd'hui), tant
 * que le score est ≤ threshold. Stoppe au premier jour manquant ou > threshold.
 */
export function computeAchillesStreak(
  checkins: AchillesCheckin[],
  threshold: number,
  from: IsoDate = todayIso(),
  maxDays = 60,
): number {
  const byDay = dailyMaxAchilles(checkins);
  let streak = 0;
  for (let i = 0; i < maxDays; i++) {
    const day = addDaysIso(from, -i);
    const score = byDay.get(day);
    if (score === undefined || score === null) break;
    if (score > threshold) break;
    streak++;
  }
  return streak;
}
