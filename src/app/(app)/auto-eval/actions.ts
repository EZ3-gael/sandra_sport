'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  achillesMorningEvalSchema,
  computeScoreMax,
  type AchillesMorningEval,
} from '@/lib/validations/achilles-eval';

function parseScore(v: FormDataEntryValue | null): number | null {
  if (v === null || v === '') return null;
  const n = parseInt(String(v), 10);
  if (!Number.isFinite(n) || n < 0 || n > 10) return null;
  return n;
}

function parseBool(v: FormDataEntryValue | null): boolean | null {
  if (v === null || v === '') return null;
  if (v === 'true' || v === 'on') return true;
  if (v === 'false' || v === 'off') return false;
  return null;
}

function parseText(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

function parseRaisesQuality(
  v: FormDataEntryValue | null,
): AchillesMorningEval['raises_quality'] {
  if (v === null || v === '') return null;
  const s = String(v);
  if (s === 'easy' || s === 'with_discomfort' || s === 'impossible') return s;
  return null;
}

function parseFormToPayload(formData: FormData): AchillesMorningEval {
  return {
    date: String(formData.get('date') ?? ''),
    score_rest: parseScore(formData.get('score_rest')),
    score_three_steps: parseScore(formData.get('score_three_steps')),
    score_ten_raises: parseScore(formData.get('score_ten_raises')),
    score_palpation: parseScore(formData.get('score_palpation')),
    raises_quality: parseRaisesQuality(formData.get('raises_quality')),
    bonus_heel_off_done: parseBool(formData.get('bonus_heel_off_done')),
    bonus_heel_off_pain: parseScore(formData.get('bonus_heel_off_pain')),
    pain_zones: parseText(formData.get('pain_zones')),
    notes: parseText(formData.get('notes')),
  };
}

/**
 * UPSERT (insert ou update) de l'auto-éval Achille du jour.
 * Le calcul de `score_max` est fait ici, pas en DB (cohérence sur les updates).
 *
 * Contrainte unique côté DB sur (user_id, date) → upsert via onConflict.
 * Pas de sync vers `morning_checkin.achilles_score` : la colonne a été droppée
 * en migration 011, AchillesChart et palier-conditions lisent désormais
 * directement `achilles_morning_eval.score_max`.
 */
export async function saveAchillesEval(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const input = parseFormToPayload(formData);
  const parsed = achillesMorningEvalSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Données invalides.';
    redirect(`/auto-eval?error=${encodeURIComponent(msg)}`);
  }

  const score_max = computeScoreMax(parsed.data);

  const { error } = await supabase.from('achilles_morning_eval').upsert(
    {
      user_id: user.id,
      ...parsed.data,
      score_max,
    },
    { onConflict: 'user_id,date' },
  );

  if (error) {
    redirect(`/auto-eval?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/auto-eval');
  revalidatePath('/auto-eval/dashboard');
  revalidatePath('/programme');
  revalidatePath('/');
  redirect('/auto-eval/dashboard?saved=1');
}

/**
 * Supprime l'auto-éval d'un jour. Le composant client doit afficher une
 * confirmation native avant d'appeler cette action.
 */
export async function deleteAchillesEval(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase
    .from('achilles_morning_eval')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    redirect(`/auto-eval/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/auto-eval');
  revalidatePath('/auto-eval/dashboard');
  revalidatePath('/programme');
  revalidatePath('/');
  redirect('/auto-eval/dashboard?deleted=1');
}
