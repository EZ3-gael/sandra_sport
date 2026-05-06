import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { addDaysIso, todayIso } from '@/lib/programme/dates';
import {
  computeWellnessStreak,
  type WellnessSnapshot,
} from '@/lib/wellness/wellness-streak';
import { TodayCard } from './components/TodayCard';
import { TrendStats } from './components/TrendStats';
import { MultiDimensionChart } from './components/MultiDimensionChart';
import { ComplianceCalendar } from './components/ComplianceCalendar';
import { DimensionsAtRisk } from './components/DimensionsAtRisk';
import { RecentNotes } from './components/RecentNotes';

type CheckinRow = WellnessSnapshot & {
  id: string;
  pain_zones: string | null;
  notes: string | null;
};

type SearchParams = Promise<{
  saved?: string;
  updated?: string;
  deleted?: string;
  error?: string;
}>;

export default async function WellnessDashboardPage({
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
  const sixtyDaysAgo = addDaysIso(today, -60);

  const [todayCheckinRes, recent60Res] = await Promise.all([
    supabase
      .from('morning_checkin')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('captured_at', { ascending: false })
      .limit(1)
      .returns<CheckinRow[]>(),
    supabase
      .from('morning_checkin')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', sixtyDaysAgo)
      .lte('date', today)
      .order('captured_at', { ascending: false })
      .returns<CheckinRow[]>(),
  ]);

  const todayCheckin = todayCheckinRes.data?.[0] ?? null;
  const recent60 = recent60Res.data ?? [];
  // 30 derniers jours pour les charts (sous-ensemble de recent60)
  const thirtyDaysAgo = addDaysIso(today, -30);
  const recent30 = recent60.filter((c) => c.date >= thirtyDaysAgo);

  const streak = computeWellnessStreak(recent60, 3, today);

  const flash = pickFlashMessage(sp);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold">Auto-éval Ressenti — Suivi</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Pilotage du ressenti quotidien · 7 dimensions
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

      <TodayCard today={today} todayCheckin={todayCheckin} />

      <TrendStats today={today} recent60={recent60} streak={streak} />

      <MultiDimensionChart recent30={recent30} />

      <ComplianceCalendar recent30={recent30} />

      <DimensionsAtRisk recent60={recent60} today={today} />

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
  return null;
}
