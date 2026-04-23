'use client';

import { useState } from 'react';

/**
 * RpeSlider — saisie d'un score entier via curseur snap-grid.
 *
 * - Range 1..max (défaut 10). Step 1, aucune valeur intermédiaire possible.
 * - Permet NULL (bouton réinitialiser). Règle workspace : ne pas inventer
 *   un score si l'athlete ne l'a pas exprimé.
 * - Thumb large 44×44 pour l'accessibilité tactile mobile.
 * - Si `guidance` est fourni : marqueur vertical à la valeur conseillée +
 *   jauge bicolore (pâle jusqu'au marqueur, soutenue au-delà). Sans guidance,
 *   jauge unicolore neutre — comportement par défaut (ex: RPE global
 *   post-séance n'a pas de cible).
 *
 * Usage typique dans un form natif Server Action :
 *   <RpeSlider name="rpe" defaultValue={null} max={10} />
 *   -> input caché name="rpe" avec value="1..10" ou "" si null.
 */
export function RpeSlider({
  name,
  defaultValue = null,
  max = 10,
  guidance = null,
  label,
  low = '1 — très facile',
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
  const highLabel = high ?? `${max} — effort maximal`;

  const percentValue = value !== null ? ((value - 1) / (max - 1)) * 100 : 0;
  const percentGuidance =
    guidance !== null && guidance !== undefined
      ? ((guidance - 1) / (max - 1)) * 100
      : null;

  // Styles inline pour pouvoir bind les pourcentages dynamiques.
  const trackBg = percentGuidance !== null
    ? `linear-gradient(to right,
         var(--color-primary, #007cc3) 0%,
         var(--color-primary, #007cc3) ${percentGuidance}%,
         var(--color-muted, #262626) ${percentGuidance}%,
         var(--color-muted, #262626) 100%)`
    : 'var(--color-muted, #262626)';

  return (
    <fieldset className="space-y-2">
      {label && (
        <legend className="mb-1 text-sm font-medium">{label}</legend>
      )}

      <input type="hidden" name={name} value={value ?? ''} />

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{low}</span>
        <span>{highLabel}</span>
      </div>

      <div className="relative pt-2">
        <div
          className="rpe-track absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full"
          style={{ background: trackBg }}
        />
        {percentGuidance !== null && (
          <div
            className="pointer-events-none absolute top-1/2 h-5 w-0.5 -translate-y-1/2 bg-primary"
            style={{ left: `calc(${percentGuidance}% - 1px)` }}
            aria-hidden="true"
            title={`Conseillé : ${guidance}/${max}`}
          />
        )}
        <input
          type="range"
          min={1}
          max={max}
          step={1}
          value={value ?? Math.ceil(max / 2)}
          onChange={(e) => setValue(parseInt(e.target.value, 10))}
          onClick={() => {
            if (value === null) {
              setValue(Math.ceil(max / 2));
            }
          }}
          aria-label={label ?? name}
          className="rpe-range relative z-10 w-full cursor-pointer appearance-none bg-transparent"
          style={
            {
              '--rpe-percent': `${percentValue}%`,
            } as React.CSSProperties
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <span
          className={`inline-flex h-8 min-w-[3rem] items-center justify-center rounded-md px-2 text-sm font-semibold ${
            value !== null
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-input text-muted-foreground'
          }`}
        >
          {value ?? '—'}
        </span>

        {value !== null ? (
          <button
            type="button"
            onClick={() => setValue(null)}
            className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Réinitialiser
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">
            Touche le curseur pour saisir
          </span>
        )}
      </div>
    </fieldset>
  );
}
