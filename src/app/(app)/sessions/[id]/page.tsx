import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { saveSessionNote } from './actions';
import {
  SessionProtocolView,
  type Protocol,
} from './SessionProtocolView';

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
  protocol: Protocol | null;
  source: string;
  source_file: string | null;
};

type SessionNoteStruct = {
  rpe?: number;
  post_session_energy?: number;
  zones_douleur?: string[];
};

type SessionNoteRow = {
  id: string;
  captured_at: string;
  notes_struct: SessionNoteStruct | null;
  notes_brut: string | null;
};

type ItemCheckRow = {
  item_id: string;
  checked_at: string;
};

export default async function SessionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string; edit?: string }>;
}) {
  const { id } = await params;
  const qs = await searchParams;
  const saved = qs.saved === '1';
  const errorMsg = qs.error ? decodeURIComponent(qs.error) : null;
  const editRequested = qs.edit === '1';

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

  // Un seul ressenti par (user_id, session_id) depuis la migration 006.
  // On conserve .limit(1) par robustesse applicative au cas où d'anciennes
  // rows auraient échappé à la dédup.
  const { data: notesRaw } = await supabase
    .from('session_notes')
    .select('id, captured_at, notes_struct, notes_brut')
    .eq('session_id', id)
    .eq('user_id', user!.id)
    .order('captured_at', { ascending: false })
    .limit(1)
    .returns<SessionNoteRow[]>();

  const existingNote = notesRaw?.[0] ?? null;

  // Mode 'edit' si explicitement demandé OU si aucun ressenti encore saisi.
  // Sinon mode 'view' : récap read-only + bouton Modifier.
  const mode = editRequested || !existingNote ? 'edit' : 'view';

  const { data: checks } = await supabase
    .from('session_item_checks')
    .select('item_id, checked_at')
    .eq('session_id', id)
    .eq('user_id', user!.id)
    .returns<ItemCheckRow[]>();

  const checkedItemIds = (checks ?? []).map((c) => c.item_id);

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

      <SessionProtocolView
        protocol={session.protocol}
        sessionId={session.id}
        initialCheckedItemIds={checkedItemIds}
      />

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Ressenti post-séance</h2>
          {mode === 'view' && (
            <Link
              href={`/sessions/${session.id}?edit=1`}
              className="text-xs font-medium text-primary hover:underline"
            >
              Modifier
            </Link>
          )}
        </div>

        {mode === 'view' && existingNote ? (
          <RessentiView note={existingNote} />
        ) : (
          <form action={saveAction} className="space-y-5">
            <RpeRow defaultRpe={existingNote?.notes_struct?.rpe ?? null} />
            <PostSessionEnergyRow
              defaultEnergy={
                existingNote?.notes_struct?.post_session_energy ?? null
              }
            />

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
                defaultValue={
                  existingNote?.notes_struct?.zones_douleur?.join(', ') ?? ''
                }
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
                defaultValue={existingNote?.notes_brut ?? ''}
                className="w-full resize-y rounded-lg border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>

            <StatusRow current={session.status} />

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                {existingNote ? 'Mettre à jour' : 'Enregistrer le ressenti'}
              </button>
              {existingNote && editRequested && (
                <Link
                  href={`/sessions/${session.id}`}
                  className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                >
                  Annuler
                </Link>
              )}
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

function RessentiView({ note }: { note: SessionNoteRow }) {
  const struct = note.notes_struct;
  const hasStruct =
    struct &&
    (typeof struct.rpe === 'number' ||
      typeof struct.post_session_energy === 'number' ||
      (struct.zones_douleur && struct.zones_douleur.length > 0));

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">
        Saisi le {new Date(note.captured_at).toLocaleString('fr-FR')}
      </div>

      {hasStruct && struct && (
        <div className="flex flex-wrap gap-2 text-xs">
          {typeof struct.rpe === 'number' && (
            <span className="rounded-md bg-muted px-2 py-1">
              RPE {struct.rpe}/10
            </span>
          )}
          {typeof struct.post_session_energy === 'number' && (
            <span className="rounded-md bg-muted px-2 py-1">
              Énergie {struct.post_session_energy}/5
            </span>
          )}
          {struct.zones_douleur && struct.zones_douleur.length > 0 && (
            <span className="rounded-md bg-destructive/20 px-2 py-1 text-destructive">
              Douleurs : {struct.zones_douleur.join(', ')}
            </span>
          )}
        </div>
      )}

      {note.notes_brut && (
        <p className="whitespace-pre-wrap rounded-lg bg-muted/40 px-3 py-2 text-sm">
          {note.notes_brut}
        </p>
      )}

      {!hasStruct && !note.notes_brut && (
        <p className="text-sm text-muted-foreground italic">
          Ressenti saisi sans contenu — clique sur Modifier pour le compléter.
        </p>
      )}
    </div>
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

function RpeRow({ defaultRpe }: { defaultRpe: number | null }) {
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
            defaultChecked={defaultRpe === null}
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
              defaultChecked={defaultRpe === n}
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

function PostSessionEnergyRow({
  defaultEnergy,
}: {
  defaultEnergy: number | null;
}) {
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium">Énergie post-séance</legend>
      <p className="mb-2 text-xs text-muted-foreground">
        1 = vidé · 5 = au top
      </p>
      <div className="grid grid-cols-6 gap-1.5">
        <label className="cursor-pointer">
          <input
            type="radio"
            name="post_session_energy"
            value=""
            defaultChecked={defaultEnergy === null}
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
              name="post_session_energy"
              value={String(n)}
              defaultChecked={defaultEnergy === n}
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
