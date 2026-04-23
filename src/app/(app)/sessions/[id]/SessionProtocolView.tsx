'use client';

import { useState, useTransition } from 'react';
import { toggleItemCheck } from './actions';

type ItemNode = { id: string; text: string };

type Subsection = {
  id: string;
  title: string;
  items: ItemNode[];
};

type Section = {
  id: string;
  title: string;
  type: 'notes' | 'checklist';
  default_collapsed: boolean;
  items: ItemNode[];
  subsections: Subsection[];
};

export type Protocol = {
  sections: Section[];
};

export function SessionProtocolView({
  protocol,
  sessionId,
  initialCheckedItemIds,
}: {
  protocol: Protocol | null;
  sessionId: string;
  initialCheckedItemIds: string[];
}) {
  if (!protocol || !protocol.sections || protocol.sections.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
        Protocole non structuré pour cette séance. Relance{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
          python scripts/sync_sessions.py
        </code>{' '}
        pour parser le markdown en sections cochables.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {protocol.sections.map((s) => (
        <SectionView
          key={s.id}
          section={s}
          sessionId={sessionId}
          initialCheckedItemIds={initialCheckedItemIds}
        />
      ))}
    </div>
  );
}

function SectionView({
  section,
  sessionId,
  initialCheckedItemIds,
}: {
  section: Section;
  sessionId: string;
  initialCheckedItemIds: string[];
}) {
  const [open, setOpen] = useState(!section.default_collapsed);

  // Compte des items cochés pour cette section (pour afficher "3/8")
  const { total, checked } = countItems(section, initialCheckedItemIds);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition hover:bg-muted/50"
      >
        <span className="flex items-center gap-2">
          <Chevron open={open} />
          <span className="font-medium">{section.title}</span>
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {section.type === 'checklist' && total > 0 && (
            <span
              className={
                checked === total
                  ? 'rounded-md bg-primary/20 px-2 py-0.5 font-medium text-primary'
                  : 'rounded-md bg-muted px-2 py-0.5'
              }
            >
              {checked} / {total}
            </span>
          )}
        </span>
      </button>

      {open && (
        <div className="border-t border-border px-4 py-3 space-y-3">
          {section.items.length > 0 && (
            <ItemList
              items={section.items}
              type={section.type}
              sessionId={sessionId}
              initialCheckedItemIds={initialCheckedItemIds}
            />
          )}

          {section.subsections.map((sub) => (
            <div key={sub.id} className="space-y-1.5">
              <h3 className="text-sm font-semibold">{sub.title}</h3>
              <ItemList
                items={sub.items}
                type={section.type}
                sessionId={sessionId}
                initialCheckedItemIds={initialCheckedItemIds}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ItemList({
  items,
  type,
  sessionId,
  initialCheckedItemIds,
}: {
  items: ItemNode[];
  type: 'notes' | 'checklist';
  sessionId: string;
  initialCheckedItemIds: string[];
}) {
  if (items.length === 0) return null;

  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <ItemRow
          key={item.id}
          item={item}
          type={type}
          sessionId={sessionId}
          initiallyChecked={initialCheckedItemIds.includes(item.id)}
        />
      ))}
    </ul>
  );
}

function ItemRow({
  item,
  type,
  sessionId,
  initiallyChecked,
}: {
  item: ItemNode;
  type: 'notes' | 'checklist';
  sessionId: string;
  initiallyChecked: boolean;
}) {
  const [checked, setChecked] = useState(initiallyChecked);
  const [isPending, startTransition] = useTransition();

  if (type !== 'checklist') {
    return (
      <li className="flex gap-2 text-sm text-muted-foreground">
        <span className="select-none text-border">•</span>
        <span
          className="flex-1"
          dangerouslySetInnerHTML={{ __html: renderInlineMd(item.text) }}
        />
      </li>
    );
  }

  function handleToggle() {
    // Optimistic update
    setChecked((c) => !c);
    startTransition(async () => {
      try {
        await toggleItemCheck(sessionId, item.id);
      } catch {
        // Rollback si échec (peu probable, le redirect se fait silencieux)
        setChecked(initiallyChecked);
      }
    });
  }

  return (
    <li className="flex items-start gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        aria-pressed={checked}
        aria-label={checked ? 'Décocher' : 'Cocher'}
        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition ${
          checked
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-input hover:border-primary/50'
        } disabled:opacity-60`}
      >
        {checked && <CheckIcon />}
      </button>
      <span
        className={`flex-1 text-sm transition ${
          checked ? 'text-muted-foreground line-through' : 'text-foreground'
        }`}
        dangerouslySetInnerHTML={{ __html: renderInlineMd(item.text) }}
      />
    </li>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
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

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M2.5 6L5 8.5 9.5 3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function countItems(
  section: Section,
  checkedIds: string[],
): { total: number; checked: number } {
  const allItems: ItemNode[] = [
    ...section.items,
    ...section.subsections.flatMap((s) => s.items),
  ];
  const total = allItems.length;
  const checked = allItems.filter((i) => checkedIds.includes(i.id)).length;
  return { total, checked };
}

/**
 * Rendu inline minimal du markdown : gras (**texte**) et italique (*texte*).
 * Les items du protocole utilisent ces deux seulement. Tailwind pas nécessaire,
 * on reste en HTML natif.
 */
function renderInlineMd(s: string): string {
  // Escape HTML d'abord (sécurité basique)
  const escaped = s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
