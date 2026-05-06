'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { ScoreSlider } from '@/components/ui/ScoreSlider';
import { TextField } from '@/components/ui/TextField';
import {
  ACHILLES_MEASURES,
  RAISES_QUALITY_LABELS,
  computeScoreMax,
  type AchillesMeasureKey,
  type AchillesMorningEval,
} from '@/lib/validations/achilles-eval';
import { saveAchillesEval, deleteAchillesEval } from './actions';

type ExistingEval = AchillesMorningEval & {
  id: string;
  captured_at: string;
  score_max: number | null;
};

type ScoresState = Record<AchillesMeasureKey, number | null>;

type RaisesQuality = 'easy' | 'with_discomfort' | 'impossible' | null;
type BonusDone = boolean | null;

const RAISES_OPTIONS: ReadonlyArray<{
  value: Exclude<RaisesQuality, null>;
  label: string;
}> = [
  { value: 'easy', label: RAISES_QUALITY_LABELS.easy },
  { value: 'with_discomfort', label: RAISES_QUALITY_LABELS.with_discomfort },
  { value: 'impossible', label: RAISES_QUALITY_LABELS.impossible },
];

export function AutoEvalClient({
  today,
  initialDate,
  existing,
  error,
}: {
  today: string;
  initialDate: string;
  existing: ExistingEval | null;
  error: string | null;
}) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [scores, setScores] = useState<ScoresState>({
    score_rest: existing?.score_rest ?? null,
    score_three_steps: existing?.score_three_steps ?? null,
    score_ten_raises: existing?.score_ten_raises ?? null,
    score_palpation: existing?.score_palpation ?? null,
  });
  const [raisesQuality, setRaisesQuality] = useState<RaisesQuality>(
    (existing?.raises_quality as RaisesQuality) ?? null,
  );
  const [bonusDone, setBonusDone] = useState<BonusDone>(
    existing?.bonus_heel_off_done ?? null,
  );
  const [isPending, startTransition] = useTransition();

  const scoreMax = useMemo(() => computeScoreMax(scores), [scores]);
  const filledCount = useMemo(
    () => Object.values(scores).filter((s) => typeof s === 'number').length,
    [scores],
  );
  const isEdit = existing !== null;
  const isPastDate = selectedDate < today;

  function updateScore(key: AchillesMeasureKey, next: number | null) {
    setScores((prev) => ({ ...prev, [key]: next }));
  }

  function handleDelete() {
    if (!existing) return;
    const dt = new Date(existing.captured_at).toLocaleString('fr-FR');
    const ok = window.confirm(
      `Supprimer définitivement l'auto-éval du ${dt} ?\n\nCette action est irréversible.`,
    );
    if (!ok) return;
    startTransition(async () => {
      await deleteAchillesEval(existing.id);
    });
  }

  return (
    <>
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Auto-éval Achille</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Au réveil, avant tout mouvement. 60 secondes max.
          </p>
        </div>
        <input
          type="date"
          aria-label="Date de l'auto-éval"
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

      <ScoreLiveCard
        scoreMax={scoreMax}
        filledCount={filledCount}
        isEdit={isEdit}
        capturedAt={existing?.captured_at ?? null}
        isPastDate={isPastDate}
      />

      <form action={saveAchillesEval} className="space-y-6 rounded-xl border border-border bg-card p-4">
        <input type="hidden" name="date" value={selectedDate} />

        {ACHILLES_MEASURES.map((m, idx) => (
          <fieldset key={m.key} className="space-y-2">
            <legend className="text-sm font-medium">
              {idx + 1}. {m.label}
            </legend>
            <p className="text-xs text-muted-foreground">{m.helper}</p>
            <ScoreSlider
              name={m.key}
              min={0}
              max={10}
              compact
              defaultValue={scores[m.key]}
              low="0 — aucune douleur"
              high="10 — douleur maximale"
              onValueChange={(next) => updateScore(m.key, next)}
            />
            {m.key === 'score_ten_raises' && (
              <div className="pt-1">
                <p className="mb-1.5 text-xs text-muted-foreground">
                  Qualité du mouvement :
                </p>
                <RaisesQualityPicker
                  value={raisesQuality}
                  onChange={setRaisesQuality}
                />
              </div>
            )}
          </fieldset>
        ))}

        <BonusHeelOffSection
          done={bonusDone}
          onDoneChange={setBonusDone}
          defaultPain={existing?.bonus_heel_off_pain ?? null}
        />

        <TextField
          name="pain_zones"
          label="Zones de douleur (optionnel)"
          placeholder="ex : côté talon droit, paratenon, mollet"
          defaultValue={existing?.pain_zones ?? ''}
          rows={2}
        />
        <TextField
          name="notes"
          label="Notes libres (optionnel)"
          placeholder="contexte, événement veille, ressenti global…"
          defaultValue={existing?.notes ?? ''}
          rows={3}
        />

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
          >
            {isEdit ? 'Mettre à jour' : 'Enregistrer'}
          </button>
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
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

function ScoreLiveCard({
  scoreMax,
  filledCount,
  isEdit,
  capturedAt,
  isPastDate,
}: {
  scoreMax: number | null;
  filledCount: number;
  isEdit: boolean;
  capturedAt: string | null;
  isPastDate: boolean;
}) {
  const colorClass =
    scoreMax === null
      ? 'text-muted-foreground'
      : scoreMax >= 4
        ? 'text-red-500'
        : scoreMax >= 2
          ? 'text-amber-500'
          : 'text-emerald-500';

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Score du jour
        </span>
        {isEdit && capturedAt && (
          <span className="text-xs italic text-muted-foreground">
            saisi le {new Date(capturedAt).toLocaleString('fr-FR')}
          </span>
        )}
      </div>
      <div className="mt-1 flex items-baseline gap-3">
        <span className={`text-3xl font-semibold tabular-nums ${colorClass}`}>
          {scoreMax === null ? '—' : `${scoreMax}/10`}
        </span>
        {filledCount > 0 && filledCount < 4 && (
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            saisie partielle ({filledCount}/4 mesures)
          </span>
        )}
        {isPastDate && (
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs italic text-muted-foreground">
            saisie a posteriori
          </span>
        )}
      </div>
    </div>
  );
}

