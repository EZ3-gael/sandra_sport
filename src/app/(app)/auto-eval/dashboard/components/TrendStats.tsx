import { addDaysIso, type IsoDate } from '@/lib/programme/dates';

type EvalRow = {
  date: IsoDate;
  score_max: number | null;
  bonus_heel_off_done: boolean | null;
};

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function rangeScores(rows: EvalRow[], from: IsoDate, days: number): number[] {
  const start = addDaysIso(from, -(days - 1));
  return rows
    .filter((r) => r.date >= start && r.date <= from)
    .map((r) => r.score_max)
    .filter((s): s is number => typeof s === 'number');
}

export function TrendStats({
  today,
  recent30,
  streak,
}: {
  today: IsoDate;
  recent30: EvalRow[];
  streak: number;
}) {
  const last7 = rangeScores(recent30, today, 7);
  const last30 = rangeScores(recent30, today, 30);
  const previous30 = rangeScores(recent30, addDaysIso(today, -30), 30);

  const avg7 = avg(last7);
  const avg30 = avg(last30);
  const avgPrev30 = avg(previous30);

  const trend =
    avg30 !== null && avgPrev30 !== null
      ? avg30 - avgPrev30
      : null;

  const bonusDone = recent30.filter((r) => r.bonus_heel_off_done === true).length;
  const bonusTotal = recent30.length;

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Stats — 30 derniers jours
      </h2>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <Stat
          label="Moy. 7 jours"
          value={avg7 !== null ? `${avg7.toFixed(1)}/10` : '—'}
          hint={`${last7.length} saisie${last7.length > 1 ? 's' : ''}`}
        />
        <Stat
          label="Moy. 30 jours"
          value={avg30 !== null ? `${avg30.toFixed(1)}/10` : '—'}
          hint={trendHint(trend)}
        />
        <Stat
          label="Streak ≤ 1/10"
          value={`${streak} j`}
        />
        <Stat
          label="Bonus heel-off"
          value={
            bonusTotal > 0
              ? `${bonusDone}/${bonusTotal} (${Math.round((bonusDone / bonusTotal) * 100)} %)`
              : '—'
          }
        />
      </dl>
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-base font-semibold tabular-nums">{value}</dd>
      {hint && <dd className="text-xs text-muted-foreground">{hint}</dd>}
    </div>
  );
}

function trendHint(trend: number | null): string | undefined {
  if (trend === null) return undefined;
  const abs = Math.abs(trend).toFixed(1);
  if (trend < -0.1) return `↘ ${abs} vs 30 j prec.`;
  if (trend > 0.1) return `↗ ${abs} vs 30 j prec.`;
  return `→ stable vs 30 j prec.`;
}
