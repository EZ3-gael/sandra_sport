import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { updatePassword } from './actions';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error ? decodeURIComponent(params.error) : null;

  // La session doit être établie (via /auth/callback après clic sur lien reset).
  // Sans session, redirect vers login avec message explicite.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      '/login?error=' +
        encodeURIComponent(
          'Lien expiré ou invalide. Redemande un mail de réinitialisation.',
        ),
    );
  }

  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Nouveau mot de passe</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pour <span className="font-medium text-foreground">{user.email}</span>.
            Minimum 8 caractères.
          </p>
        </div>

        <form action={updatePassword} className="space-y-4" autoComplete="on">
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium"
            >
              Nouveau mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <div>
            <label
              htmlFor="password_confirm"
              className="mb-1.5 block text-sm font-medium"
            >
              Confirmer
            </label>
            <input
              id="password_confirm"
              name="password_confirm"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            Enregistrer
          </button>
        </form>
      </div>
    </main>
  );
}
