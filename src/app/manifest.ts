import type { MetadataRoute } from 'next';

/**
 * Manifest PWA — fait reconnaître l'app comme installable par Chrome Android.
 *
 * Next.js sert ce fichier sous `/manifest.webmanifest` et injecte automatiquement
 * la balise <link rel="manifest"> dans le <head>.
 *
 * Les icônes sont des SVG placeholder (lettre "S" sur fond bleu Sandra).
 * Le maskable a une safe zone réduite pour résister au masque circulaire
 * Android. À remplacer par un vrai logo quand on en aura un.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sandra Sport',
    short_name: 'Sandra',
    description:
      'Coaching sportif personnel — suivi séances, wellness et nutrition.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    lang: 'fr',
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
