import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { todayIso } from '@/lib/programme/dates';
import type { AchillesMorningEval } from '@/lib/validations/achilles-eval';
import { AutoEvalClient } from './AutoEvalClient';

type EvalRow = AchillesMorningEval & {
  id: string;
  user_id: string;
  captured_at: string;
  score_max: number | null;
  created_at: string;
  updated_at: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type SearchParams = Promise<{
  date?: string;
  error?: string;
}>;

export default async function AutoEvalPage({
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
  const requestedDate =
    sp.date && DATE_RE.test(sp.date) && sp.date <= today ? sp.date : today;

  const { data: existing } = await supabase
    .from('achilles_morning_eval')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', requestedDate)
    .maybeSingle<EvalRow>();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-6">
      <AutoEvalClient
        today={today}
        initialDate={requestedDate}
        existing={existing ?? null}
        error={sp.error ?? null}
      />
    </main>
  );
}
