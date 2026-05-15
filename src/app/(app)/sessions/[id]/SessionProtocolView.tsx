'use client';

import { useState, useTransition } from 'react';
import { toggleItemCheck } from './actions';

type ItemNode = {
  id: string;
  text: string;
  kind?: 'item' | 'heading' | 'note' | 'paragraph' | 'bullet';
};

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
          python scripts/session_sync.py
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
  // Accordéon des sous-blocs : un seul ouvert à la fois, tous fermés au départ.
  const [openSubId, setOpenSubId] = useState<string | null>(null);

  // Compte des exercices cochés (items directs de la section + de ses sous-blocs).
  const { total, checked } = countTasks(
    [...section.items, ...section.subsections.flatMap((sub) => sub.items)],
    initialCheckedItemIds,
  );

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
          {total > 0 && <CountBadge checked={checked} total={total} />}
        </span>
      </button>

      {open && (
        <div className="border-t border-border px-4 py-3 space-y-3">
          {section.items.length > 0 && (
            <ItemList
              items={section.items}
              sessionId={sessionId}
              initialCheckedItemIds={initialCheckedItemIds}
            />
          )}

          {section.subsections.map((sub) => (
            <SubsectionView
              key={sub.id}
              subsection={sub}
              open={openSubId === sub.id}
              onToggle={() =>
                setOpenSubId((id) => (id === sub.id ? null : sub.id))
              }
              sessionId={sessionId}
              initialCheckedItemIds={initialCheckedItemIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SubsectionView({
  subsection,
  open,
  onToggle,
  sessionId,
  initialCheckedItemIds,
}: {
  subsection: Subsection;
  open: boolean;
  onToggle: () => void;
  sessionId: string;
  initialCheckedItemIds: string[];
}) {
  const { total, checked } = countTasks(subsection.items, initialCheckedItemIds);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition hover:bg-muted/50"
      >
        <span className="flex items-center gap-2">
          <Chevron open={open} />
          <span className="text-sm font-semibold">{subsection.title}</span>
        </span>
        {total > 0 && <CountBadge checked={checked} total={total} />}
      </button>

      {open && (
        <div className="border-t border-border px-3 py-2">
          <ItemList
            items={subsection.items}
            sessionId={sessionId}
            initialCheckedItemIds={initialCheckedItemIds}
          />
        </div>
      )}
    </div>
  );
}

function CountBadge({ checked, total }: { checked: number; total: number }) {
  return (
    <span
      className={`whitespace-nowrap rounded-md px-2 py-0.5 text-xs tabular-nums ${
        checked === total
          ? 'bg-primary/20 font-medium text-primary'
          : 'bg-muted text-muted-foreground'
      }`}
    >
      {checked} / {total}
    </span>
  );
}

function ItemList({
  items,
  sessionId,
  initialCheckedItemIds,
}: {
  items: ItemNode[];
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
          sessionId={sessionId}
          initiallyChecked={initialCheckedItemIds.includes(item.id)}
        />
      ))}
    </ul>
  );
}

function ItemRow({
  item,
  sessionId,
  initiallyChecked,
}: {
  item: ItemNode;
  sessionId: string;
  initiallyChecked: boolean;
}) {
  const [checked, setChecked] = useState(initiallyChecked);
  const [isPending, startTransition] = useTransition();

  // Heading : titre d'exo non-cochable (ex. "**Exo 1 — Mollets chargés**").
  // S'affiche en gras, sans puce ni checkbox.
  if (item.kind === 'heading') {
    return (
      <li className="pt-2 text-sm font-semibold text-foreground first:pt-0">
        <span dangerouslySetInnerHTML={{ __html: renderInlineMd(item.text) }} />
      </li>
    );
  }

  // Note : tip technique (syntaxe markdown `> texte`). Italique gris, indenté,
  // non-cochable. Visuellement attaché à l'item précédent.
  if (item.kind === 'note') {
    return (
      <li className="-mt-1 pl-7 text-xs italic text-muted-foreground">
        <span dangerouslySetInnerHTML={{ __html: renderInlineMd(item.text) }} />
      </li>
    );
  }

  // Paragraphe : prose libre (texte plein, pas de puce ni de checkbox).
  if (item.kind === 'paragraph') {
    return (
      <li className="text-sm leading-relaxed text-foreground">
        <span dangerouslySetInnerHTML={{ __html: renderInlineMd(item.text) }} />
      </li>
    );
  }

  // Puce : note à puce non-cochable (syntaxe markdown `- texte`). Consigne,
  // rappel, contexte — tout ce qui se lit sans se cocher.
  if (item.kind === 'bullet') {
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

  // kind 'item' (ou défaut) : exercice / action cochable (syntaxe `[ ] texte`).
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

/**
 * Compte les exercices cochables (kind "item") dans une liste de nœuds, et
 * combien sont déjà cochés. Headings, notes, paragraphes et puces sont ignorés.
 */
function countTasks(
  items: ItemNode[],
  checkedIds: string[],
): { total: number; checked: number } {
  const tasks = items.filter((i) => (i.kind ?? 'item') === 'item');
  const total = tasks.length;
  const checked = tasks.filter((i) => checkedIds.includes(i.id)).length;
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
