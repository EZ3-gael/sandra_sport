import { createClient } from '@/lib/supabase/server';
import { SessionsList, type SessionRow } from './SessionsList';

export default async function SessionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().slice(0, 10);

  // Fetch large window — split en 3 buckets côté serveur. La pagination
  // arrivera quand le passé dépassera ~100 entrées.
  const { data: rows } = await supabase
    .from('sessions')
    .select(
      'id, date, slot, planned_start_time, title, session_type, status',
    )
    .eq('user_id', user!.id)
    .order('date', { ascending: false })
    .limit(200)
    .returns<SessionRow[]>();

  const all = rows ?? [];

  const todaySessions = all
    .filter((s) => s.date === today)
    .sort((a, b) =>
      (a.planned_start_time ?? '').localeCompare(b.planned_start_time ?? ''),
    );

  const upcomingSessions = all
    .filter((s) => s.date > today)
    .sort((a, b) => a.date.localeCompare(b.date)); // proche → loin

  const pastSessions = all.filter((s) => s.date < today);
  // déjà DESC depuis le SQL

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold">Séances</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Les séances sont générées par Sandra dans le workspace et syncées ici
          automatiquement.
        </p>
      </header>

      <SessionsList
        today={todaySessions}
        upcoming={upcomingSessions}
        past={pastSessions}
      />
    </main>
  );
}
