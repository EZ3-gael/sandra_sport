/**
 * Mappings verdict → classes Tailwind + label affichable.
 *
 * Les valeurs `verdict` et `verdict_message` sont calculées en base via les
 * colonnes générées sur `achilles_morning_eval` et `morning_checkin`
 * (migration 012). Ce module ne fait QUE le rendu visuel — aucune logique de
 * scoring ne doit être réimplémentée ici.
 */

export type AchillesVerdict = 'GREEN' | 'AMBER' | 'RED';

export type SubjectiveVerdict =
  | 'OPTIMAL'
  | 'VIGILANCE'
  | 'MENTAL'
  | 'DOULEUR'
  | 'BASSE';

type VerdictStyle = {
  /** Classe de bordure Tailwind à appliquer sur la carte (avec opacité). */
  border: string;
  /** Classes du badge (fond translucide + texte coloré, dark mode inclus). */
  badge: string;
  /** Label court à afficher dans le badge. */
  label: string;
};

export const ACHILLES_VERDICT_STYLE: Record<AchillesVerdict, VerdictStyle> = {
  GREEN: {
    border: 'border-emerald-500/60',
    badge:
      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    label: 'GREEN — HSR autorisé',
  },
  AMBER: {
    border: 'border-amber-500/60',
    badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    label: 'AMBER — HSR adapté',
  },
  RED: {
    border: 'border-red-500/60',
    badge: 'bg-red-500/15 text-red-700 dark:text-red-300',
    label: 'RED — HSR annulé',
  },
};

export const SUBJECTIVE_VERDICT_STYLE: Record<SubjectiveVerdict, VerdictStyle> =
  {
    OPTIMAL: {
      border: 'border-emerald-500/60',
      badge:
        'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
      label: 'Optimal',
    },
    VIGILANCE: {
      border: 'border-amber-500/60',
      badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
      label: 'Vigilance',
    },
    MENTAL: {
      border: 'border-blue-500/60',
      badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
      label: 'Mental en retrait',
    },
    DOULEUR: {
      border: 'border-orange-500/60',
      badge:
        'bg-orange-500/15 text-orange-700 dark:text-orange-300',
      label: 'Douleur signalée',
    },
    BASSE: {
      border: 'border-red-500/60',
      badge: 'bg-red-500/15 text-red-700 dark:text-red-300',
      label: 'Journée basse',
    },
  };
