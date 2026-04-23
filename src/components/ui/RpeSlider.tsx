'use client';

import { useState } from 'react';

/**
 * RpeSlider — saisie d'un score entier via curseur snap-grid.
 *
 * Design :
 * - Track horizontal avec tick marks visibles à chaque cran entier.
 * - Chiffres 1..max sous la barre, **cliquables** (double usage : drag ET tap).
 * - Chiffre actif en highlight primary. Pas de "gros carré valeur" redondant —
 *   le chiffre actif sous la barre suffit, et il reste visible même quand le
 *   doigt est sur le thumb.
 * - Thumb visuel rond au-dessus de la valeur courante (purement visuel, le
 *   drag est géré par un <input type="range"> invisible superposé).
 * - Si `guidance` fourni : jauge pâle jusqu'à la valeur conseillée + marqueur
 *   vertical. Sans guidance, jauge unicolore primary jusqu'à la valeur courante.
 * - NULL autorisé via bouton "Réinitialiser" (règle workspace : ne pas inventer
 *   un score si l'athlete ne l'a pas exprimé).
 *
 * Usage typique dans un form natif Server Action :
 *   <RpeSlider name="rpe" defaultValue={null} max={10} />
 *   -> input caché name="rpe" avec value="1..max" ou "" si null.
 */
export function RpeSlider({
  name,
  defaultValue = null,
  max = 10,
  guidance = null,
  label,
  low,
  high,
}: {
  name: string;
  defaultValue?: number | null;
  max?: number;
  guidance?: number | null;
  label?: string;
  low?: string;
  high?: string;
}) {
  const [value, setValue] = useState<number | null>(defaultValue);
  const values = Array.from({ length: max }, (_, i) => i + 1);

  const percentOf = (n: number) => ((n - 1) / (max - 1)) * 100;
  const valuePct = value !== null ? percentOf(value) : null;
  const guidancePct =
    guidance !== null && guidance !== undefined ? percentOf(guidance) : null;

  const lowLabel = low ?? '1 — très facile';
  const highLabel = high ?? `${max} — effort maximal`;

  return (
    <fieldset className="space-y-3">
      {label && <legend className="text-sm font-medium">{label}</legend>}

      <input type="hidden" name={name} value={value ?? ''} />

      {/* Zone du slider : track + ticks + thumb visuel + input range invisible */}
      <div className="relative h-10 select-none">
        {/* Track de fond (gris neutre) */}
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-muted" />

        {/* Zone jusqu'au guidance — jauge pâle (V1.5e, non utilisée V1.5a) */}
        {guidancePct !== null && (
          <div
            className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-primary/25"
            style={{ width: `${guidancePct}%` }}
            aria-hidden="true"
          />
        )}

        {/* Zone jusqu'à la valeur courante — couleur primaire */}
        {valuePct !== null && (
          <div
            className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-primary"
            style={{ width: `${valuePct}%` }}
            aria-hidden="true"
          />
        )}

        {/* Tick marks — petits "trous" (traits background) aux positions entières */}
        {values.map((n) => (
          <div
            key={`tick-${n}`}
            className="pointer-events-none absolute top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-background"
            style={{ left: `${percentOf(n)}%` }}
            aria-hidden="true"
          />
        ))}

        {/* Marqueur guidance (trait vertical) */}
        {guidancePct !== null && (
          <div
            className="pointer-events-none absolute top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
            style={{ left: `${guidancePct}%` }}
            title={`Conseillé : ${guidance}/${max}`}
          />
        )}

        {/* Thumb visuel rond */}
        {valuePct !== null && (
          <div
            className="pointer-events-none absolute top-1/2 z-10 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-background bg-primary shadow-lg"
            style={{ left: `${valuePct}%` }}
            aria-hidden="true"
          />
        )}

        {/* Input range transparent — capture le drag sur toute la largeur */}
        <input
          type="range"
          min={1}
          max={max}
          step={1}
          value={value ?? Math.ceil(max / 2)}
          onChange={(e) => setValue(parseInt(e.target.value, 10))}
          onPointerDown={() => {
            if (value === null) {
              setValue(Math.ceil(max / 2));
            }
          }}
          aria-label={label ?? name}
          className="absolute inset-0 z-20 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0"
        />
      </div>

      {/* Chiffres 1..max sous la barre — cliquables, actif en highlight */}
      <div className="flex justify-between px-0.5">
        {values.map((n) => {
          const isActive = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => setValue(n)}
              className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold transition ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              aria-label={`Sélectionner ${n}`}
              aria-pressed={isActive}
            >
              {n}
            </button>
          );
        })}
      </div>

      {/* Labels extrêmes */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>

      {/* Hint / reset */}
      <div className="flex min-h-[24px] items-center justify-between text-xs">
        {value === null ? (
          <span className="text-muted-foreground">
            Glisse le curseur ou tape un chiffre.
          </span>
        ) : (
          <>
            <span className="text-muted-foreground">
              {guidance !== null && guidance !== undefined && (
                <>
                  Conseillé{' '}
                  <span className="text-foreground">
                    {guidance}/{max}
                  </span>
                </>
              )}
            </span>
            <button
              type="button"
              onClick={() => setValue(null)}
              className="rounded-md px-2 py-1 text-muted-foreground hover:text-foreground"
            >
              Réinitialiser
            </button>
          </>
        )}
      </div>
    </fieldset>
  );
}
