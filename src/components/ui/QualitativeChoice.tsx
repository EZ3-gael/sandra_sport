'use client';

import { useState } from 'react';

/**
 * QualitativeChoice — liste de boutons radio verticaux avec libellés longs.
 *
 * Utilisé pour les tests cliniques T1-T5 où chaque résultat possible a un
 * libellé descriptif (ex. "Pied G n'atteint pas 90° contre pesanteur") et
 * un statut pathologique qui colore la bordure :
 *   - non pathologique : bordure neutre
 *   - pathologique     : bordure amber/red selon sévérité (auto-détecté
 *     simplement via le booléen `isPathological`)
 *
 * État local pour rerender la sélection ; valeur exposée au form natif via
 * un input caché — compatible Server Actions sans onChange custom.
 */
export type QualitativeOption = {
  value: string;
  label: string;
  isPathological: boolean;
};

export function QualitativeChoice({
  name,
  options,
  defaultValue = null,
  onChange,
}: {
  name: string;
  options: ReadonlyArray<QualitativeOption>;
  defaultValue?: string | null;
  /** Callback optionnel pour synchroniser un état parent (ex. verdict live). */
  onChange?: (next: string | null) => void;
}) {
  const [value, setValue] = useState<string | null>(defaultValue);

  function handlePick(next: string) {
    const cleared = value === next ? null : next;
    setValue(cleared);
    onChange?.(cleared);
  }

  return (
    <div className="space-y-1.5">
      <input type="hidden" name={name} value={value ?? ''} />
      {options.map((opt) => {
        const isActive = value === opt.value;
        const baseBorder = opt.isPathological
          ? 'border-amber-500/50'
          : 'border-border';
        const activeBorder = isActive
          ? opt.isPathological
            ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/10'
            : 'border-primary ring-2 ring-primary/30 bg-primary/10'
          : baseBorder;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => handlePick(opt.value)}
            aria-pressed={isActive}
            className={`flex w-full items-start gap-3 rounded-lg border bg-card p-3 text-left text-sm transition hover:border-primary/50 ${activeBorder}`}
          >
            <span
              aria-hidden
              className={`mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                isActive
                  ? opt.isPathological
                    ? 'border-amber-500 bg-amber-500'
                    : 'border-primary bg-primary'
                  : 'border-muted-foreground/40'
              }`}
            >
              {isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-background" />
              )}
            </span>
            <span className="flex-1">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
