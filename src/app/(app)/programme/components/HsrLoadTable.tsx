/**
 * Tableau des charges HSR — V1.5e1 lecture seule.
 * En V1.5e2 on alimente avec les données de hsr_exercise_log et on calcule la
 * "charge suivante" via load-progression.ts.
 */

import type { IsoDate } from '@/lib/programme/dates';

export const HSR_EXERCISES = [
  {
    key: 'mollets-charges',
    label: 'Montées sur mollets chargées',
    baseUnit: 'kg',
    progressionRule: '+2 kg si RPE ≤ 7 sur 4e série',
  },
  {
    key: 'chaise-unilaterale',
    label: 'Chaise unilatérale (split squat)',
    baseUnit: 'kg',
    progressionRule: 'passer à 12 reps avant +2 kg',
  },
  {
    key: 'hip-thrust-bosu',
    label: 'Hip thrust BOSU',
    baseUnit: 'PdC',
    progressionRule: 'gilet 5 kg en W26+',
  },
  {
    key: 'releves-tibial',
    label: 'Relevés tibial',
    baseUnit: 'série',
    progressionRule: 'passage unilatéral W23+',
  },
] as const;

type HsrExerciseKey = (typeof HSR_EXERCISES)[number]['key'];

export type HsrLogRow = {
  exercise_key: string;
  performed_at: IsoDate;
  charge_kg: number | null;
  reps: number | null;
  rpe: number | null;
  pain_during: number | null;
};

type HsrLoadTableProps = {
  logs: HsrLogRow[]; // triés DESC sur performed_at
};

export function HsrLoadTable({ logs }: HsrLoadTableProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Charges HSR
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        4 dernières séances par exo. Saisie en lot V1.5e2.
      </p>

      <div className="mt-3 space-y-2">
        {HSR_EXERCISES.map((exo) => {
          const exoLogs = logs
            .filter((l) => l.exercise_key === exo.key)
            .slice(0, 4);
          return (
            <ExerciseRow key={exo.key} exo={exo} logs={exoLogs} />
          );
        })}
      </div>
    </section>
  );
}

function ExerciseRow({
  exo,
  logs,
}: {
  exo: { key: HsrExerciseKey; label: string; baseUnit: string; progressionRule: string };
  logs: HsrLogRow[];
}) {
  const last = logs[0] ?? null;
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{exo.label}</span>
        <span className="text-xs text-muted-foreground">
          {last
            ? `${formatCharge(last, exo.baseUnit)}`
            : <span className="italic">pas encore saisi</span>}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Progression : {exo.progressionRule}
      </p>
      {logs.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {logs.map((l, idx) => (
            <span
              key={idx}
              className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
              title={l.performed_at}
            >
              {formatCharge(l, exo.baseUnit)}
              {typeof l.rpe === 'number' && (
                <span className="ml-1 text-foreground/70">RPE {l.rpe}</span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function formatCharge(l: HsrLogRow, unit: string): string {
  if (unit === 'kg') {
    return typeof l.charge_kg === 'number' ? `${l.charge_kg} kg` : '—';
  }
  if (unit === 'série') {
    return typeof l.reps === 'number' ? `${l.reps} reps` : '✓';
  }
  return '✓'; // PdC
}
