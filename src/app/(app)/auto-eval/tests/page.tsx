import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { todayIso } from '@/lib/programme/dates';
import type { ClinicalTestCode } from '@/lib/validations/clinical-test';
import { ClinicalTestsClient } from './ClinicalTestsClient';

type ClinicalTestRow = {
  id: string;
  test_code: ClinicalTestCode;
  performed_at: string;
  side: 'left' | 'right' | 'bilateral';
  result_qualitative: string | null;
  result_value_numeric: number | null;
  is_pathological: boolean | null;
  notes: string | null;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type SearchParams = Promise<{
  date?: string;
  error?: string;
}>;

export default async function ClinicalTestsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today = todayIso();
  const sp = await searchParams;

  // Si une date précise est demandée, on charge ce round.
  // Sinon on cherche le dernier round saisi pour proposer la modification,
  // ou on présente un round vierge à la date du jour si rien n'existe.
  let targetDate: string;
  let rows: ClinicalTestRow[] = [];

  if (sp.date && DATE_RE.test(sp.date) && sp.date <= today) {
    targetDate = sp.date;
    const { data } = await supabase
      .from('clinical_test')
      .select(
        'id, test_code, performed_at, side, result_qualitative, result_value_numeric, is_pathological, notes',
      )
      .eq('user_id', user.id)
      .eq('performed_at', targetDate)
      .returns<ClinicalTestRow[]>();
    rows = data ?? [];
  } else {
    const { data: latest } = await supabase
      .from('clinical_test')
      .select('performed_at')
      .eq('user_id', user.id)
      .order('performed_at', { ascending: false })
      .limit(1)
      .maybeSingle<{ performed_at: string }>();

    if (latest?.performed_at && latest.performed_at === today) {
      // Round déjà commencé aujourd'hui → on charge celui-là pour permettre l'édition
      targetDate = today;
      const { data } = await supabase
        .from('clinical_test')
        .select(
          'id, test_code, performed_at, side, result_qualitative, result_value_numeric, is_pathological, notes',
        )
        .eq('user_id', user.id)
        .eq('performed_at', targetDate)
        .returns<ClinicalTestRow[]>();
      rows = data ?? [];
    } else {
      // Pas de round aujourd'hui → on propose un nouveau round à la date du jour
      targetDate = today;
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-6">
      <ClinicalTestsClient
        today={today}
        initialDate={targetDate}
        existingRows={rows}
        error={sp.error ?? null}
      />
    </main>
  );
}
