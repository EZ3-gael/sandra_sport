'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { TextField } from '@/components/ui/TextField';
import {
  QualitativeChoice,
  type QualitativeOption,
} from '@/components/ui/QualitativeChoice';
import {
  CLINICAL_TESTS,
  ROUND_VERDICT_LABELS,
  evaluateRoundVerdict,
  type ClinicalTestCode,
} from '@/lib/validations/clinical-test';
import {
  saveClinicalTestRound,
  deleteClinicalTestRound,
} from './actions';

type ExistingRow = {
  id: string;
  test_code: ClinicalTestCode;
  performed_at: string;
  result_qualitative: string | null;
  notes: string | null;
};

type ResultsState = Record<ClinicalTestCode, string | null>;
type NotesState = Record<ClinicalTestCode, string>;

function buildInitialResults(rows: ExistingRow[]): ResultsState {
  const out = Object.fromEntries(
    CLINICAL_TESTS.map((t) => [t.code, null as string | null]),
  ) as ResultsState;
  for (const r of rows) {
    out[r.test_code] = r.result_qualitative;
  }
  return out;
}

function buildInitialNotes(rows: ExistingRow[]): NotesState {
  const out = Object.fromEntries(
    CLINICAL_TESTS.map((t) => [t.code, '']),
  ) as NotesState;
  for (const r of rows) {
    out[r.test_code] = r.notes ?? '';
  }
  return out;
}

export function ClinicalTestsClient({
  today,
  initialDate,
  existingRows,
  error,
}: {
  today: string;
  initialDate: string;
  existingRows: ExistingRow[];
  error: string | null;
}) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [results, setResults] = useState<ResultsState>(() =>
    buildInitialResults(existingRows),
  );
  const [notes] = useState<NotesState>(() => buildInitialNotes(existingRows));
  const [isPending, startTransition] = useTransition();

  const verdict = useMemo(
    () =>
      evaluateRoundVerdict(
        CLINICAL_TESTS.map((t) => ({
          test_code: t.code,
          result_qualitative: results[t.code],
        })),
      ),
    [results],
  );

  const filledCount = useMemo(
    () =>
      Object.values(results).filter((v) => v !== null && v !== '').length,
    [results],
  );

  const isEditingExisting = existingRows.length > 0;

  function updateResult(code: ClinicalTestCode, next: string | null) {
    setResults((prev) => ({ ...prev, [code]: next }));
  }

  function handleDeleteRound() {
    if (!isEditingExisting) return;
    const ok = window.confirm(
      `Supprimer définitivement le round du ${selectedDate} ?\n\nCette action est irréversible.`,
    );
    if (!ok) return;
    startTransition(async () => {
      await deleteClinicalTestRound(selectedDate);
    });
  }

  return (
    <>
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Tests cliniques T1-T5</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            À faire 1 fois cette semaine, puis tous les 4-8 semaines.
          </p>
        </div>
        <input
          type="date"
          aria-label="Date du round"
          value={selectedDate}
          max={today}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-md border border-border bg-input px-2 py-1 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </header>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <VerdictCard verdict={verdict} filledCount={filledCount} />

      <form
        action={saveClinicalTestRound}
        className="space-y-4 rounded-xl border border-border bg-card p-4"
      >
        <input type="hidden" name="performed_at" value={selectedDate} />

        {CLINICAL_TESTS.map((t, idx) => {
          const options: QualitativeOption[] = Object.entries(t.resultsEnum).map(
            ([value, meta]) => ({
              value,
              label: (meta as { label: string }).label,
              isPathological: (meta as { isPathological: boolean }).isPathological,
            }),
          );
          return (
            <details
              key={t.code}
              className="group rounded-lg border border-border bg-input/30 p-3 [&_summary::-webkit-details-marker]:hidden"
              open
            >
              <summary className="flex cursor-pointer items-baseline justify-between gap-2 text-sm font-medium">
                <span>
                  {idx + 1}. {t.label}
                </span>
                <span className="text-xs text-muted-foreground transition group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <p className="mt-2 text-xs text-muted-foreground">{t.helper}</p>
              <div className="mt-3">
                <QualitativeChoice
                  name={`${t.code}.result_qualitative`}
                  options={options}
                  defaultValue={results[t.code]}
                  onChange={(next) => updateResult(t.code, next)}
                />
              </div>
              <div className="mt-3">
                <TextField
                  name={`${t.code}.notes`}
                  label="Notes (optionnel)"
                  placeholder="ressenti, contexte, écart…"
                  defaultValue={notes[t.code]}
                  rows={2}
                />
              </div>
            </details>
          );
        })}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
          >
            {isEditingExisting ? 'Mettre à jour le round' : 'Enregistrer le round'}
          </button>
          {isEditingExisting && (
            <button
              type="button"
              onClick={handleDeleteRound}
              disabled={isPending}
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive transition hover:bg-destructive/20 disabled:opacity-50"
            >
              Supprimer
            </button>
          )}
        </div>
      </form>

      <Link
        href="/auto-eval/dashboard"
        className="text-center text-sm text-primary hover:underline"
      >
        Voir le suivi →
      </Link>
    </>
  );
}

function VerdictCard({
  verdict,
  filledCount,
}: {
  verdict: 'all_normal' | 'has_concerns' | 'inconclusive';
  filledCount: number;
}) {
  const tone =
    verdict === 'all_normal'
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
      : verdict === 'has_concerns'
        ? 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300'
        : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300';
  const icon =
    verdict === 'all_normal' ? '✅' : verdict === 'has_concerns' ? '⚠' : 'ℹ';
  const detail =
    verdict === 'all_normal'
      ? "AMI fonctionnelle hautement probable. Programme de réhab (toe raises G) suffit. Pas de consultation urgente."
      : verdict === 'has_concerns'
        ? 'Au moins un test pathologique. Consultation médecine du sport ou neurologie sous 4 semaines recommandée (EMG + vitesse de conduction nerveuse).'
        : `Saisie partielle (${filledCount}/5 tests). Compléter les tests manquants pour un verdict fiable.`;

  return (
    <div className={`rounded-xl border p-4 ${tone}`}>
      <p className="text-sm font-semibold">
        {icon} Verdict : {ROUND_VERDICT_LABELS[verdict]}
      </p>
      <p className="mt-1 text-xs">{detail}</p>
    </div>
  );
}
