import { signInWithOtp } from './actions';

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  return <LoginContent searchParams={searchParams} />;
}

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;
  const sent = params.sent === '1';
  const error = params.error;

  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">Sandra Sport</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connexion par lien magique envoyé par email.
          </p>
        </div>

        {sent ? (
          <div className="rounded-lg border border-border bg-muted p-4 text-sm">
            <p className="font-medium">Lien envoyé.</p>
            <p className="mt-1 text-muted-foreground">
              Ouvre ton mail et clique sur le lien reçu pour te connecter.
              Vérifie les spams si besoin.
            </p>
          </div>
        ) : (
          <form action={signInWithOtp} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="ton.email@exemple.com"
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">
                {decodeURIComponent(error)}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              Envoyer le lien magique
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Aucun mot de passe à saisir. Le lien t&apos;authentifie pour 1 h.
        </p>
      </div>
    </main>
  );
}
