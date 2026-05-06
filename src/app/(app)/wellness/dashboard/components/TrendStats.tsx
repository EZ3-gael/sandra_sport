import { addDaysIso, type IsoDate } from '@/lib/programme/dates';
import {
  dailyAverages,
  type WellnessSnapshot,
} from '@/lib/wellness/wellness-streak';

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function rangeAvg(
  byDay: Map<IsoDate, number | null>,
  from: IsoDate,
  days: number,
  offset = 0,
): number | null {
  const values: number[] = [];
  for (let i = offset; i < offset + days; i++) {
    const day = addDaysIso(from, -i);
    const v = byDay.get(day);
    if (typeof v === 'number') values.push(v);
  }
  return avg(values);
}

export function TrendStats({
  today,
  recent60,
  streak,
}: {
  today: IsoDate;
  recent60: WellnessSnapshot[];
  streak: number;
}) {
  const byDay = dailyAverages(recent60);

  const avg7 = rangeAvg(byDay, today, 7);
  const avg30 = rangeAvg(byDay, today, 30);
  const avgPrev30 = rangeAvg(byDay, today, 30, 30);

  const trend =
    avg30 !== null && avgPrev30 !== null ? avg30 - avgPrev30 : null;

  // Compte les jours saisis dans les 30 derniers
  const filledDays = (() => {
    let n = 0;
    for (let i = 0; i < 30; i++) {
      const day = addDaysIso(today, -i);
      const v = byDay.get(day);
      if (typeof v === 'number') n++;
    }
    return n;
  })();

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Stats — 30 derniers jours
      </h2>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <Stat
          label="Moy. 7 jours"
          value={avg7 !== null ? `${avg7.toFixed(1)}/5` : '—'}
        />
        <Stat
          label="Moy. 30 jours"
          value={avg30 !== null ? `${avg30.toFixed(1)}/5` : '—'}
          hint={trendHint(trend)}
        />
        <Stat label="Streak ≥ 3/5" value={`${streak} j`} />
        <Stat label="Saisies / 30 j" value={`${filledDays}/30`} />
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
  if (trend > 0.1) return `↗ ${abs} vs 30 j prec.`;
  if (trend < -0.1) return `↘ ${abs} vs 30 j prec.`;
  return `→ stable vs 30 j prec.`;
}
