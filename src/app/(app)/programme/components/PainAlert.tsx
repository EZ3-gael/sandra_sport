/**
 * Bandeau d'alerte conditionnel selon le score Achille du matin.
 *
 * - score ≥ 4   : alerte rouge, conduite à tenir vélo Z1.
 * - score 2-3   : avertissement orange (vigilance).
 * - score ≤ 1   : pas d'alerte (rien d'affiché).
 */

type PainAlertProps = {
  todayAchillesScore: number | null;
  consecutiveOver3: number; // nb jours consécutifs avec score >= 3
};

export function PainAlert({ todayAchillesScore, consecutiveOver3 }: PainAlertProps) {
  if (todayAchillesScore === null) return null;

  if (todayAchillesScore >= 4) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-700/50 dark:bg-red-950/40 dark:text-red-200">
        <p className="font-semibold">
          Score Achille à {todayAchillesScore}/10 ce matin.
        </p>
        <p className="mt-1">
          Conduite à tenir : vélo Z1 30 min uniquement, pas de HSR ni muscu jambes.
        </p>
      </div>
    );
  }

  if (consecutiveOver3 >= 2) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200">
        <p className="font-semibold">
          {consecutiveOver3} matins consécutifs ≥ 3/10.
        </p>
        <p className="mt-1">
          Surveillance accrue. Si demain ≥ 3, retour au palier précédent.
        </p>
      </div>
    );
  }

  return null;
}
