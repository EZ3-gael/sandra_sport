'use client';

import { useEffect } from 'react';

/**
 * Enregistre le service worker au mount, une seule fois par chargement.
 *
 * On ne register qu'en production : en dev, le SW met en cache des bundles
 * Next.js qui changent à chaque rebuild, ce qui rend le HMR pénible.
 *
 * Le SW lui-même vit dans `public/sw.js` (servi sous `/sw.js`).
 */
export function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Service worker registration failed:', err);
      });
    };

    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad, { once: true });
      return () => window.removeEventListener('load', onLoad);
    }
  }, []);

  return null;
}
