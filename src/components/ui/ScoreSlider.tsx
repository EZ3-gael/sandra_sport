'use client';

import { useState } from 'react';

/**
 * ScoreSlider — saisie d'un score entier via curseur snap-grid.
 *
 * Conçu pour deux usages principaux :
 *   - RPE séances (1-10) : `min={1} max={10}` (défaut)
 *   - Douleur 0-10 : `min={0} max={10}` (auto-éval Achille, mesures cliniques)
 *
 * Deux modes d'affichage :
 *   - défaut : tous les chiffres min..max au-dessus de la barre, cliquables.
 *     Tient pour 10 valeurs ou moins. Au-delà, l'écran mobile déborde.
 *   - `compact` : un seul carré centré affichant la valeur courante (avec code
 *     couleur douleur emerald/amber/red). Pas de tap direct sur un chiffre,
 *     mais le tap sur la barre fonctionne via l'<input type="range"> natif.
 *     Recommandé pour 0-10 et tout range trop large pour la rangée standard.
 *
 * Design commun :
 * - Track horizontal avec tick marks visibles à chaque cran entier.
 * - Thumb visuel rond au-dessus de la valeur courante (purement visuel, le
 *   drag est géré par un <input type="range"> invisible superposé).
 * - Si `guidance` fourni : jauge pâle jusqu'à la valeur conseillée + marqueur
 *   vertical. Sans guidance, jauge unicolore primary jusqu'à la valeur courante.
 * - NULL autorisé via bouton "Réinitialiser" (règle workspace : ne pas inventer
 *   un score si l'athlete ne l'a pas exprimé).
 *
 * Usage typique dans un form natif Server Action :
 *   <ScoreSlider name="rpe" min={1} max={10} defaultValue={null} />
 *   <ScoreSlider name="score_rest" min={0} max={10} compact defaultValue={null} />
 *   -> input caché name=... avec value="<int>" ou "" si null.
 */
export function ScoreSlider({
  name,
  defaultValue = null,
  min = 1,
  max = 10,
  guidance = null,
  label,
  low,
  high,
  compact = false,
  onValueChange,
}: {
  name: string;
  defaultValue?: number | null;
  min?: number;
  max?: number;
  guidance?: number | null;
  label?: string;
  low?: string;
  high?: string;
  /**
   * Mode compact : remplace la rangée de chiffres par un seul carré central
   * affichant la valeur courante. Recommandé pour les ranges qui débordent
   * sur mobile (typiquement 0-10 = 11 chiffres).
   */
  compact?: boolean;
  /** Callback notifié à chaque changement (uncontrolled : state interne géré). */
  onValueChange?: (next: number | null) => void;
}) {
  const [value, setValueRaw] = useState<number | null>(defaultValue);
  const setValue = (next: number | null) => {
    setValueRaw(next);
    onValueChange?.(next);
  };
  const range = max - min;
  const values = Array.from({ length: range + 1 }, (_, i) => i + min);
  const middle = min + Math.floor(range / 2);

  const percentOf = (n: number) => (range === 0 ? 0 : ((n - min) / range) * 100);
  const valuePct = value !== null ? percentOf(value) : null;
  const guidancePct =
    guidance !== null && guidance !== undefined ? percentOf(guidance) : null;

  const lowLabel = low ?? `${min}`;
  const highLabel = high ?? `${max}`;

  return (
    <fieldset className="space-y-3">
      {label && <legend className="text-sm font-medium">{label}</legend>}

      <input type="hidden" name={name} value={value ?? ''} />

      {compact ? (
        <CurrentValueCard value={value} max={max} />
      ) : (
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
      )}

      {/* Zone du slider : track + ticks + thumb visuel + input range invisible */}
      <div className="relative h-10 select-none">
        {/* Track de fond (gris neutre) */}
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-muted" />

        {/* Zone jusqu'au guidance — jauge pâle */}
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
          min={min}
          max={max}
          step={1}
          value={value ?? middle}
          onChange={(e) => setValue(parseInt(e.target.value, 10))}
          onPointerDown={() => {
            if (value === null) {
              setValue(middle);
            }
          }}
          aria-label={label ?? name}
          className="absolute inset-0 z-20 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0"
        />
      </div>

      {/* Labels extrêmes sous la barre */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>

      {/* Hint / reset */}
      <div className="flex min-h-[24px] items-center justify-between text-xs">
        {value === null ? (
          <span className="text-muted-foreground">
            {compact
              ? 'Glisse le curseur ou tape sur la barre.'
              : 'Glisse le curseur ou tape un chiffre.'}
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

/**
 * Carré centré affichant la valeur courante (ou "—" si null).
 * Code couleur sémantique douleur 0-10 : vert ≤ 1, amber 2-3, rouge ≥ 4.
 * Pour les ranges sans sémantique douleur (ex. RPE), le mode compact n'est
 * en pratique pas utilisé, mais le code couleur reste cohérent (un score
 * élevé reste un signal d'alerte côté coach).
 */
function CurrentValueCard({
  value,
  max,
}: {
  value: number | null;
  max: number;
}) {
  const colorClass =
    value === null
      ? 'border-border bg-muted text-muted-foreground'
      : value >= 4
        ? 'border-red-500 bg-red-500 text-white'
        : value >= 2
          ? 'border-amber-500 bg-amber-500 text-white'
          : 'border-emerald-500 bg-emerald-500 text-white';
  return (
    <div className="flex justify-center">
      <div
        className={`flex h-14 w-20 items-center justify-center rounded-lg border-2 text-2xl font-semibold tabular-nums transition-colors ${colorClass}`}
        aria-live="polite"
      >
        {value === null ? '—' : `${value}/${max}`}
      </div>
    </div>
  );
}
