'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type ActionResult = { ok: true } | { ok: false; error: string };

export async function dismissSession(sessionId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'Non authentifié.' };
  }

  const { error } = await supabase
    .from('sessions')
    .update({ dismissed_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath('/');
  revalidatePath('/sessions');
  return { ok: true };
}

export async function restoreSession(sessionId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'Non authentifié.' };
  }

  const { error } = await supabase
    .from('sessions')
    .update({ dismissed_at: null })
    .eq('id', sessionId)
    .eq('user_id', user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath('/');
  revalidatePath('/sessions');
  return { ok: true };
}
