'use client';

import { useEffect, useState } from 'react';

type Status = 'pending' | 'ok' | 'fail';

type Probe = {
  label: string;
  status: Status;
  detail?: string;
};

type IconProbe = Probe & { url: string };

const ICON_URLS = [
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
];

function readDisplayMode(): string {
  if (typeof window === 'undefined') return '';
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone (déjà installée)';
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui';
  }
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen';
  }
  return 'browser (non installée)';
}

export function PWADiagnostic() {
  const [userAgent] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.userAgent : '',
  );
  const [displayMode] = useState(readDisplayMode);
  const [swStatus, setSwStatus] = useState<Probe>(() =>
    typeof navigator !== 'undefined' && 'serviceWorker' in navigator
      ? { label: 'Service worker', status: 'pending' }
      : {
          label: 'Service worker',
          status: 'fail',
          detail: 'navigator.serviceWorker indisponible.',
        },
  );
  const [manifestStatus, setManifestStatus] = useState<Probe>({
    label: 'Manifest',
    status: 'pending',
  });
  const [iconProbes, setIconProbes] = useState<IconProbe[]>(
    ICON_URLS.map((url) => ({
      label: url,
      url,
      status: 'pending' as Status,
    })),
  );
  const [installPromptStatus, setInstallPromptStatus] = useState<Probe>({
    label: 'Événement beforeinstallprompt',
    status: 'pending',
    detail: 'En attente — Chrome déclenche cet événement quand tous les critères sont OK.',
  });
  const [installEvent, setInstallEvent] = useState<Event | null>(null);
  const [installResult, setInstallResult] = useState<string | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistration()
        .then((reg) => {
          if (reg) {
            const state =
              reg.active?.state ??
              reg.installing?.state ??
              reg.waiting?.state ??
              'unknown';
            setSwStatus({
              label: 'Service worker',
              status: 'ok',
              detail: `Enregistré, scope: ${reg.scope}, state: ${state}`,
            });
          } else {
            setSwStatus({
              label: 'Service worker',
              status: 'fail',
              detail: 'Aucun service worker enregistré sur cette origine.',
            });
          }
        })
        .catch((err) => {
          setSwStatus({
            label: 'Service worker',
            status: 'fail',
            detail: `Erreur getRegistration: ${err.message}`,
          });
        });
    }

    fetch('/manifest.webmanifest', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) {
          setManifestStatus({
            label: 'Manifest',
            status: 'fail',
            detail: `HTTP ${res.status}`,
          });
          return;
        }
        const json = (await res.json()) as { icons?: { sizes?: string; type?: string }[] };
        const icons = json.icons ?? [];
        const sizes = icons.map((i) => i.sizes ?? '?').join(', ');
        const types = Array.from(new Set(icons.map((i) => i.type ?? '?'))).join(', ');
        setManifestStatus({
          label: 'Manifest',
          status: 'ok',
          detail: `${icons.length} icônes — sizes: ${sizes} — types: ${types}`,
        });
      })
      .catch((err) => {
        setManifestStatus({
          label: 'Manifest',
          status: 'fail',
          detail: `Fetch failed: ${err.message}`,
        });
      });

    ICON_URLS.forEach((url) => {
      fetch(url, { method: 'HEAD', cache: 'no-store' })
        .then((res) => {
          setIconProbes((prev) =>
            prev.map((p) =>
              p.url === url
                ? {
                    ...p,
                    status: res.ok ? 'ok' : 'fail',
                    detail: `HTTP ${res.status} — ${res.headers.get('content-type') ?? 'no content-type'}`,
                  }
                : p,
            ),
          );
        })
        .catch((err) => {
          setIconProbes((prev) =>
            prev.map((p) =>
              p.url === url
                ? { ...p, status: 'fail', detail: `Fetch failed: ${err.message}` }
                : p,
            ),
          );
        });
    });

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e);
      setInstallPromptStatus({
        label: 'Événement beforeinstallprompt',
        status: 'ok',
        detail: 'Capté — Chrome considère l\'app installable. Bouton ci-dessous pour déclencher.',
      });
    };

    const onAppInstalled = () => {
      setInstallResult('Installation confirmée !');
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);

    const timeout = setTimeout(() => {
      setInstallPromptStatus((prev) =>
        prev.status === 'pending'
          ? {
              ...prev,
              status: 'fail',
              detail:
                'Pas déclenché après 8s. Chrome refuse l\'installation — un critère ci-dessus doit échouer.',
            }
          : prev,
      );
    }, 8000);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
      clearTimeout(timeout);
    };
  }, []);

  async function triggerInstall() {
    if (!installEvent) return;
    const ev = installEvent as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
    };
    try {
      await ev.prompt();
      const choice = await ev.userChoice;
      setInstallResult(
        choice.outcome === 'accepted'
          ? 'Installation acceptée.'
          : 'Installation refusée par l\'utilisateur.',
      );
      setInstallEvent(null);
    } catch (err) {
      setInstallResult(`Erreur: ${(err as Error).message}`);
    }
  }

  const allProbes: Probe[] = [
    swStatus,
    manifestStatus,
    ...iconProbes,
    installPromptStatus,
  ];

  return (
    <div className="flex flex-col gap-4">
      <InfoLine label="User-Agent" value={userAgent || '…'} />
      <InfoLine label="Display mode" value={displayMode || '…'} />

      <ul className="flex flex-col gap-2">
        {allProbes.map((probe, i) => (
          <ProbeRow key={i} probe={probe} />
        ))}
      </ul>

      {installEvent && (
        <button
          type="button"
          onClick={triggerInstall}
          className="rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
        >
          Installer Sandra Sport
        </button>
      )}

      {installResult && (
        <p className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
          {installResult}
        </p>
      )}

      <div className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">Critères Chrome Android</p>
        <p>
          Pour déclencher beforeinstallprompt : HTTPS, manifest valide avec icônes
          PNG 192 et 512, service worker actif avec un fetch handler, et au moins
          30 secondes d&apos;interaction sur le domaine.
        </p>
      </div>
    </div>
  );
}

function ProbeRow({ probe }: { probe: Probe }) {
  const icon =
    probe.status === 'ok' ? '✓' : probe.status === 'fail' ? '✗' : '…';
  const tone =
    probe.status === 'ok'
      ? 'text-primary'
      : probe.status === 'fail'
        ? 'text-destructive'
        : 'text-muted-foreground';
  return (
    <li className="rounded-lg border border-border bg-card p-3 text-sm">
      <div className="flex items-baseline gap-2">
        <span className={`font-mono text-base font-bold ${tone}`}>{icon}</span>
        <span className="font-medium">{probe.label}</span>
      </div>
      {probe.detail && (
        <p className="mt-1 ml-6 text-xs text-muted-foreground">{probe.detail}</p>
      )}
    </li>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-input px-3 py-2 text-xs">
      <span className="font-medium text-muted-foreground">{label} : </span>
      <span className="font-mono break-all">{value}</span>
    </div>
  );
}
