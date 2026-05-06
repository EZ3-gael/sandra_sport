import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { type MorningCheckin } from '@/lib/validations/wellness';

type CheckinRow = MorningCheckin & {
  id: string;
  captured_at: string;
};

type AchillesEvalRow = {
  id: string;
  date: string;
  captured_at: string;
  score_max: number | null;
  bonus_heel_off_done: boolean | null;
};

type SessionRow = {
  id: string;
  date: string;
  slot: string | null;
  planned_start_time: string | null;
  title: string;
  session_type: string | null;
  status: 'planned' | 'done' | 'skipped';
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();

  // Auto-éval Achille du jour (1/jour, contrainte unique)
  const { data: todayAchilles } = await supabase
    .from('achilles_morning_eval')
    .select('id, date, captured_at, score_max, bonus_heel_off_done')
    .eq('user_id', user!.id)
    .eq('date', today)
    .maybeSingle<AchillesEvalRow>();

  // Check-in du jour (dernier de la journée si plusieurs)
  const { data: todayCheckins } = await supabase
    .from('morning_checkin')
    .select('*')
    .eq('user_id', user!.id)
    .eq('date', today)
    .order('captured_at', { ascending: false })
    .limit(1)
    .returns<CheckinRow[]>();
  const todayCheckin = todayCheckins?.[0] ?? null;

  // Séance du jour (planned ou done)
  const { data: todaySessions } = await supabase
    .from('sessions')
    .select('id, date, slot, planned_start_time, title, session_type, status')
    .eq('user_id', user!.id)
    .eq('date', today)
    .order('planned_start_time', { ascending: true, nullsFirst: false })
    .returns<SessionRow[]>();

  // Prochaine séance planifiée (hors aujourd'hui, si rien aujourd'hui)
  const { data: nextSessions } =
    todaySessions && todaySessions.length > 0
      ? { data: null }
      : await supabase
          .from('sessions')
          .select('id, date, slot, planned_start_time, title, session_type, status')
          .eq('user_id', user!.id)
          .eq('status', 'planned')
          .gt('date', today)
          .order('date', { ascending: true })
          .limit(1)
          .returns<SessionRow[]>();

  // Dernière séance faite (pour récap)
  const { data: lastDone } = await supabase
    .from('sessions')
    .select('id, date, slot, planned_start_time, title, session_type, status')
    .eq('user_id', user!.id)
    .eq('status', 'done')
    .lt('date', today)
    .order('date', { ascending: false })
    .limit(1)
    .returns<SessionRow[]>();

  // 3 derniers check-ins pour mini-timeline
  const { data: recentCheckins } = await supabase
    .from('morning_checkin')
    .select('*')
    .eq('user_id', user!.id)
    .order('captured_at', { ascending: false })
    .limit(3)
    .returns<CheckinRow[]>();

  const firstName = user?.email?.split('@')[0] ?? 'toi';
  const greeting = greetingForHour(new Date());

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6">
      <header>
        <p className="text-sm text-muted-foreground">{greeting}</p>
        <h1 className="mt-1 text-2xl font-semibold capitalize">{firstName}</h1>
        <p className="mt-1 text-xs text-muted-foreground">{formatToday(nowIso)}</p>
      </header>

      {/* Auto-éval Achille — premier geste au réveil, avant tout mouvement */}
      {!todayAchilles ? (
        <AlertCard
          tone="primary"
          title="Auto-éval Achille à faire"
          body="Au réveil, avant de poser le pied au sol. 60 secondes max."
          ctaLabel="Faire l'auto-éval"
          ctaHref="/auto-eval"
        />
      ) : (
        <AchillesSummaryCard entry={todayAchilles} />
      )}

      {/* Auto-éval Ressenti — état d'éveil 7 dimensions */}
      {!todayCheckin ? (
        <AlertCard
          tone="primary"
          title="Auto-éval Ressenti à faire"
          body="Comment tu te sens ce matin ? Ça prend 30 secondes et ça calibre la suite."
          ctaLabel="Faire l'auto-éval"
          ctaHref="/wellness"
        />
      ) : (
        <WellnessSummaryCard entry={todayCheckin} />
      )}

      {/* Séance du jour ou prochaine */}
      {todaySessions && todaySessions.length > 0 ? (
        <SectionHeader>Aujourd&apos;hui</SectionHeader>
      ) : nextSessions && nextSessions.length > 0 ? (
        <SectionHeader>À venir</SectionHeader>
      ) : null}

      {todaySessions && todaySessions.length > 0 ? (
        <ul className="space-y-2">
          {todaySessions.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </ul>
      ) : nextSessions && nextSessions.length > 0 ? (
        <ul className="space-y-2">
          {nextSessions.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </ul>
      ) : (
        <EmptyCard>
          Aucune séance planifiée. Sandra générera la prochaine quand le
          protocole du jour sera calé.
        </EmptyCard>
      )}

      {/* Dernière séance faite */}
      {lastDone && lastDone.length > 0 && (
        <>
          <SectionHeader>Dernière séance</SectionHeader>
          <ul className="space-y-2">
            {lastDone.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </ul>
        </>
      )}

      {/* Mini-timeline des dernières auto-évals ressenti */}
      {recentCheckins && recentCheckins.length > 0 && (
        <>
          <SectionHeader>Dernières auto-évals ressenti</SectionHeader>
          <ul className="space-y-2">
            {recentCheckins.map((c) => (
              <CheckinTimelineRow key={c.id} entry={c} />
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

// ----------------------------------------------------------------------------
// UI sub-components
// ----------------------------------------------------------------------------

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="-mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
  );
}

function EmptyCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function AlertCard({
  tone,
  title,
  body,
  ctaLabel,
  ctaHref,
}: {
  tone: 'primary' | 'warning';
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  const toneClasses =
    tone === 'primary'
      ? 'border-primary/40 bg-primary/10'
      : 'border-destructive/40 bg-destructive/10';
  return (
    <div className={`rounded-xl border ${toneClasses} p-4`}>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      <Link
        href={ctaHref}
        className="mt-3 inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

function AchillesSummaryCard({ entry }: { entry: AchillesEvalRow }) {
  const time = new Date(entry.captured_at).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const colorClass =
    entry.score_max === null
      ? 'text-muted-foreground'
      : entry.score_max >= 4
        ? 'text-red-500'
        : entry.score_max >= 2
          ? 'text-amber-500'
          : 'text-emerald-500';
  const bonusBadge =
    entry.bonus_heel_off_done === true
      ? '✓ bonus'
      : entry.bonus_heel_off_done === false
        ? '✗ bonus'
        : null;
  return (
    <Link
      href="/auto-eval/dashboard"
      className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/50"
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">Auto-éval Achille</h3>
        <span className="text-xs text-muted-foreground">{time}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-3">
        <span className={`text-2xl font-semibold tabular-nums ${colorClass}`}>
          {entry.score_max === null ? '—' : `${entry.score_max}/10`}
        </span>
        {bonusBadge && (
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {bonusBadge}
          </span>
        )}
        <span className="ml-auto text-xs text-primary">voir le suivi →</span>
      </div>
    </Link>
  );
}

function WellnessSummaryCard({ entry }: { entry: CheckinRow }) {
  const time = new Date(entry.captured_at).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const avg = averageScoreNumber(entry);
  const colorClass =
    avg === null
      ? 'text-muted-foreground'
      : avg >= 4
        ? 'text-emerald-500'
        : avg >= 2.5
          ? 'text-amber-500'
          : 'text-red-500';
  return (
    <Link
      href="/wellness/dashboard"
      className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/50"
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">Auto-éval Ressenti</h3>
        <span className="text-xs text-muted-foreground">{time}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-3">
        <span className={`text-2xl font-semibold tabular-nums ${colorClass}`}>
          {avg === null ? '—' : `${avg.toFixed(1)}/5`}
        </span>
        <span className="ml-auto text-xs text-primary">voir le suivi →</span>
      </div>
    </Link>
  );
}

function CheckinTimelineRow({ entry }: { entry: CheckinRow }) {
  const dt = new Date(entry.captured_at);
  const dateStr = dt.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
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
      {entry.pain_zones && (
        <p className="mt-1 text-xs text-destructive">
          Douleurs : {entry.pain_zones}
        </p>
      )}
    </li>
  );
}

function SessionCard({ session }: { session: SessionRow }) {
  return (
    <li>
      <Link
        href={`/sessions/${session.id}`}
        className="block rounded-lg border border-border bg-card p-4 transition hover:border-primary/50"
      >
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-medium">{session.title}</span>
          <span className="text-xs text-muted-foreground">
            {session.date}
            {session.slot ? ` · ${session.slot}` : ''}
            {session.planned_start_time ? ` · ${session.planned_start_time.slice(0, 5)}` : ''}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs">
          {session.session_type && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
              {session.session_type}
            </span>
          )}
          <StatusBadge status={session.status} />
        </div>
      </Link>
    </li>
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

// ----------------------------------------------------------------------------
// Utils
// ----------------------------------------------------------------------------

function averageScoreNumber(r: Partial<MorningCheckin>): number | null {
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
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function averageScore(r: Partial<MorningCheckin>): string {
  const avg = averageScoreNumber(r);
  return avg === null ? '—' : `${avg.toFixed(1)}/5`;
}

function greetingForHour(d: Date): string {
  const h = d.getHours();
  if (h < 6) return 'Dans la nuit';
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon aprèm';
  return 'Bonsoir';
}

function formatToday(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
