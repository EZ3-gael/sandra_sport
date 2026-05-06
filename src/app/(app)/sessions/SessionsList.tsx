'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SwipeToDismissCard } from '@/components/features/swipe-to-dismiss-card';

export type SessionRow = {
  id: string;
  date: string;
  slot: string | null;
  planned_start_time?: string | null;
  title: string;
  session_type: string | null;
  status: 'planned' | 'done' | 'skipped';
};

type SessionsListProps = {
  today: SessionRow[];
  upcoming: SessionRow[];
  past: SessionRow[];
};

/**
 * Page /sessions — 3 sections collapsibles.
 *
 * - Aujourd'hui : toujours visible, header sticky, pas de toggle.
 * - À venir   : tri ascendant (la plus proche en haut), expanded par défaut.
 * - Passées   : tri descendant (la dernière en haut), collapsed par défaut.
 */
export function SessionsList({ today, upcoming, past }: SessionsListProps) {
  const [openUpcoming, setOpenUpcoming] = useState(true);
  const [openPast, setOpenPast] = useState(false);

  const allEmpty =
    today.length === 0 && upcoming.length === 0 && past.length === 0;

  if (allEmpty) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center">
        <p className="text-sm font-medium">
          Pas encore de séance enregistrée.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Quand Sandra génère une séance dans le workspace, elle apparaîtra ici
          après sync.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Aujourd'hui — sticky header, toujours expanded */}
      <section>
        <SectionHeader
          title="Aujourd&apos;hui"
          count={today.length}
          variant="solid"
          sticky
        />
        {today.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {today.map((s) => (
              <SwipeToDismissCard
                key={s.id}
                sessionId={s.id}
                sessionTitle={s.title}
              >
                <SessionCardContent session={s} />
              </SwipeToDismissCard>
            ))}
          </ul>
        ) : (
          <EmptyRow>
            Pas de séance programmée aujourd&apos;hui — routine matinale ?
          </EmptyRow>
        )}
      </section>

      {/* À venir */}
      <section>
        <SectionHeader
          title="À venir"
          count={upcoming.length}
          open={openUpcoming}
          onToggle={() => setOpenUpcoming((v) => !v)}
        />
        {openUpcoming &&
          (upcoming.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {upcoming.map((s) => (
                <SwipeToDismissCard
                key={s.id}
                sessionId={s.id}
                sessionTitle={s.title}
              >
                <SessionCardContent session={s} />
              </SwipeToDismissCard>
              ))}
            </ul>
          ) : (
            <EmptyRow>
              Rien de programmé. Sandra cale la prochaine.
            </EmptyRow>
          ))}
      </section>

      {/* Passées */}
      <section>
        <SectionHeader
          title="Passées"
          count={past.length}
          open={openPast}
          onToggle={() => setOpenPast((v) => !v)}
        />
        {openPast &&
          (past.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {past.map((s) => (
                <SwipeToDismissCard
                key={s.id}
                sessionId={s.id}
                sessionTitle={s.title}
              >
                <SessionCardContent session={s} />
              </SwipeToDismissCard>
              ))}
            </ul>
          ) : (
            <EmptyRow>Aucune séance passée à afficher.</EmptyRow>
          ))}
      </section>
    </div>
  );
}

function SectionHeader({
  title,
  count,
  open,
  onToggle,
  variant = 'plain',
  sticky = false,
}: {
  title: string;
  count: number;
  open?: boolean;
  onToggle?: () => void;
  variant?: 'plain' | 'solid';
  sticky?: boolean;
}) {
  const stickyClass = sticky ? 'sticky top-0 z-10 bg-background' : '';
  const solidClass =
    variant === 'solid'
      ? 'border-b border-border bg-background py-2'
      : 'py-1';
  const isToggleable = typeof onToggle === 'function';

  const content = (
    <div className="flex items-baseline justify-between gap-2">
      <div className="flex items-center gap-2">
        {isToggleable && <Chevron open={!!open} />}
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
          {title}
        </h2>
        <span className="text-xs font-medium text-muted-foreground">
          · {count}
        </span>
      </div>
    </div>
  );

  return (
    <div className={`${stickyClass} ${solidClass}`}>
      {isToggleable ? (
        <button
          type="button"
          onClick={onToggle}
          className="w-full text-left transition hover:opacity-80"
          aria-expanded={open}
        >
          {content}
        </button>
      ) : (
        content
      )}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      className={`transition-transform ${open ? 'rotate-90' : ''}`}
    >
      <path
        d="M5 3l4 4-4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 rounded-lg border border-dashed border-border bg-card px-4 py-3 text-sm text-muted-foreground">
      {children}
    </p>
  );
}

function SessionCardContent({ session }: { session: SessionRow }) {
  return (
    <Link
      href={`/sessions/${session.id}`}
      className="block rounded-lg border border-border bg-card p-4 transition hover:border-primary/50"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium">{session.title}</span>
        <span className="text-xs text-muted-foreground">
          {session.date}
          {session.slot ? ` · ${session.slot}` : ''}
          {session.planned_start_time
            ? ` · ${session.planned_start_time.slice(0, 5)}`
            : ''}
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
