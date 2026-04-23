import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient } from '@/lib/supabase/server';
import { saveSessionNote } from './actions';

type SessionRow = {
  id: string;
  user_id: string;
  date: string;
  slot: string | null;
  planned_start_time: string | null;
  title: string;
  session_type: string | null;
  status: 'planned' | 'done' | 'skipped';
  context: string | null;
  source: string;
  source_file: string | null;
};

type SessionNoteRow = {
  id: string;
  captured_at: string;
  notes_struct: {
    rpe?: number;
    fatigue?: number;
    zones_douleur?: string[];
  } | null;
  notes_brut: string | null;
};

export default async function SessionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const qs = await searchParams;
  const saved = qs.saved === '1';
  const errorMsg = qs.error ? decodeURIComponent(qs.error) : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .maybeSingle<SessionRow>();

  if (!session) {
    notFound();
  }

  const { data: notes } = await supabase
    .from('session_notes')
    .select('id, captured_at, notes_struct, notes_brut')
    .eq('session_id', id)
    .eq('user_id', user!.id)
    .order('captured_at', { ascending: false })
    .returns<SessionNoteRow[]>();

  const saveAction = saveSessionNote.bind(null, id);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6">
      <header>
        <Link
          href="/sessions"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Séances
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{session.title}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{session.date}</span>
          {session.slot && <span>· {session.slot}</span>}
          {session.planned_start_time && (
            <span>· {session.planned_start_time}</span>
          )}
          {session.session_type && (
            <span className="rounded-md bg-muted px-2 py-0.5">
              {session.session_type}
            </span>
          )}
          <StatusBadge status={session.status} />
        </div>
      </header>

      {saved && (
        <div className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
          Ressenti enregistré.
        </div>
      )}
      {errorMsg && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMsg}
        </div>
      )}

      {session.context && (
        <article
          className="prose prose-invert prose-sm max-w-none rounded-xl border border-border bg-card p-4
                     prose-headings:text-foreground prose-strong:text-foreground prose-p:text-muted-foreground
                     prose-li:text-muted-foreground prose-a:text-primary"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {session.context}
          </ReactMarkdown>
        </article>
      )}

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-4 text-lg font-semibold">Ressenti post-séance</h2>

        <form action={saveAction} className="space-y-5">
          <RpeRow />

          <FatigueRow />

          <div>
            <label
              htmlFor="zones_douleur"
              className="mb-1.5 block text-sm font-medium"
            >
              Zones de douleur (séparées par virgules, optionnel)
            </label>
            <input
              id="zones_douleur"
              name="zones_douleur"
              type="text"
              placeholder="ex : achille droit, quadriceps gauche"
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <div>
            <label
              htmlFor="notes_brut"
              className="mb-1.5 block text-sm font-medium"
            >
              Notes libres
            </label>
            <textarea
              id="notes_brut"
              name="notes_brut"
              rows={4}
              placeholder="ressenti global, difficultés, observations..."
              className="w-full resize-y rounded-lg border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <StatusRow current={session.status} />

          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            Enregistrer le ressenti
          </button>
        </form>
      </section>

      {notes && notes.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Historique des ressentis
          </h2>
          <ul className="space-y-2">
            {notes.map((n) => (
              <li
                key={n.id}
                className="rounded-lg border border-border bg-card p-3 text-sm"
              >
                <div className="text-xs text-muted-foreground">
                  {new Date(n.captured_at).toLocaleString('fr-FR')}
                </div>
                {n.notes_struct && (
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    {typeof n.notes_struct.rpe === 'number' && (
                      <span className="rounded-md bg-muted px-2 py-0.5">
                        RPE {n.notes_struct.rpe}/10
                      </span>
                    )}
                    {typeof n.notes_struct.fatigue === 'number' && (
                      <span className="rounded-md bg-muted px-2 py-0.5">
                        Fatigue {n.notes_struct.fatigue}/5
                      </span>
                    )}
                    {n.notes_struct.zones_douleur &&
                      n.notes_struct.zones_douleur.length > 0 && (
                        <span className="rounded-md bg-destructive/20 px-2 py-0.5 text-destructive">
                          Douleurs : {n.notes_struct.zones_douleur.join(', ')}
                        </span>
                      )}
                  </div>
                )}
                {n.notes_brut && (
                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {n.notes_brut}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function StatusBadge({ status }: { status: SessionRow['status'] }) {
  const styles: Record<SessionRow['status'], string> = {
    planned: 'bg-accent text-accent-foreground',
    done: 'bg-primary/20 text-primary',
    skipped: 'bg-destructive/20 text-destructive',
  };
  const labels: Record<SessionRow['status'], string> = {
    planned: 'Prévue',
    done: 'Faite',
    skipped: 'Sautée',
  };
  return (
    <span className={`rounded-md px-2 py-0.5 ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function RpeRow() {
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium">RPE — intensité perçue</legend>
      <p className="mb-2 text-xs text-muted-foreground">
        1 = très facile · 10 = effort maximal
      </p>
      <div className="grid grid-cols-11 gap-1">
        <label className="cursor-pointer">
          <input
            type="radio"
            name="rpe"
            value=""
            defaultChecked
            className="peer sr-only"
          />
          <div className="rounded-md border border-border bg-input py-1.5 text-center text-xs text-muted-foreground peer-checked:border-muted-foreground peer-checked:bg-muted peer-checked:text-foreground">
            —
          </div>
        </label>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <label key={n} className="cursor-pointer">
            <input
              type="radio"
              name="rpe"
              value={String(n)}
              className="peer sr-only"
            />
            <div className="rounded-md border border-border bg-input py-1.5 text-center text-xs font-medium peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground">
              {n}
            </div>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function FatigueRow() {
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium">Fatigue post-séance</legend>
      <p className="mb-2 text-xs text-muted-foreground">
        1 = frais · 5 = vidé
      </p>
      <div className="grid grid-cols-6 gap-1.5">
        <label className="cursor-pointer">
          <input
            type="radio"
            name="fatigue"
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
              name="fatigue"
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

function StatusRow({ current }: { current: SessionRow['status'] }) {
  const options: { value: SessionRow['status']; label: string }[] = [
    { value: 'done', label: 'Faite' },
    { value: 'planned', label: 'Prévue' },
    { value: 'skipped', label: 'Sautée' },
  ];
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">Statut de la séance</legend>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => (
          <label key={opt.value} className="cursor-pointer">
            <input
              type="radio"
              name="status"
              value={opt.value}
              defaultChecked={current === opt.value}
              className="peer sr-only"
            />
            <div className="rounded-lg border border-border bg-input py-2 text-center text-sm font-medium peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground">
              {opt.label}
            </div>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
