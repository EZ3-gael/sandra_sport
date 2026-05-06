import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { addDaysIso, todayIso } from '@/lib/programme/dates';
import {
  computeAchillesStreak,
  type AchillesEvalDay,
} from '@/lib/programme/achilles-streak';
import type { ClinicalTestCode } from '@/lib/validations/clinical-test';
import { TodayCard } from './components/TodayCard';
import { TrendStats } from './components/TrendStats';
import { MultiScoreChart } from './components/MultiScoreChart';
import { ComplianceCalendar } from './components/ComplianceCalendar';
import { ClinicalTestsCard, type ClinicalTestRow } from './components/ClinicalTestsCard';
import { RecentNotes } from './components/RecentNotes';

type EvalRow = {
  id: string;
  date: string;
  captured_at: string;
  score_rest: number | null;
  score_three_steps: number | null;
  score_ten_raises: number | null;
  score_palpation: number | null;
  score_max: number | null;
  bonus_heel_off_done: boolean | null;
  pain_zones: string | null;
  notes: string | null;
};

type ClinicalTestDbRow = {
  test_code: ClinicalTestCode;
  performed_at: string;
  result_qualitative: string | null;
  is_pathological: boolean | null;
  notes: string | null;
};

type SearchParams = Promise<{
  saved?: string;
  updated?: string;
  deleted?: string;
  tests_saved?: string;
  tests_deleted?: string;
  error?: string;
}>;

export default async function AutoEvalDashboardPage({
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
  const thirtyDaysAgo = addDaysIso(today, -30);
  const sixtyDaysAgo = addDaysIso(today, -60);
  const oneYearAgo = addDaysIso(today, -365);

  const [
    todayEvalRes,
    recent30Res,
    recent60Res,
    hsrLogsRes,
    clinicalTestsRes,
  ] = await Promise.all([
    supabase
      .from('achilles_morning_eval')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle<EvalRow>(),
    supabase
      .from('achilles_morning_eval')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', thirtyDaysAgo)
      .lte('date', today)
      .order('date', { ascending: true })
      .returns<EvalRow[]>(),
    // 60 derniers jours pour calculer la tendance (30 récents vs 30 précédents)
    supabase
      .from('achilles_morning_eval')
      .select('date, score_max, bonus_heel_off_done')
      .eq('user_id', user.id)
      .gte('date', sixtyDaysAgo)
      .lte('date', today)
      .order('date', { ascending: true })
      .returns<{ date: string; score_max: number | null; bonus_heel_off_done: boolean | null }[]>(),
    supabase
      .from('hsr_exercise_log')
      .select('performed_at')
      .eq('user_id', user.id)
      .gte('performed_at', thirtyDaysAgo)
      .returns<{ performed_at: string }[]>(),
    supabase
      .from('clinical_test')
      .select('test_code, performed_at, result_qualitative, is_pathological, notes')
      .eq('user_id', user.id)
      .gte('performed_at', oneYearAgo)
      .order('performed_at', { ascending: false })
      .returns<ClinicalTestDbRow[]>(),
  ]);

  const todayEval = todayEvalRes.data ?? null;
  const recent30 = recent30Res.data ?? [];
  const recent60 = recent60Res.data ?? [];
  const hsrLogs = hsrLogsRes.data ?? [];
  const clinicalRows: ClinicalTestRow[] = (clinicalTestsRes.data ?? []).map(
    (r) => ({
      test_code: r.test_code,
      performed_at: r.performed_at,
      result_qualitative: r.result_qualitative,
      is_pathological: r.is_pathological,
      notes: r.notes,
    }),
  );

  // Streak ≤ 1/10 calculé sur la totalité des saisies récentes (60j)
  const streakInput: AchillesEvalDay[] = recent60.map((r) => ({
    date: r.date,
    score_max: r.score_max,
  }));
  const streak = computeAchillesStreak(streakInput, 1, today);

  // Jours de séance HSR pour les marqueurs des mini-charts
  const hsrSessionDays = Array.from(new Set(hsrLogs.map((l) => l.performed_at)));

  const flash = pickFlashMessage(sp);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold">Auto-éval — Suivi</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Pilotage du tendon d&apos;Achille droit · phase 1
        </p>
      </header>

      {flash && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            flash.tone === 'success'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-destructive/40 bg-destructive/10 text-destructive'
          }`}
        >
          {flash.message}
        </div>
      )}

      <TodayCard today={today} todayEval={todayEval} />

      <TrendStats today={today} recent30={recent60} streak={streak} />

      <MultiScoreChart recent30={recent30} hsrSessionDays={hsrSessionDays} />

      <ComplianceCalendar recent30={recent60} />

      <ClinicalTestsCard rows={clinicalRows} />

      <RecentNotes recent30={recent30} />
    </main>
  );
}

function pickFlashMessage(
  sp: Awaited<SearchParams>,
): { tone: 'success' | 'error'; message: string } | null {
  if (sp.error) return { tone: 'error', message: sp.error };
  if (sp.saved) return { tone: 'success', message: 'Saisie enregistrée.' };
  if (sp.updated) return { tone: 'success', message: 'Saisie mise à jour.' };
  if (sp.deleted) return { tone: 'success', message: 'Saisie supprimée.' };
  if (sp.tests_saved)
    return { tone: 'success', message: 'Round de tests enregistré.' };
  if (sp.tests_deleted)
    return { tone: 'success', message: 'Round de tests supprimé.' };
  return null;
}
