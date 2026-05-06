'use client';

import { useTransition } from 'react';
import { deleteClinicalTestRound } from '../../tests/actions';

export function DeleteRoundButton({ performedAt }: { performedAt: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const ok = window.confirm(
      `Supprimer définitivement le round du ${performedAt} ?\n\nCette action est irréversible.`,
    );
    if (!ok) return;
    startTransition(async () => {
      await deleteClinicalTestRound(performedAt);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="rounded-md border border-destructive/40 bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/20 disabled:opacity-50"
    >
      Supprimer
    </button>
  );
}
