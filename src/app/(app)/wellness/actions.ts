'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { morningCheckinSchema } from '@/lib/validations/wellness';

function parseScore(v: FormDataEntryValue | null): number | null {
  if (v === null || v === '') return null;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
}

function parseText(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

function parseFormToPayload(formData: FormData) {
  return {
    date: String(formData.get('date') ?? ''),
    sleep_quality: parseScore(formData.get('sleep_quality')),
    physical_energy: parseScore(formData.get('physical_energy')),
    mental_energy: parseScore(formData.get('mental_energy')),
    mood: parseScore(formData.get('mood')),
    motivation: parseScore(formData.get('motivation')),
    calm: parseScore(formData.get('calm')),
    physical_comfort: parseScore(formData.get('physical_comfort')),
    pain_zones: parseText(formData.get('pain_zones')),
    notes: parseText(formData.get('notes')),
  };
}

/**
 * Insère un nouveau check-in (plusieurs par jour autorisés depuis migration 004).
 */
export async function saveCheckin(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const input = parseFormToPayload(formData);
  const parsed = morningCheckinSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Données invalides.';
    redirect(`/wellness?error=${encodeURIComponent(msg)}`);
  }

  const { error } = await supabase.from('morning_checkin').insert({
    user_id: user.id,
    source: 'manual' as const,
    ...parsed.data,
  });

  if (error) {
    redirect(`/wellness?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/wellness');
  redirect('/wellness?saved=1');
}

/**
 * Met à jour un check-in existant (par id). RLS garantit que user ne peut
 * modifier que ses propres entrées, on re-vérifie côté app par précaution.
 */
export async function updateCheckin(
  id: string,
  formData: FormData,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const input = parseFormToPayload(formData);
  const parsed = morningCheckinSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Données invalides.';
    redirect(`/wellness?error=${encodeURIComponent(msg)}`);
  }

  const { error } = await supabase
    .from('morning_checkin')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    redirect(`/wellness?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/wellness');
  redirect('/wellness?updated=1');
}

/**
 * Supprime un check-in. Le composant client doit afficher une confirmation
 * native avant d'appeler cette action (on ne refait pas de confirm côté serveur).
 */
export async function deleteCheckin(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase
    .from('morning_checkin')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    redirect(`/wellness?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/wellness');
  redirect('/wellness?deleted=1');
}
