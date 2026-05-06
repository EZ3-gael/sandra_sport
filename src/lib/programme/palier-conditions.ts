/**
 * 4 conditions de passage de palier (cf. notes/programme-tab.md §5).
 *
 * Chaque condition renvoie un statut tricolore :
 *   - 'green'  : OK, palier sécurisé
 *   - 'orange' : vigilance, on garde le palier en cours
 *   - 'red'    : alerte, on régresse (ou pas de donnée pour conclure)
 *
 * Les 4 conditions sont indépendantes — c'est l'UI qui décide quoi en faire.
 *
 * Sources des données depuis migration 011 :
 *   - score Achille → table `achilles_morning_eval` (1/jour, 4 sous-scores + max)
 *   - sommeil       → table `morning_checkin.sleep_quality`
 *   - douleur HSR   → table `hsr_exercise_log.pain_during`
 */

import { addDaysIso, todayIso, type IsoDate } from './dates';
import {
  computeAchillesStreak,
  indexAchillesEvalsByDay,
  type AchillesEvalDay,
} from './achilles-streak';

export type Tricolor = 'green' | 'orange' | 'red';

export type SleepCheckin = {
  date: IsoDate;
  sleep_quality: number | null;
};

export type HsrLog = {
  performed_at: IsoDate;
  pain_during: number | null;
};

export type PalierConditions = {
  scoreOk: Tricolor;
  painHsrOk: Tricolor;
  noFlareUp: Tricolor;
  sleepOk: Tricolor;
};

/**
 * Condition 1 — Score Achille ≤ 2/10 sur 5 jours consécutifs.
 *   green  : streak ≥ 5
 *   orange : streak ∈ [3, 4]
 *   red    : streak < 3
 */
export function evaluateAchillesScoreCondition(
  evals: AchillesEvalDay[],
  from: IsoDate = todayIso(),
): Tricolor {
  const streak = computeAchillesStreak(evals, 2, from);
  if (streak >= 5) return 'green';
  if (streak >= 3) return 'orange';
  return 'red';
}

/**
 * Condition 2 — Douleur HSR ≤ 5/10 sur les 3 dernières séances HSR.
 *   green  : 3 séances dispo, toutes ≤ 5
 *   orange : 1 ou 2 séances dispo (pas assez de recul)
 *   red    : au moins une > 5, OU 0 séance HSR (pas de donnée)
 */
export function evaluateHsrPainCondition(hsrLogs: HsrLog[]): Tricolor {
  // hsrLogs supposés triés par performed_at DESC ; on dédoublonne par jour
  // pour ne pas compter 4 exos d'une même séance comme 4 séances.
  const seen = new Set<IsoDate>();
  const distinct: HsrLog[] = [];
  for (const l of hsrLogs) {
    if (seen.has(l.performed_at)) continue;
    seen.add(l.performed_at);
    const sameDay = hsrLogs.filter((x) => x.performed_at === l.performed_at);
    const worst = sameDay.reduce<number | null>((acc, x) => {
      if (x.pain_during === null) return acc;
      return acc === null || x.pain_during > acc ? x.pain_during : acc;
    }, null);
    distinct.push({ performed_at: l.performed_at, pain_during: worst });
    if (distinct.length >= 3) break;
  }
  if (distinct.length === 0) return 'red';
  if (distinct.length < 3) return 'orange';
  const allBelowOrEq5 = distinct.every(
    (l) => l.pain_during !== null && l.pain_during <= 5,
  );
  return allBelowOrEq5 ? 'green' : 'red';
}

/**
 * Condition 3 — Pas de flare-up J+1 sur les 3 dernières séances HSR.
 *   Pour chaque séance HSR à J, on regarde le score Achille à J+1 vs J :
 *     - flare-up = score(J+1) - score(J) > 2
 *   green  : aucun flare-up sur les 3 dernières séances HSR
 *   orange : 1-2 séances dispo (pas assez de recul)
 *   red    : au moins un flare-up détecté
 */
export function evaluateNoFlareUpCondition(
  evals: AchillesEvalDay[],
  hsrLogs: HsrLog[],
): Tricolor {
  const byDay = indexAchillesEvalsByDay(evals);
  const distinctSessionDays: IsoDate[] = [];
  const seen = new Set<IsoDate>();
  for (const l of hsrLogs) {
    if (seen.has(l.performed_at)) continue;
    seen.add(l.performed_at);
    distinctSessionDays.push(l.performed_at);
    if (distinctSessionDays.length >= 3) break;
  }
  if (distinctSessionDays.length === 0) return 'red';
  if (distinctSessionDays.length < 3) return 'orange';

  for (const dayJ of distinctSessionDays) {
    const dayJ1 = addDaysIso(dayJ, 1);
    const sJ = byDay.get(dayJ);
    const sJ1 = byDay.get(dayJ1);
    if (sJ === undefined || sJ === null) continue; // pas de donnée → on ne peut pas conclure, on n'incrimine pas
    if (sJ1 === undefined || sJ1 === null) continue;
    if (sJ1 - sJ > 2) return 'red';
  }
  return 'green';
}

/**
 * Condition 4 — Sommeil non perturbé : moyenne 7j de `sleep_quality` (1-5).
 *   green  : ≥ 3.5
 *   orange : ∈ [2.5, 3.5)
 *   red    : < 2.5 OU 0 donnée
 */
export function evaluateSleepCondition(
  checkins: SleepCheckin[],
  from: IsoDate = todayIso(),
): Tricolor {
  // Une seule valeur par jour pour la moyenne : on prend le max valide pour
  // rester déterministe en cas de plusieurs check-ins par jour.
  const byDay = new Map<IsoDate, number>();
  for (const c of checkins) {
    if (c.sleep_quality === null) continue;
    const prev = byDay.get(c.date);
    if (prev === undefined || c.sleep_quality > prev) {
      byDay.set(c.date, c.sleep_quality);
    }
  }
  const values: number[] = [];
  for (let i = 0; i < 7; i++) {
    const day = addDaysIso(from, -i);
    const v = byDay.get(day);
    if (typeof v === 'number') values.push(v);
  }
  if (values.length === 0) return 'red';
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  if (avg >= 3.5) return 'green';
  if (avg >= 2.5) return 'orange';
  return 'red';
}

/** Évalue les 4 conditions et renvoie un objet groupé. */
export function evaluatePalierConditions(input: {
  achillesEvals: AchillesEvalDay[];
  sleepCheckins: SleepCheckin[];
  hsrLogs: HsrLog[];
  from?: IsoDate;
}): PalierConditions {
  const from = input.from ?? todayIso();
  return {
    scoreOk: evaluateAchillesScoreCondition(input.achillesEvals, from),
    painHsrOk: evaluateHsrPainCondition(input.hsrLogs),
    noFlareUp: evaluateNoFlareUpCondition(input.achillesEvals, input.hsrLogs),
    sleepOk: evaluateSleepCondition(input.sleepCheckins, from),
  };
}
