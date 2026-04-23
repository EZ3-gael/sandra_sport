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

  const { data: todayCheckin } = await supabase
    .from('morning_checkin')
    .select('*')
    .eq('user_id', user!.id)
    .eq('date', today)
    .maybeSingle<CheckinRow>();

  const { data: recent } = await supabase
    .from('morning_checkin')
    .select(
      'date, sleep_quality, physical_energy, mental_energy, mood, motivation, calm, physical_comfort, pain_zones',
    )
    .eq('user_id', user!.id)
    .order('date', { ascending: false })
    .limit(7);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Check-in du matin</h1>
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

      <form action={saveCheckin} className="space-y-6 rounded-xl border border-border bg-card p-4">
        <input type="hidden" name="date" value={today} />

        {CHECKIN_DIMENSIONS.map((dim) => (
          <ScoreRow
            key={dim.key}
            name={dim.key}
            label={dim.label}
            low={dim.low}
            high={dim.high}
            value={todayCheckin?.[dim.key] ?? null}
          />
        ))}

        <TextField
          name="pain_zones"
          label="Zones de douleur (optionnel)"
          placeholder="ex : quadriceps, mollet droit"
          defaultValue={todayCheckin?.pain_zones ?? ''}
          rows={2}
        />
        <TextField
          name="verbatim"
          label="Verbatim (optionnel)"
          placeholder="tes mots du matin, extraits bruts"
          defaultValue={todayCheckin?.verbatim ?? ''}
          rows={2}
        />
        <TextField
          name="notes"
          label="Notes libres (optionnel)"
          placeholder="observations, contexte"
          defaultValue={todayCheckin?.notes ?? ''}
          rows={3}
        />

        <button
          type="submit"
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          {todayCheckin ? 'Mettre à jour' : 'Enregistrer'}
        </button>
      </form>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          7 derniers jours
        </h2>
        {recent && recent.length > 0 ? (
          <ul className="space-y-2">
            {recent.map((r) => (
              <li
                key={r.date}
                className="rounded-lg border border-border bg-card p-3 text-sm"
              >
                <div className="flex justify-between">
                  <span className="font-medium">{r.date}</span>
                  <span className="text-muted-foreground">
                    {averageScore(r)}
                  </span>
                </div>
                {r.pain_zones && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Douleurs : {r.pain_zones}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucun check-in enregistré pour l&apos;instant.
          </p>
        )}
      </section>
    </main>
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
  return `moy. ${avg.toFixed(1)} / 5 (${values.length}/7 dim.)`;
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
