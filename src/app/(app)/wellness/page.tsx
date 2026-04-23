import { createClient } from '@/lib/supabase/server';
import { saveCheckin } from './actions';
import {
  CHECKIN_DIMENSIONS,
  type MorningCheckin,
} from '@/lib/validations/wellness';

type CheckinRow = MorningCheckin & {
  id: string;
  user_id: string;
  captured_at: string;
  source: string;
  created_at: string;
  updated_at: string;
};

export default async function WellnessPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const saved = params.saved === '1';
  const errorMsg = params.error ? decodeURIComponent(params.error) : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().slice(0, 10);

  // 20 derniers check-ins (toutes sources confondues), du plus récent au plus ancien
  const { data: recent } = await supabase
    .from('morning_checkin')
    .select('*')
    .eq('user_id', user!.id)
    .order('captured_at', { ascending: false })
    .limit(20)
    .returns<CheckinRow[]>();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Check-in</h1>
        <span className="text-sm text-muted-foreground">{today}</span>
      </header>

      {saved && (
        <div className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
          Check-in enregistré.
        </div>
      )}
      {errorMsg && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMsg}
        </div>
      )}

      <form
        action={saveCheckin}
        className="space-y-6 rounded-xl border border-border bg-card p-4"
      >
        <input type="hidden" name="date" value={today} />

        <p className="text-xs text-muted-foreground">
          Un nouveau check-in peut être saisi à tout moment de la journée (matin,
          après séance, soir). Laisse vide les dimensions non exprimées.
        </p>

        {CHECKIN_DIMENSIONS.map((dim) => (
          <ScoreRow
            key={dim.key}
            name={dim.key}
            label={dim.label}
            low={dim.low}
            high={dim.high}
          />
        ))}

        <TextField
          name="pain_zones"
          label="Zones de douleur (optionnel)"
          placeholder="ex : quadriceps, mollet droit"
          rows={2}
        />
        <TextField
          name="notes"
          label="Notes libres (optionnel)"
          placeholder="ressenti, contexte, observations, verbatim matinal…"
          rows={4}
        />

        <button
          type="submit"
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          Enregistrer
        </button>
      </form>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Timeline — 20 dernières saisies
        </h2>
        {recent && recent.length > 0 ? (
          <ul className="space-y-2">
            {recent.map((r) => (
              <CheckinCard key={r.id} entry={r} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucun check-in pour l&apos;instant.
          </p>
        )}
      </section>
    </main>
  );
}

function CheckinCard({ entry }: { entry: CheckinRow }) {
  const dt = new Date(entry.captured_at);
  const dateStr = dt.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
  const timeStr = dt.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <li className="rounded-lg border border-border bg-card p-3 text-sm">
      <div className="flex items-baseline justify-between">
        <span className="font-medium">
          {dateStr} · {timeStr}
        </span>
        <span className="text-xs text-muted-foreground">
          {averageScore(entry)}
        </span>
      </div>
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
        <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
          {entry.notes}
        </p>
      )}
    </li>
  );
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
}: {
  name: string;
  label: string;
  low: string;
  high: string;
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
            defaultChecked
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
  rows = 2,
}: {
  name: string;
  label: string;
  placeholder: string;
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
        className="w-full resize-y rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
      />
    </div>
  );
}
