import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type SessionRow = {
  id: string;
  date: string;
  slot: string | null;
  title: string;
  session_type: string | null;
  status: 'planned' | 'done' | 'skipped';
};

export default async function SessionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, date, slot, title, session_type, status')
    .eq('user_id', user!.id)
    .order('date', { ascending: false })
    .limit(30)
    .returns<SessionRow[]>();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold">Séances</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Les séances sont générées par Sandra dans le workspace et syncées ici
          automatiquement.
        </p>
      </header>

      {sessions && sessions.length > 0 ? (
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/sessions/${s.id}`}
                className="block rounded-lg border border-border bg-card p-4 transition hover:border-primary/50"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{s.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.date}
                    {s.slot ? ` · ${s.slot}` : ''}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  {s.session_type && (
                    <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                      {s.session_type}
                    </span>
                  )}
                  <StatusBadge status={s.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center">
          <p className="text-sm font-medium">Pas encore de séance enregistrée.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Quand Sandra génère une séance dans le workspace, elle apparaîtra
            ici après sync.
          </p>
        </div>
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
