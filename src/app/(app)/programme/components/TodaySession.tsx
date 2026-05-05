/**
 * Brique 2 — Séance du jour. Réutilise SessionProtocolView (déjà gérant
 * accordéons + checkboxes) pour ne pas dupliquer la logique.
 */

import Link from 'next/link';
import {
  SessionProtocolView,
  type Protocol,
} from '@/app/(app)/sessions/[id]/SessionProtocolView';

export type TodaySessionData = {
  id: string;
  date: string;
  slot: string | null;
  title: string;
  session_type: string | null;
  status: 'planned' | 'done' | 'skipped';
  protocol: Protocol | null;
};

type TodaySessionProps = {
  session: TodaySessionData | null;
  checkedItemIds: string[];
  /** true si la phase démarre dans le futur — bloc info plutôt que séance vide */
  programNotStartedYet: boolean;
};

export function TodaySession({
  session,
  checkedItemIds,
  programNotStartedYet,
}: TodaySessionProps) {
  if (!session) {
    return (
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Séance du jour
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {programNotStartedYet
            ? 'Pas de séance programmée — protocole pas encore démarré.'
            : 'Pas de séance programmée aujourd\'hui. Routine matinale recommandée.'}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Séance du jour
        </h2>
        <span className="text-xs text-muted-foreground">
          {session.date}
          {session.slot ? ` · ${session.slot}` : ''}
        </span>
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-2">
        <h3 className="text-base font-medium">{session.title}</h3>
        <StatusBadge status={session.status} />
      </div>

      <div className="mt-3">
        <SessionProtocolView
          protocol={session.protocol}
          sessionId={session.id}
          initialCheckedItemIds={checkedItemIds}
        />
      </div>

      <div className="mt-3 flex justify-end">
        <Link
          href={`/sessions/${session.id}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          Saisir le ressenti post-séance →
        </Link>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: TodaySessionData['status'] }) {
  const styles: Record<TodaySessionData['status'], string> = {
    planned: 'bg-accent text-accent-foreground',
    done: 'bg-primary/20 text-primary',
    skipped: 'bg-destructive/20 text-destructive',
  };
  const labels: Record<TodaySessionData['status'], string> = {
    planned: 'Prévue',
    done: 'Faite',
    skipped: 'Sautée',
  };
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
