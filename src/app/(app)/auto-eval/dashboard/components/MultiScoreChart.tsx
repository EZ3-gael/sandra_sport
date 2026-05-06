import { addDaysIso, todayIso, type IsoDate } from '@/lib/programme/dates';

type EvalRow = {
  date: IsoDate;
  score_rest: number | null;
  score_three_steps: number | null;
  score_ten_raises: number | null;
  score_palpation: number | null;
};

const SCALE_MAX = 10;

const MEASURES: ReadonlyArray<{
  key:
    | 'score_rest'
    | 'score_three_steps'
    | 'score_ten_raises'
    | 'score_palpation';
  label: string;
}> = [
  { key: 'score_rest', label: 'Repos' },
  { key: 'score_three_steps', label: '3 pas' },
  { key: 'score_ten_raises', label: 'Montées' },
  { key: 'score_palpation', label: 'Palpation' },
];

export function MultiScoreChart({
  recent30,
  hsrSessionDays,
}: {
  recent30: EvalRow[];
  hsrSessionDays: IsoDate[];
}) {
  const today = todayIso();
  const hsrSet = new Set(hsrSessionDays);
  const byDate = new Map(recent30.map((r) => [r.date, r]));

  const days: { date: IsoDate; isHsr: boolean }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = addDaysIso(today, -i);
    days.push({ date: d, isHsr: hsrSet.has(d) });
  }

  const hasAny = recent30.some((r) =>
    MEASURES.some((m) => typeof r[m.key] === 'number'),
  );

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Évolution — 4 mesures · 30 j
        </h2>
        <span className="text-xs text-muted-foreground">
          rouge ≥ 3 · vert ≤ 1
        </span>
      </div>

      {hasAny ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {MEASURES.map((m) => (
            <MiniChart
              key={m.key}
              label={m.label}
              days={days}
              series={(date) => byDate.get(date)?.[m.key] ?? null}
            />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm italic text-muted-foreground">
          Pas encore de mesure saisie sur les 30 derniers jours.
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
  days: { date: IsoDate; isHsr: boolean }[];
  series: (date: IsoDate) => number | null;
}) {
  return (
    <div>
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <div
        className="relative grid h-20 items-end gap-px"
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
          const score = series(d.date);
          if (score === null) {
            return (
              <div
                key={d.date}
                className="h-full w-full rounded-sm bg-muted/30"
                title={`${d.date} — pas de saisie`}
              />
            );
          }
          const heightPct = (score / SCALE_MAX) * 100;
          const colorClass =
            score >= 4
              ? 'bg-red-500'
              : score >= 3
                ? 'bg-amber-500'
                : score <= 1
                  ? 'bg-emerald-500'
                  : 'bg-emerald-400/70';
          return (
            <div
              key={d.date}
              className="relative flex h-full w-full items-end"
              title={`${d.date} — ${score}/10${d.isHsr ? ' · HSR' : ''}`}
            >
              <div
                className={`w-full rounded-sm ${colorClass}`}
                style={{ height: `${Math.max(heightPct, 4)}%` }}
              />
              {d.isHsr && (
                <span
                  aria-hidden
                  className="absolute -top-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-orange-400"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