function RaisesQualityPicker({
  value,
  onChange,
}: {
  value: RaisesQuality;
  onChange: (next: RaisesQuality) => void;
}) {
  return (
    <>
      <input type="hidden" name="raises_quality" value={value ?? ''} />
      <div className="grid grid-cols-3 gap-1.5">
        {RAISES_OPTIONS.map((opt) => {
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(isActive ? null : opt.value)}
              aria-pressed={isActive}
              className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-input text-muted-foreground hover:border-primary/50'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </>
  );
}

function BonusHeelOffSection({
  done,
  onDoneChange,
  defaultPain,
}: {
  done: BonusDone;
  onDoneChange: (next: BonusDone) => void;
  defaultPain: number | null;
}) {
  const options: ReadonlyArray<{ value: 'true' | 'false' | ''; label: string }> = [
    { value: '', label: 'Pas répondu' },
    { value: 'false', label: 'Sauté' },
    { value: 'true', label: 'Fait' },
  ];
  const formValue: 'true' | 'false' | '' =
    done === true ? 'true' : done === false ? 'false' : '';

  return (
    <fieldset className="space-y-2 rounded-lg border border-dashed border-border p-3">
      <legend className="px-1 text-sm font-medium">Bonus heel-off</legend>
      <p className="text-xs text-muted-foreground">
        3 × 10 montées sur pointes bilatérales tempo 2-2-2, après la routine de
        mobilité, avant la marche libre.
      </p>
      <input type="hidden" name="bonus_heel_off_done" value={formValue} />
      <div className="grid grid-cols-3 gap-1.5">
        {options.map((opt) => {
          const isActive = formValue === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                onDoneChange(
                  opt.value === '' ? null : opt.value === 'true' ? true : false,
                )
              }
              aria-pressed={isActive}
              className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-input text-muted-foreground hover:border-primary/50'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {done === true && (
        <div className="pt-2">
          <p className="mb-1.5 text-xs text-muted-foreground">
            Pic de douleur pendant les 3×10 (optionnel) :
          </p>
          <ScoreSlider
            name="bonus_heel_off_pain"
            min={0}
            max={10}
            compact
            defaultValue={defaultPain}
            low="0"
            high="10"
          />
        </div>
      )}
    </fieldset>
  );
}
