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

export async function saveCheckin(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const input = {
    date: String(formData.get('date') ?? ''),
    sleep_quality: parseScore(formData.get('sleep_quality')),
    physical_energy: parseScore(formData.get('physical_energy')),
    mental_energy: parseScore(formData.get('mental_energy')),
    mood: parseScore(formData.get('mood')),
    motivation: parseScore(formData.get('motivation')),
    calm: parseScore(formData.get('calm')),
    physical_comfort: parseScore(formData.get('physical_comfort')),
    pain_zones: parseText(formData.get('pain_zones')),
    verbatim: parseText(formData.get('verbatim')),
    notes: parseText(formData.get('notes')),
  };

  const parsed = morningCheckinSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Données invalides.';
    redirect(`/wellness?error=${encodeURIComponent(msg)}`);
  }

  const { error } = await supabase.from('morning_checkin').upsert(
    {
      user_id: user.id,
      source: 'manual' as const,
      ...parsed.data,
    },
    { onConflict: 'user_id,date' },
  );

  if (error) {
    redirect(`/wellness?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/wellness');
  redirect('/wellness?saved=1');
}
