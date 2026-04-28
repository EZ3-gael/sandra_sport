import type { MetadataRoute } from 'next';

/**
 * Manifest PWA — fait reconnaître l'app comme installable par Chrome Android.
 *
 * Next.js sert ce fichier sous `/manifest.webmanifest` et injecte automatiquement
 * la balise <link rel="manifest"> dans le <head>.
 *
 * Les icônes sont des PNG 192/512 + maskable 512 + un SVG en fallback.
 * Chrome Android exige des PNG aux dimensions exactes 192x192 et 512x512
 * pour cocher le critère d'installabilité — un SVG `sizes:"any"` seul ne
 * suffit pas et l'événement beforeinstallprompt ne se déclenche pas.
 *
 * Les PNG sont générés depuis les SVG sources via `scripts/generate-pwa-icons.mjs`.
 * À régénérer (et committer) si on touche aux SVG sources.
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
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
