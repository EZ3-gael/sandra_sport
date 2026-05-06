import Link from 'next/link';
import {
  WELLNESS_DIMENSIONS,
  checkinAverage,
  type WellnessSnapshot,
} from '@/lib/wellness/wellness-streak';

export function TodayCard({
  today,
  todayCheckin,
}: {
  today: string;
  todayCheckin: WellnessSnapshot | null;
}) {
  if (!todayCheckin) {
    return (
      <div className="rounded-xl border border-primary/40 bg-primary/10 p-4">
        <h2 className="text-sm font-semibold">
          Auto-éval Ressenti pas encore saisie
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Comment tu te sens ? Ça prend 30 secondes.
        </p>
        <Link
          href="/wellness"
          className="mt-3 inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Faire l&apos;auto-éval
        </Link>
      </div>
    );
  }

  const avg = checkinAverage(todayCheckin);
  const filled = WELLNESS_DIMENSIONS.filter(
    (k) => typeof todayCheckin[k] === 'number',
  ).length;

  const colorClass =
    avg === null
      ? 'text-muted-foreground'
      : avg >= 4
        ? 'text-emerald-500'
        : avg >= 2.5
          ? 'text-amber-500'
          : 'text-red-500';

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Aujourd&apos;hui · {today}
        </span>
        <span className="text-xs italic text-muted-foreground">
          saisi à{' '}
          {new Date(todayCheckin.captured_at).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
      <div className="mt-1 flex items-baseline gap-3">
        <span className={`text-3xl font-semibold tabular-nums ${colorClass}`}>
          {avg === null ? '—' : `${avg.toFixed(1)}/5`}
        </span>
        {filled < 7 && (
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            saisie partielle ({filled}/7 dimensions)
          </span>
        )}
      </div>
      <Link
        href="/wellness"
        className="mt-3 inline-flex items-center gap-1 rounded-md border border-border bg-input px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        Modifier la saisie
      </Link>
    </div>
  );
}
