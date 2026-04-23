'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { resetPasswordSchema } from '@/lib/validations/auth';

/**
 * Met à jour le password de l'utilisateur authentifié.
 *
 * Appelé depuis /auth/reset-password après le clic sur le lien de reset,
 * une fois que /auth/callback a établi la session.
 */
export async function updatePassword(formData: FormData): Promise<void> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get('password'),
    password_confirm: formData.get('password_confirm'),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Données invalides.';
    redirect(`/auth/reset-password?error=${encodeURIComponent(msg)}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?error=' + encodeURIComponent('Lien expiré. Redemande un nouveau mail de reset.'));
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    redirect(
      `/auth/reset-password?error=${encodeURIComponent(error.message)}`,
    );
  }

  // On signe out pour forcer un login avec le nouveau password (UX + sécurité).
  await supabase.auth.signOut();
  redirect('/login?reset_ok=1');
}
