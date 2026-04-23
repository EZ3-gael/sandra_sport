'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { forgotPasswordSchema } from '@/lib/validations/auth';

/**
 * Envoie un mail de réinitialisation de mot de passe.
 *
 * Le mail contient un lien qui redirige vers /auth/callback?next=/auth/reset-password.
 * La session est établie au retour, l'utilisateur peut alors poser son nouveau password.
 */
export async function sendPasswordReset(formData: FormData): Promise<void> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get('email'),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Email invalide.';
    redirect(`/auth/forgot-password?error=${encodeURIComponent(msg)}`);
  }

  const supabase = await createClient();

  const headersList = await headers();
  const protocol = headersList.get('x-forwarded-proto') ?? 'http';
  const host = headersList.get('host') ?? 'localhost:3000';
  const origin = `${protocol}://${host}`;

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
  });

  if (error) {
    redirect(
      `/auth/forgot-password?error=${encodeURIComponent(error.message)}`,
    );
  }

  // Pour ne pas divulguer si l'email existe, on redirige toujours vers le même état.
  redirect('/login?reset_sent=1');
}
