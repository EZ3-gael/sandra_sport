import Link from 'next/link';
import { signInWithPassword } from './actions';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset_sent?: string; reset_ok?: string }>;
}) {
  const params = await searchParams;
  const error = params.error ? decodeURIComponent(params.error) : null;
  const resetSent = params.reset_sent === '1';
  const resetOk = params.reset_ok === '1';

  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">Sandra Sport</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connexion avec email et mot de passe.
          </p>
        </div>

        {resetSent && (
          <div className="mb-4 rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm text-primary">
            Lien de réinitialisation envoyé. Ouvre ton mail pour continuer.
          </div>
        )}
        {resetOk && (
          <div className="mb-4 rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm text-primary">
            Mot de passe mis à jour. Connecte-toi ci-dessous.
          </div>
        )}

        <form action={signInWithPassword} className="space-y-4" autoComplete="on">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="ton.email@exemple.com"
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium"
            >
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              minLength={8}
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            Se connecter
          </button>
        </form>

        <p className="mt-4 text-center text-xs">
          <Link
            href="/auth/forgot-password"
            className="text-muted-foreground hover:text-foreground"
          >
            Mot de passe oublié ?
          </Link>
        </p>
      </div>
    </main>
  );
}
