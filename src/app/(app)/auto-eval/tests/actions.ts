'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  CLINICAL_TESTS,
  clinicalTestRoundSchema,
  isResultPathological,
  type ClinicalTestCode,
} from '@/lib/validations/clinical-test';

function parseText(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

function parseNumeric(v: FormDataEntryValue | null): number | null {
  if (v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Saisit un round complet de tests cliniques (jusqu'à 5 tests T1-T5) en une
 * transaction logique. Saisie partielle autorisée : chaque test peut être
 * sauté (rien sélectionné = pas d'insertion pour ce test).
 *
 * Pour chaque test renseigné, on UPSERT côté contrainte unique
 * (user_id, test_code, performed_at, side). `side` est forcé à la valeur du
 * catalogue (toujours 'left' en V1) pour éviter les NULL et le besoin de
 * COALESCE dans l'index.
 */
export async function saveClinicalTestRound(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const performed_at = String(formData.get('performed_at') ?? '');

  // Reconstruit les 5 tests depuis les champs nommés
  // `${code}.result_qualitative`, `${code}.notes`, `${code}.result_value_numeric`.
  const rows = CLINICAL_TESTS.map((t) => {
    const result_qualitative = parseText(
      formData.get(`${t.code}.result_qualitative`),
    );
    const notes = parseText(formData.get(`${t.code}.notes`));
    const result_value_numeric = parseNumeric(
      formData.get(`${t.code}.result_value_numeric`),
    );
    return {
      test_code: t.code,
      performed_at,
      side: t.side,
      result_qualitative,
      result_value_numeric,
      notes,
    };
  });

  const parsed = clinicalTestRoundSchema.safeParse({
    performed_at,
    tests: rows,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Données invalides.';
    redirect(`/auto-eval/tests?error=${encodeURIComponent(msg)}`);
  }

  // Filtre les tests vraiment vides (rien saisi → on n'insère pas une row vide).
  const toUpsert = parsed.data.tests
    .filter(
      (r) =>
        (r.result_qualitative !== null && r.result_qualitative !== undefined) ||
        (r.notes !== null && r.notes !== undefined),
    )
    .map((r) => ({
      user_id: user.id,
      test_code: r.test_code,
      performed_at: r.performed_at,
      side: r.side,
      result_qualitative: r.result_qualitative ?? null,
      result_value_numeric: r.result_value_numeric ?? null,
      is_pathological: isResultPathological(
        r.test_code as ClinicalTestCode,
        r.result_qualitative ?? null,
      ),
      notes: r.notes ?? null,
    }));

  if (toUpsert.length === 0) {
    redirect(
      '/auto-eval/tests?error=' + encodeURIComponent('Aucun test saisi.'),
    );
  }

  const { error } = await supabase
    .from('clinical_test')
    .upsert(toUpsert, {
      onConflict: 'user_id,test_code,performed_at,side',
    });

  if (error) {
    redirect(`/auto-eval/tests?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/auto-eval/tests');
  revalidatePath('/auto-eval/dashboard');
  redirect('/auto-eval/dashboard?tests_saved=1');
}

/**
 * Supprime tous les tests d'un round (toutes les rows partageant le même
 * `performed_at` pour cet user). Le client doit confirmer avant d'appeler.
 */
export async function deleteClinicalTestRound(
  performed_at: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase
    .from('clinical_test')
    .delete()
    .eq('user_id', user.id)
    .eq('performed_at', performed_at);

  if (error) {
    redirect(`/auto-eval/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/auto-eval/tests');
  revalidatePath('/auto-eval/dashboard');
  redirect('/auto-eval/dashboard?tests_deleted=1');
}
