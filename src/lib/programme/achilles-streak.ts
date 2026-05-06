/**
 * Streak Achille : nombre de jours consécutifs (en remontant depuis aujourd'hui)
 * où le score Achille matinal est ≤ threshold.
 *
 * Source : table `achilles_morning_eval` (depuis migration 011). Le champ
 * `score_max` = pire des 4 sous-scores du protocole d'auto-éval matinale.
 *
 * Règles :
 *  - 1 saisie / jour / user (contrainte unique côté DB), donc pas de réduction
 *    multi-saisies à faire.
 *  - Un jour sans saisie coupe la streak (pas de saisie = pas de preuve).
 *  - Un jour avec saisie mais score_max NULL coupe aussi (saisie partielle
 *    sans aucune mesure remplie — improbable mais possible).
 *  - Sentinelle de boucle à 60 jours pour éviter un parcours pathologique.
 */

import { addDaysIso, todayIso, type IsoDate } from './dates';

export type AchillesEvalDay = {
  date: IsoDate;
  score_max: number | null;
};

/**
 * Indexe une liste de saisies par date pour lookup en O(1). On suppose 1 saisie
 * par jour (contrainte DB) ; en cas de doublon défensif, on garde le pire.
 */
export function indexAchillesEvalsByDay(
  evals: AchillesEvalDay[],
): Map<IsoDate, number | null> {
  const out = new Map<IsoDate, number | null>();
  for (const e of evals) {
    const prev = out.get(e.date);
    if (prev === undefined) {
      out.set(e.date, e.score_max);
    } else if (e.score_max !== null) {
      if (prev === null || e.score_max > prev) {
        out.set(e.date, e.score_max);
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
  evals: AchillesEvalDay[],
  threshold: number,
  from: IsoDate = todayIso(),
  maxDays = 60,
): number {
  const byDay = indexAchillesEvalsByDay(evals);
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
