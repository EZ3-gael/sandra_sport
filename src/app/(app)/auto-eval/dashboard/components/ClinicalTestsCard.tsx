import Link from 'next/link';
import {
  CLINICAL_TESTS,
  ROUND_VERDICT_LABELS,
  evaluateRoundVerdict,
  type ClinicalTestCode,
  type RoundVerdict,
} from '@/lib/validations/clinical-test';
import { DeleteRoundButton } from './DeleteRoundButton';

export type ClinicalTestRow = {
  test_code: ClinicalTestCode;
  performed_at: string;
  result_qualitative: string | null;
  is_pathological: boolean | null;
  notes: string | null;
};

type Round = {
  performed_at: string;
  rows: ClinicalTestRow[];
  verdict: RoundVerdict;
};

function groupRounds(rows: ClinicalTestRow[]): Round[] {
  const map = new Map<string, ClinicalTestRow[]>();
  for (const r of rows) {
    const list = map.get(r.performed_at) ?? [];
    list.push(r);
    map.set(r.performed_at, list);
  }
  const rounds: Round[] = Array.from(map.entries())
    .map(([performed_at, rs]) => ({
      performed_at,
      rows: rs,
      verdict: evaluateRoundVerdict(
        rs.map((x) => ({
          test_code: x.test_code,
          result_qualitative: x.result_qualitative,
        })),
      ),
    }))
    .sort((a, b) => (a.performed_at < b.performed_at ? 1 : -1));
  return rounds;
}

const TEST_LABEL_BY_CODE: Record<ClinicalTestCode, string> = Object.fromEntries(
  CLINICAL_TESTS.map((t) => [t.code, t.label]),
) as Record<ClinicalTestCode, string>;

export function ClinicalTestsCard({ rows }: { rows: ClinicalTestRow[] }) {
  const rounds = groupRounds(rows);
  const latest = rounds[0] ?? null;

  if (!latest) {
    return (
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Tests cliniques T1-T5
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Aucun round saisi pour le moment. Ces 5 tests neuro-moteurs (anti-AMI)
          sont à faire 1 fois cette semaine, puis tous les 4-8 semaines.
        </p>
        <Link
          href="/auto-eval/tests"
          className="mt-3 inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Faire les premiers tests
        </Link>
      </section>
    );
  }

  const tone =
    latest.verdict === 'all_normal'
      ? 'border-emerald-500/40 bg-emerald-500/10'
      : latest.verdict === 'has_concerns'
        ? 'border-red-500/40 bg-red-500/10'
        : 'border-amber-500/40 bg-amber-500/10';

  // Map résultat → meta (label + isPathological)
  function metaFor(code: ClinicalTestCode, value: string | null) {
    if (!value) return null;
    const test = CLINICAL_TESTS.find((t) => t.code === code);
    if (!test) return null;
    const entry = (test.resultsEnum as Record<
      string,
      { label: string; isPathological: boolean }
    >)[value];
    return entry ?? null;
  }

  return (
    <section className={`rounded-xl border p-4 ${tone}`}>
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Tests cliniques T1-T5
        </h2>
        <span className="text-xs text-muted-foreground">
          dernier round : {latest.performed_at}
        </span>
      </div>
      <p className="mt-1 text-sm font-semibold">
        Verdict : {ROUND_VERDICT_LABELS[latest.verdict]}
      </p>

      <ul className="mt-3 space-y-1.5">
        {CLINICAL_TESTS.map((t) => {
          const r = latest.rows.find((x) => x.test_code === t.code);
          const meta = metaFor(t.code, r?.result_qualitative ?? null);
          return (
            <li
              key={t.code}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span className="text-muted-foreground">
                {t.code.split('_')[0]} · {TEST_LABEL_BY_CODE[t.code]}
              </span>
              <span
                className={`text-xs ${
                  meta === null
                    ? 'italic text-muted-foreground'
                    : meta.isPathological
                      ? 'text-red-500'
                      : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {meta === null
                  ? 'non saisi'
                  : `${meta.label}${meta.isPathological ? ' ⚠' : ' ✓'}`}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/auto-eval/tests"
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          Refaire les tests
        </Link>
        <Link
          href={`/auto-eval/tests?date=${latest.performed_at}`}
          className="rounded-md border border-border bg-input px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Modifier ce round
        </Link>
        <DeleteRoundButton performedAt={latest.performed_at} />
      </div>

      {rounds.length > 1 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">
            Historique ({rounds.length} rounds)
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
            {rounds.map((r) => {
              const dot =
                r.verdict === 'all_normal'
                  ? 'bg-emerald-500'
                  : r.verdict === 'has_concerns'
                    ? 'bg-red-500'
                    : 'bg-amber-500';
              return (
                <li
                  key={r.performed_at}
                  className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5"
                  title={`${r.performed_at} — ${ROUND_VERDICT_LABELS[r.verdict]}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
                  {r.performed_at.slice(5)}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
