'use client';

import { useState, useTransition } from 'react';
import {
  CHECKIN_DIMENSIONS,
  type MorningCheckin,
} from '@/lib/validations/wellness';
import { saveCheckin, updateCheckin, deleteCheckin } from './actions';

export type CheckinRow = MorningCheckin & {
  id: string;
  user_id: string;
  captured_at: string;
  source: string;
  created_at: string;
  updated_at: string;
};

type Mode = { kind: 'new' } | { kind: 'edit'; entry: CheckinRow };

export function WellnessClient({ entries }: { entries: CheckinRow[] }) {
  const today = new Date().toISOString().slice(0, 10);

  const [mode, setMode] = useState<Mode>({ kind: 'new' });
  const [formKey, setFormKey] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today);
  const [isPending, startTransition] = useTransition();

  function confirmIfDirty(message: string): boolean {
    if (!dirty) return true;
    return window.confirm(message);
  }

  function handleEditClick(entry: CheckinRow) {
    if (
      !confirmIfDirty(
        'Tu as des modifications non enregistrées sur le formulaire actuel. Continuer sans les sauvegarder ?',
      )
    ) {
      return;
    }
    setMode({ kind: 'edit', entry });
    setSelectedDate(entry.date);
    setDirty(false);
    setFormKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancelEdit() {
    if (
      !confirmIfDirty(
        'Tu as des modifications non enregistrées. Abandonner ces modifications ?',
      )
    ) {
      return;
    }
    setMode({ kind: 'new' });
    setSelectedDate(today);
    setDirty(false);
    setFormKey((k) => k + 1);
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedDate(e.target.value);
    setDirty(true);
  }

  function handleDelete() {
    if (mode.kind !== 'edit') return;
    const entry = mode.entry;
    const dt = new Date(entry.captured_at).toLocaleString('fr-FR');
    const ok = window.confirm(
      `Supprimer définitivement ce check-in du ${dt} ?\n\nCette action est irréversible.`,
    );
    if (!ok) return;

    startTransition(async () => {
      await deleteCheckin(entry.id);
    });
  }

  const formAction =
    mode.kind === 'edit'
      ? updateCheckin.bind(null, mode.entry.id)
      : saveCheckin;

  const entryDefaults: Partial<CheckinRow> =
    mode.kind === 'edit' ? mode.entry : {};

  const isEditMode = mode.kind === 'edit';

  const isPastDate = selectedDate < today;

  return (
    <>
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Check-in</h1>
        <input
          type="date"
          aria-label="Date du check-in"
          value={selectedDate}
          max={today}
          onChange={handleDateChange}
          className="rounded-md border border-border bg-input px-2 py-1 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </header>

      <form
        key={formKey}
        action={formAction}
        onChange={() => setDirty(true)}
        className="space-y-6 rounded-xl border border-border bg-card p-4"
      >
        <input type="hidden" name="date" value={selectedDate} />

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {isEditMode
              ? `Édition du check-in du ${new Date(mode.entry.captured_at).toLocaleString('fr-FR')}`
              : isPastDate
                ? `Saisie pour le ${formatDateFR(selectedDate)} (jour passé).`
                : 'Laisse vide les dimensions non exprimées. Plusieurs check-ins par jour possibles.'}
          </p>
          {isEditMode && (
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isPending}
              className="rounded-md border border-border bg-input px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Annuler
            </button>
          )}
        </div>

        {CHECKIN_DIMENSIONS.map((dim) => (
          <ScoreRow
            key={dim.key}
            name={dim.key}
            label={dim.label}
            low={dim.low}
            high={dim.high}
            value={(entryDefaults[dim.key] as number | null | undefined) ?? null}
          />
        ))}

        <TextField
          name="pain_zones"
          label="Zones de douleur (optionnel)"
          placeholder="ex : quadriceps, mollet droit"
          defaultValue={entryDefaults.pain_zones ?? ''}
          rows={2}
        />
        <TextField
          name="notes"
          label="Notes libres (optionnel)"
          placeholder="ressenti, contexte, observations, verbatim matinal…"
          defaultValue={entryDefaults.notes ?? ''}
          rows={4}
        />

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
          >
            {isEditMode ? 'Mettre à jour' : 'Enregistrer'}
          </button>
          {isEditMode && (
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

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Timeline — 20 dernières saisies
        </h2>
        {entries.length > 0 ? (
          <ul className="space-y-2">
            {entries.map((r) => (
              <CheckinCard
                key={r.id}
                entry={r}
                active={isEditMode && mode.entry.id === r.id}
                onClick={() => handleEditClick(r)}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucun check-in pour l&apos;instant.
          </p>
        )}
      </section>
    </>
  );
}

function CheckinCard({
  entry,
  active,
  onClick,
}: {
  entry: CheckinRow;
  active: boolean;
  onClick: () => void;
}) {
  const dateStr = formatDateFR(entry.date);
  const capturedDay = entry.captured_at.slice(0, 10);
  const capturedTime = new Date(entry.captured_at).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const isBackfilled = capturedDay !== entry.date;

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`w-full rounded-lg border bg-card p-3 text-left text-sm transition ${
          active
            ? 'border-primary ring-2 ring-primary/30'
            : 'border-border hover:border-primary/50'
        }`}
      >
        <div className="flex items-baseline justify-between">
          <span className="font-medium">
            {dateStr}
            {!isBackfilled && (
              <span className="ml-1 font-normal text-muted-foreground">
                · {capturedTime}
              </span>
            )}
          </span>
          <span className="text-xs text-muted-foreground">
            {averageScore(entry)}
          </span>
        </div>
        {isBackfilled && (
          <p className="mt-0.5 text-xs italic text-muted-foreground">
            Saisi a posteriori le {formatDateFR(capturedDay)} à {capturedTime}
          </p>
        )}
        <div className="mt-1.5 flex flex-wrap gap-1 text-xs">
          {CHECKIN_DIMENSIONS.map((dim) => {
            const v = entry[dim.key];
            if (typeof v !== 'number') return null;
            return (
              <span
                key={dim.key}
                className="rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground"
                title={dim.label}
              >
                {dim.label.split(' ')[0]} {v}
              </span>
            );
          })}
        </div>
        {entry.pain_zones && (
          <p className="mt-2 text-xs text-destructive">
            Douleurs : {entry.pain_zones}
          </p>
        )}
        {entry.notes && (
          <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs text-muted-foreground">
            {entry.notes}
          </p>
        )}
      </button>
    </li>
  );
}

function formatDateFR(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  if (!y || !m || !d) return yyyymmdd;
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
}

function averageScore(r: Partial<MorningCheckin>): string {
  const keys: (keyof MorningCheckin)[] = [
    'sleep_quality',
    'physical_energy',
    'mental_energy',
    'mood',
    'motivation',
    'calm',
    'physical_comfort',
  ];
  const values = keys
    .map((k) => r[k])
    .filter((v): v is number => typeof v === 'number');
  if (values.length === 0) return '—';
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return `${avg.toFixed(1)}/5 (${values.length}/7)`;
}

function ScoreRow({
  name,
  label,
  low,
  high,
  value,
}: {
  name: string;
  label: string;
  low: string;
  high: string;
  value: number | null;
}) {
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      <div className="mb-2 flex justify-between text-xs text-muted-foreground">
        <span>1 : {low}</span>
        <span>5 : {high}</span>
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        <label className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value=""
            defaultChecked={value == null}
            className="peer sr-only"
          />
          <div className="rounded-lg border border-border bg-input py-2 text-center text-xs text-muted-foreground peer-checked:border-muted-foreground peer-checked:bg-muted peer-checked:text-foreground">
            —
          </div>
        </label>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={String(n)}
              defaultChecked={value === n}
              className="peer sr-only"
            />
            <div className="rounded-lg border border-border bg-input py-2 text-center text-sm font-medium peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground">
              {n}
            </div>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function TextField({
  name,
  label,
  placeholder,
  defaultValue,
  rows = 2,
}: {
  name: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
  rows?: number;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full resize-y rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
      />
    </div>
  );
}
