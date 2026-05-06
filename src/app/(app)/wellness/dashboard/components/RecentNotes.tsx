import Link from 'next/link';
import {
  checkinAverage,
  type WellnessSnapshot,
} from '@/lib/wellness/wellness-streak';

type Snapshot = WellnessSnapshot & {
  pain_zones: string | null;
  notes: string | null;
};

export function RecentNotes({ recent30 }: { recent30: Snapshot[] }) {
  const withNotes = recent30
    .filter(
      (r) =>
        (r.pain_zones && r.pain_zones.trim()) ||
        (r.notes && r.notes.trim()),
    )
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
        {withNotes.map((r) => {
          const avg = checkinAverage(r);
          return (
            <li key={r.captured_at}>
              <Link
                href="/wellness"
                className="block rounded-lg border border-border bg-card p-3 text-sm transition hover:border-primary/50"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-medium">{r.date}</span>
                  <span className="text-xs text-muted-foreground">
                    {avg === null ? '—' : `${avg.toFixed(1)}/5`}
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
          );
        })}
      </ul>
    </section>
  );
}
