/**
 * TextField — champ texte multiligne stylisé pour formulaires natifs.
 *
 * Factorisé depuis WellnessClient.tsx pour réutilisation par /auto-eval et
 * /auto-eval/tests. Pas de validation côté client : c'est un container de
 * <textarea> avec un label, le reste passe par les Server Actions et Zod.
 */
export function TextField({
  name,
  label,
  placeholder,
  defaultValue,
  rows = 2,
}: {
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  rows?: number;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full resize-y rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
      />
    </div>
  );
}
