/**
 * Date helpers spécifiques au pilotage du protocole (timezone Europe/Paris).
 *
 * Pas de dep externe (pas de date-fns). Toutes les fonctions travaillent sur
 * des strings YYYY-MM-DD côté app, et on convertit en Date locale uniquement
 * quand il faut faire de l'arithmétique calendaire.
 */

/** Format strict YYYY-MM-DD attendu partout côté app. */
export type IsoDate = string;

/** Renvoie YYYY-MM-DD pour la date `d` interprétée en heure locale. */
export function toIsoDate(d: Date): IsoDate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse YYYY-MM-DD en Date locale (00:00). */
export function parseIsoDate(s: IsoDate): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Décale une date ISO de `n` jours (n négatif = passé). */
export function addDaysIso(s: IsoDate, n: number): IsoDate {
  const d = parseIsoDate(s);
  d.setDate(d.getDate() + n);
  return toIsoDate(d);
}

/** Ajourd'hui en heure locale, format ISO. */
export function todayIso(): IsoDate {
  return toIsoDate(new Date());
}

/**
 * Numéro de semaine ISO 8601 (1-53). La semaine 1 est celle qui contient le
 * premier jeudi de l'année. Lundi = début de semaine.
 */
export function isoWeekNumber(s: IsoDate): number {
  const d = parseIsoDate(s);
  // Cf. https://en.wikipedia.org/wiki/ISO_week_date#Calculating_the_week_number
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (target.getUTCDay() + 6) % 7; // Lundi = 0
  target.setUTCDate(target.getUTCDate() - dayNum + 3); // jeudi de la semaine
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstThursdayDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstThursdayDayNum + 3);
  const diffMs = target.getTime() - firstThursday.getTime();
  return 1 + Math.round(diffMs / (7 * 24 * 3600 * 1000));
}

/** Lundi (00:00) de la semaine ISO contenant `s`. */
export function isoWeekStart(s: IsoDate): IsoDate {
  const d = parseIsoDate(s);
  const dayNum = (d.getDay() + 6) % 7; // 0 = lundi
  d.setDate(d.getDate() - dayNum);
  return toIsoDate(d);
}
