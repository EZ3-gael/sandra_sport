import Link from 'next/link';

export const metadata = {
  title: 'Hors ligne — Sandra Sport',
};

export default function OfflinePage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold">Pas de connexion</h1>
      <p className="text-muted-foreground">
        Tu es hors ligne. Les pages déjà consultées restent disponibles depuis
        le cache, mais tu ne peux pas saisir de nouvelles données ni rafraîchir
        tes séances tant que tu n&apos;es pas reconnecté.
      </p>
      <p className="text-sm text-muted-foreground">
        Reconnecte-toi au réseau pour synchroniser.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Réessayer
      </Link>
    </main>
  );
}
