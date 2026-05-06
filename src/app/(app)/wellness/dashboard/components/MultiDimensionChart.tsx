import { addDaysIso, todayIso, type IsoDate } from '@/lib/programme/dates';
import {
  WELLNESS_DIMENSIONS,
  WELLNESS_DIMENSION_LABELS,
  dailyLatestCheckin,
  type WellnessDimensionKey,
  type WellnessSnapshot,
} from '@/lib/wellness/wellness-streak';

const SCALE_MAX = 5;

export function MultiDimensionChart({
  recent30,
}: {
  recent30: WellnessSnapshot[];
}) {
  const today = todayIso();
  const latest = dailyLatestCheckin(recent30);

  const days: IsoDate[] = [];
  for (let i = 29; i >= 0; i--) {
    days.push(addDaysIso(today, -i));
  }

  const hasAny = recent30.some((c) =>
    WELLNESS_DIMENSIONS.some((d) => typeof c[d] === 'number'),
  );

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Évolution — 7 dimensions · 30 j
        </h2>
        <span className="text-xs text-muted-foreground">
          vert ≥ 4 · rouge &lt; 2.5
        </span>
      </div>

      {hasAny ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {WELLNESS_DIMENSIONS.map((dim) => (
            <MiniChart
              key={dim}
              label={WELLNESS_DIMENSION_LABELS[dim]}
              days={days}
              series={(date) => latest.get(date)?.[dim] ?? null}
            />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm italic text-muted-foreground">
          Pas encore de saisie sur les 30 derniers jours.
        </p>
      )}
    </section>
  );
}

function MiniChart({
  label,
  days,
  series,
}: {
  label: string;
  days: IsoDate[];
  series: (date: IsoDate) => number | null;
}) {
  return (
    <div>
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <div
        className="relative grid h-20 items-end gap-px"
        style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
      >
        {/* Lignes seuils : 4 (haut, vert) et 2.5 (bas, rouge) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-emerald-500/60"
          style={{ top: `${(1 - 4 / SCALE_MAX) * 100}%` }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-red-400/60"
          style={{ top: `${(1 - 2.5 / SCALE_MAX) * 100}%` }}
        />
        {days.map((d) => {
          const score = series(d);
          if (score === null) {
            return (
              <div
                key={d}
                className="h-full w-full rounded-sm bg-muted/30"
                title={`${d} — pas de saisie`}
              />
            );
          }
          const heightPct = (score / SCALE_MAX) * 100;
          const colorClass =
            score >= 4
              ? 'bg-emerald-500'
              : score >= 2.5
                ? 'bg-amber-500'
                : 'bg-red-500';
          return (
            <div
              key={d}
              className="relative flex h-full w-full items-end"
              title={`${d} — ${score}/5 ${label}`}
            >
              <div
                className={`w-full rounded-sm ${colorClass}`}
                style={{ height: `${Math.max(heightPct, 4)}%` }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type { WellnessDimensionKey };
