'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { loginSchema } from '@/lib/validations/auth';

/**
 * Connexion email + password via Supabase.
 *
 * - Succès : session créée, redirect vers /wellness.
 * - Échec : redirect vers /login?error=... avec message explicite.
 */
export async function signInWithPassword(formData: FormData): Promise<void> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Données invalides.';
    redirect(`/login?error=${encodeURIComponent(msg)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent(
        error.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect.'
          : error.message,
      )}`,
    );
  }

  revalidatePath('/', 'layout');
  redirect('/wellness');
}
