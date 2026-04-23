import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Fusion de classes Tailwind avec résolution des conflits.
 * Standard shadcn/ui : `cn('p-4', conditional && 'p-6')` → 'p-6' gagne.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
