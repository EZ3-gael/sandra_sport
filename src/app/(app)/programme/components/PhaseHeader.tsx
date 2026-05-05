import type {
  PalierConditions,
  Tricolor,
} from '@/lib/programme/palier-conditions';

type PhaseHeaderProps = {
  phaseLabel: string | null;        // ex. "Phase 1A — Établir la tolérance"
  weekIso: number;                  // ex. 19
  weekStartDate: string;            // ex. "11/05/2026"
  hsrFrequencyPerWeek: number | null;
  hsrFrequencyNext: { value: number; atWeek: number } | null;
  streak: number;                   // jours consécutifs Achille ≤ 1
  streakTarget: number;             // ex. 14
  conditions: PalierConditions;
  programNotStartedYet: boolean;    // true si la phase a une date_start dans le futur
  daysToStart: number;              // 0 si en cours, sinon nb de jours avant le start
};

export function PhaseHeader(props: PhaseHeaderProps) {
  const ratio = Math.min(props.streak / props.streakTarget, 1);

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Où j&apos;en suis
        </h2>
        <span className="text-xs text-muted-foreground">
          W{props.weekIso} · sem. du {props.weekStartDate}
        </span>
      </div>

      {props.phaseLabel ? (
        <p className="mt-2 text-base font-medium">{props.phaseLabel}</p>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground italic">
          Aucune phase active. Demande à Sandra de seeder ta phase courante.
        </p>
      )}

      {props.programNotStartedYet && (
        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
          Démarrage prévu dans {props.daysToStart} jour{props.daysToStart > 1 ? 's' : ''}.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {typeof props.hsrFrequencyPerWeek === 'number' && (
          <span>
            HSR :{' '}
            <strong className="text-foreground">
              {props.hsrFrequencyPerWeek}
              {props.hsrFrequencyPerWeek > 1 ? ' séances/sem.' : ' séance/sem.'}
            </strong>
          </span>
        )}
        {props.hsrFrequencyNext && (
          <span>
            Prochain palier :{' '}
            <strong className="text-foreground">
              {props.hsrFrequencyNext.value}/sem. en W{props.hsrFrequencyNext.atWeek}
            </strong>
          </span>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">
            Jours consécutifs Achille ≤ 1/10
          </span>
          <span className="text-2xl font-semibold tabular-nums">
            {props.streak}
            <span className="text-sm font-normal text-muted-foreground">
              {' '}
              / {props.streakTarget}
            </span>
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width]"
            style={{ width: `${ratio * 100}%` }}
            aria-label={`Progression streak : ${Math.round(ratio * 100)} %`}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <ConditionDot
          color={props.conditions.scoreOk}
          label="Score Achille ≤ 2 (5j)"
        />
        <ConditionDot
          color={props.conditions.painHsrOk}
          label="Douleur HSR ≤ 5/10"
        />
        <ConditionDot
          color={props.conditions.noFlareUp}
          label="Pas de flare-up J+1"
        />
        <ConditionDot
          color={props.conditions.sleepOk}
          label="Sommeil non perturbé"
        />
      </div>
    </section>
  );
}

function ConditionDot({
  color,
  label,
}: {
  color: Tricolor;
  label: string;
}) {
  const dotClass: Record<Tricolor, string> = {
    green: 'bg-emerald-500',
    orange: 'bg-amber-500',
    red: 'bg-red-500',
  };
  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5">
      <span
        aria-hidden
        className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${dotClass[color]}`}
      />
      <span className="text-xs leading-tight text-foreground">{label}</span>
    </div>
  );
}
