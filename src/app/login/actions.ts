'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const loginSchema = z.object({
  email: z.string().email('Email invalide.').toLowerCase(),
});

/**
 * Envoie un magic link à l'email donné.
 * L'utilisateur reçoit un lien qui le redirige vers /auth/callback?code=...
 */
export async function signInWithOtp(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Email invalide.';
    redirect(`/login?error=${encodeURIComponent(msg)}`);
  }

  const supabase = await createClient();

  const headersList = await headers();
  const protocol = headersList.get('x-forwarded-proto') ?? 'http';
  const host = headersList.get('host') ?? 'localhost:3000';
  const origin = `${protocol}://${host}`;

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent(
        error.message || "Impossible d'envoyer le lien.",
      )}`,
    );
  }

  redirect('/login?sent=1');
}
