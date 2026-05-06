import { addDaysIso, todayIso, type IsoDate } from '@/lib/programme/dates';

type EvalRow = {
  date: IsoDate;
  score_max: number | null;
  bonus_heel_off_done: boolean | null;
};

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function dayOfWeekIso(iso: IsoDate): number {
  // 0 = Lundi, 6 = Dimanche
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const js = date.getDay(); // 0=Sun..6=Sat
  return (js + 6) % 7;
}

export function ComplianceCalendar({ recent30 }: { recent30: EvalRow[] }) {
  const today = todayIso();
  const byDate = new Map(recent30.map((r) => [r.date, r]));

  const cells: { date: IsoDate; row: EvalRow | undefined; col: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = addDaysIso(today, -i);
    cells.push({ date: d, row: byDate.get(d), col: dayOfWeekIso(d) });
  }

  const filledDays = cells.filter((c) => c.row !== undefined).length;
  const bonusDone = cells.filter((c) => c.row?.bonus_heel_off_done === true)
    .length;

  // Aligne la première cellule sur la bonne colonne (jour de semaine)
  const firstCol = cells[0].col;

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Compliance · 30 j
        </h2>
        <span className="text-xs text-muted-foreground">
          {filledDays}/30 saisies · {bonusDone}/30 bonus
        </span>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="py-1">
            {w}
          </span>
        ))}
        {Array.from({ length: firstCol }).map((_, i) => (
          <span key={`pad-${i}`} aria-hidden />
        ))}
        {cells.map((c) => (
          <Cell key={c.date} date={c.date} row={c.row} />
        ))}
      </div>
    </section>
  );
}

function Cell({ date, row }: { date: IsoDate; row: EvalRow | undefined }) {
  if (!row) {
    return (
      <span
        className="aspect-square rounded-sm bg-muted/30"
        title={`${date} — pas de saisie`}
      />
    );
  }
  const score = row.score_max;
  const colorClass =
    score === null
      ? 'bg-muted'
      : score >= 4
        ? 'bg-red-500/80'
        : score >= 2
          ? 'bg-amber-500/80'
          : 'bg-emerald-500/80';
  const bonusBadge = row.bonus_heel_off_done === true;
  return (
    <span
      className={`relative aspect-square rounded-sm ${colorClass}`}
      title={`${date} — ${score === null ? 'partiel' : `${score}/10`}${
        bonusBadge ? ' · bonus ✓' : ''
      }`}
    >
      {bonusBadge && (
        <span
          aria-hidden
          className="absolute bottom-0 right-0 h-1 w-1 rounded-full bg-orange-400"
        />
      )}
    </span>
  );
}
