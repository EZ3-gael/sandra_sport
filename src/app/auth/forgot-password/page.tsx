import Link from 'next/link';
import { sendPasswordReset } from './actions';

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error ? decodeURIComponent(params.error) : null;

  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Mot de passe oublié</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Saisis ton email, tu recevras un lien pour réinitialiser ton mot de
            passe.
          </p>
        </div>

        <form action={sendPasswordReset} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
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

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            Envoyer le lien
          </button>
        </form>

        <p className="mt-4 text-center text-xs">
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground"
          >
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  );
}
