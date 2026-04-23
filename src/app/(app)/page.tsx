import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  CHECKIN_DIMENSIONS,
  type MorningCheckin,
} from '@/lib/validations/wellness';

type CheckinRow = MorningCheckin & {
  id: string;
  captured_at: string;
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

      {/* Alerte check-in */}
      {!todayCheckin ? (
        <AlertCard
          tone="primary"
          title="Check-in du jour à faire"
          body="Comment tu te sens ce matin ? Ça prend 30 secondes et ça calibre la suite."
          ctaLabel="Faire le check-in"
          ctaHref="/wellness"
        />
      ) : (
        <CheckinSummaryCard entry={todayCheckin} />
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

      {/* Mini-timeline des derniers check-ins */}
      {recentCheckins && recentCheckins.length > 0 && (
        <>
          <SectionHeader>Derniers check-ins</SectionHeader>
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

function CheckinSummaryCard({ entry }: { entry: CheckinRow }) {
  const time = new Date(entry.captured_at).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const avg = averageScore(entry);
  return (
    <Link
      href="/wellness"
      className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/50"
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">Check-in de ce matin</h3>
        <span className="text-xs text-muted-foreground">{time} · moy. {avg}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {CHECKIN_DIMENSIONS.map((dim) => {
          const v = entry[dim.key];
          if (typeof v !== 'number') return null;
          return (
            <span
              key={dim.key}
              className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
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
  return `${avg.toFixed(1)}/5`;
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
