import Link from 'next/link';
import {
  ACHILLES_VERDICT_STYLE,
  type AchillesVerdict,
} from '@/lib/verdict/verdict-style';

type TodayCardProps = {
  today: string;
  todayEval: {
    id: string;
    score_max: number | null;
    captured_at: string;
    bonus_heel_off_done: boolean | null;
    score_rest: number | null;
    score_three_steps: number | null;
    score_ten_raises: number | null;
    score_palpation: number | null;
    verdict: AchillesVerdict | null;
    verdict_message: string | null;
  } | null;
};

export function TodayCard({ today, todayEval }: TodayCardProps) {
  if (!todayEval) {
    return (
      <div className="rounded-xl border border-primary/40 bg-primary/10 p-4">
        <h2 className="text-sm font-semibold">
          Auto-éval pas encore saisie aujourd&apos;hui
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Au réveil, avant tout mouvement. 60 secondes max.
        </p>
        <Link
          href="/auto-eval"
          className="mt-3 inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Faire l&apos;auto-éval
        </Link>
      </div>
    );
  }

  const filled = [
    todayEval.score_rest,
    todayEval.score_three_steps,
    todayEval.score_ten_raises,
    todayEval.score_palpation,
  ].filter((s): s is number => typeof s === 'number').length;

  const verdictStyle = todayEval.verdict
    ? ACHILLES_VERDICT_STYLE[todayEval.verdict]
    : null;

  const borderClass = verdictStyle?.border ?? 'border-border';

  const bonusText =
    todayEval.bonus_heel_off_done === true
      ? '✓ fait'
      : todayEval.bonus_heel_off_done === false
        ? '✗ sauté'
        : '— non répondu';

  return (
    <div className={`rounded-xl border-2 bg-card p-4 ${borderClass}`}>
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Aujourd&apos;hui · {today}
        </span>
        <span className="text-xs italic text-muted-foreground">
          saisi à{' '}
          {new Date(todayEval.captured_at).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
      <div className="mt-1 flex items-baseline gap-3">
        <span className="text-3xl font-semibold tabular-nums text-foreground">
          {todayEval.score_max === null ? '—' : `${todayEval.score_max}/10`}
        </span>
        {filled < 4 && (
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            saisie partielle ({filled}/4)
          </span>
        )}
      </div>
      {verdictStyle && (
        <span
          className={`mt-2 inline-block rounded-md px-2 py-0.5 text-xs font-medium ${verdictStyle.badge}`}
        >
          {verdictStyle.label}
        </span>
      )}
      {todayEval.verdict_message && (
        <p className="mt-2 text-xs leading-relaxed text-foreground/80">
          {todayEval.verdict_message}
        </p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        Bonus heel-off : <span className="text-foreground">{bonusText}</span>
      </p>
      <Link
        href={`/auto-eval?date=${today}`}
        className="mt-3 inline-flex items-center gap-1 rounded-md border border-border bg-input px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        Modifier la saisie
      </Link>
    </div>
  );
}
