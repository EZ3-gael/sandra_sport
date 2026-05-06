import { addDaysIso, todayIso, type IsoDate } from '@/lib/programme/dates';
import {
  dailyAverages,
  type WellnessSnapshot,
} from '@/lib/wellness/wellness-streak';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function dayOfWeekIso(iso: IsoDate): number {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const js = date.getDay(); // 0=Sun..6=Sat
  return (js + 6) % 7;
}

export function ComplianceCalendar({
  recent30,
}: {
  recent30: WellnessSnapshot[];
}) {
  const today = todayIso();
  const byDay = dailyAverages(recent30);

  const cells: { date: IsoDate; avg: number | null | undefined; col: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = addDaysIso(today, -i);
    cells.push({ date: d, avg: byDay.get(d), col: dayOfWeekIso(d) });
  }

  const filledDays = cells.filter(
    (c) => typeof c.avg === 'number',
  ).length;

  const firstCol = cells[0].col;

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Compliance · 30 j
        </h2>
        <span className="text-xs text-muted-foreground">
          {filledDays}/30 saisies
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
          <Cell key={c.date} date={c.date} avg={c.avg ?? null} />
        ))}
      </div>
    </section>
  );
}

function Cell({ date, avg }: { date: IsoDate; avg: number | null }) {
  if (avg === null) {
    return (
      <span
        className="aspect-square rounded-sm bg-muted/30"
        title={`${date} — pas de saisie`}
      />
    );
  }
  const colorClass =
    avg >= 4
      ? 'bg-emerald-500/80'
      : avg >= 2.5
        ? 'bg-amber-500/80'
        : 'bg-red-500/80';
  return (
    <span
      className={`aspect-square rounded-sm ${colorClass}`}
      title={`${date} — ${avg.toFixed(1)}/5`}
    />
  );
}
