import {
  WELLNESS_DIMENSION_LABELS,
  topDimensionsAtRisk,
  type WellnessSnapshot,
} from '@/lib/wellness/wellness-streak';

export function DimensionsAtRisk({
  recent60,
  today,
}: {
  recent60: WellnessSnapshot[];
  today: string;
}) {
  const top = topDimensionsAtRisk(recent60, today, 3);

  if (top.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Dimensions à surveiller
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Les 3 plus basses moyennes 7 jours, avec leur tendance vs 7 j précédents.
      </p>

      <ul className="mt-3 space-y-2">
        {top.map((t) => {
          const colorClass =
            t.avg7! >= 4
              ? 'text-emerald-500'
              : t.avg7! >= 2.5
                ? 'text-amber-500'
                : 'text-red-500';
          return (
            <li
              key={t.dimension}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span className="text-muted-foreground">
                {WELLNESS_DIMENSION_LABELS[t.dimension]}
              </span>
              <span className="flex items-baseline gap-2">
                <span className={`font-semibold tabular-nums ${colorClass}`}>
                  {t.avg7!.toFixed(1)}/5
                </span>
                <TrendBadge trend={t.trend} />
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function TrendBadge({ trend }: { trend: number | null }) {
  if (trend === null) {
    return (
      <span className="text-xs text-muted-foreground" title="Pas assez de données sur les 7 j précédents">
        n/a
      </span>
    );
  }
  const abs = Math.abs(trend).toFixed(1);
  if (trend > 0.1) {
    return (
      <span className="text-xs text-emerald-600 dark:text-emerald-400">
        ↗ +{abs}
      </span>
    );
  }
  if (trend < -0.1) {
    return <span className="text-xs text-red-500">↘ -{abs}</span>;
  }
  return <span className="text-xs text-muted-foreground">→ stable</span>;
}
