import Link from 'next/link';
import type { IsoDate } from '@/lib/programme/dates';

type EvalRow = {
  date: IsoDate;
  score_max: number | null;
  pain_zones: string | null;
  notes: string | null;
};

export function RecentNotes({ recent30 }: { recent30: EvalRow[] }) {
  const withNotes = recent30
    .filter((r) => (r.pain_zones && r.pain_zones.trim()) || (r.notes && r.notes.trim()))
    .slice(0, 5);

  if (withNotes.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Notes récentes
      </h2>
      <ul className="space-y-2">
        {withNotes.map((r) => (
          <li key={r.date}>
            <Link
              href={`/auto-eval?date=${r.date}`}
              className="block rounded-lg border border-border bg-card p-3 text-sm transition hover:border-primary/50"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-medium">{r.date}</span>
                <span className="text-xs text-muted-foreground">
                  {r.score_max === null ? '—' : `${r.score_max}/10`}
                </span>
              </div>
              {r.pain_zones && (
                <p className="mt-1 text-xs text-destructive">
                  Douleurs : {r.pain_zones}
                </p>
              )}
              {r.notes && (
                <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-muted-foreground">
                  {r.notes}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
