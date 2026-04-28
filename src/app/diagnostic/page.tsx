import { PWADiagnostic } from '@/components/PWADiagnostic';

export const metadata = {
  title: 'Diagnostic PWA — Sandra Sport',
};

export default function DiagnosticPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Diagnostic PWA</h1>
        <p className="text-sm text-muted-foreground">
          Cette page vérifie en direct ce que ton navigateur voit. Lis les
          résultats à voix haute (ou copie-colle) pour qu&apos;on identifie ce
          qui bloque l&apos;installation.
        </p>
      </header>
      <PWADiagnostic />
    </main>
  );
}
