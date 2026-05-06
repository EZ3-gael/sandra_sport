/**
 * Mini bar-chart CSS du score Achille sur 30 jours, sans dépendance externe.
 * V1.5e3 remplacera par recharts (animations, tooltip riche, export).
 *
 * Source : achilles_morning_eval (depuis migration 011). On affiche `score_max`
 * (pire des 4 sous-scores) — le détail des 4 sous-scores vit dans le dashboard
 * /auto-eval/dashboard (4 mini-charts en grille).
 */

import { addDaysIso, todayIso, type IsoDate } from '@/lib/programme/dates';
import {
  indexAchillesEvalsByDay,
  type AchillesEvalDay,
} from '@/lib/programme/achilles-streak';

type AchillesChartProps = {
  evals: AchillesEvalDay[];
  hsrSessionDays: IsoDate[]; // jours où une séance HSR a eu lieu (pour décor)
};

const SCALE_MAX = 10;

export function AchillesChart({
  evals,
  hsrSessionDays,
}: AchillesChartProps) {
  const today = todayIso();
  const byDay = indexAchillesEvalsByDay(evals);
  const hsrSet = new Set(hsrSessionDays);

  const days: { date: IsoDate; score: number | null; isHsr: boolean }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = addDaysIso(today, -i);
    days.push({
      date: d,
      score: byDay.get(d) ?? null,
      isHsr: hsrSet.has(d),
    });
  }

  const hasAny = days.some((d) => d.score !== null);

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Score Achille — 30 derniers jours
        </h2>
        <span className="text-xs text-muted-foreground">
          rouge ≥ 3 · vert ≤ 1
        </span>
      </div>

      {hasAny ? (
        <div className="mt-4">
          {/* Barres */}
          <div
            className="relative grid h-32 items-end gap-px"
            style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
          >
            {/* Lignes seuils */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 border-t border-dashed border-red-400/60"
              style={{ top: `${(1 - 3 / SCALE_MAX) * 100}%` }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 border-t border-dashed border-emerald-500/60"
              style={{ top: `${(1 - 1 / SCALE_MAX) * 100}%` }}
            />
            {days.map((d) => {
              if (d.score === null) {
                return (
                  <div
                    key={d.date}
                    className="h-full w-full rounded-sm bg-muted/30"
                    title={`${d.date} — pas de saisie`}
                  />
                );
              }
              const heightPct = (d.score / SCALE_MAX) * 100;
              const colorClass =
                d.score >= 4
                  ? 'bg-red-500'
                  : d.score >= 3
                    ? 'bg-amber-500'
                    : d.score <= 1
                      ? 'bg-emerald-500'
                      : 'bg-emerald-400/70';
              return (
                <div
                  key={d.date}
                  className="relative flex h-full w-full items-end"
                  title={`${d.date} — ${d.score}/10${d.isHsr ? ' · HSR' : ''}`}
                >
                  <div
                    className={`w-full rounded-sm ${colorClass}`}
                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                  />
                  {d.isHsr && (
                    <span
                      aria-hidden
                      className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-orange-400"
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>{days[0].date.slice(5)}</span>
            <span>{days[days.length - 1].date.slice(5)}</span>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground italic">
          Pas encore de score Achille saisi sur les 30 derniers jours. Ajoute-le
          dans l&apos;auto-éval matinale.
        </p>
      )}
    </section>
  );
}
