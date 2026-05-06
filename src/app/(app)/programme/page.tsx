import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  addDaysIso,
  isoWeekNumber,
  isoWeekStart,
  parseIsoDate,
  todayIso,
} from '@/lib/programme/dates';
import {
  computeAchillesStreak,
  indexAchillesEvalsByDay,
  type AchillesEvalDay,
} from '@/lib/programme/achilles-streak';
import {
  evaluatePalierConditions,
  type SleepCheckin,
} from '@/lib/programme/palier-conditions';
import { PhaseHeader } from './components/PhaseHeader';
import {
  TodaySession,
  type TodaySessionData,
} from './components/TodaySession';
import { PainAlert } from './components/PainAlert';
import { AchillesChart } from './components/AchillesChart';
import {
  HsrLoadTable,
  type HsrLogRow,
} from './components/HsrLoadTable';
import {
  MonthlyMarkers,
  type MonthlyMarkerRow,
} from './components/MonthlyMarkers';
import type { Protocol } from '@/app/(app)/sessions/[id]/SessionProtocolView';

const STREAK_TARGET = 14; // jours consécutifs Achille ≤ 1/10 visés

type ProgramPhaseRow = {
  id: string;
  user_id: string;
  phase_code: string;
  phase_label: string;
  hsr_frequency_per_week: number;
  started_at: string;
  ended_at: string | null;
  source_md_path: string | null;
  notes: string | null;
};

type SleepCheckinRow = {
  id: string;
  date: string;
  sleep_quality: number | null;
};

type AchillesEvalRow = {
  id: string;
  date: string;
  score_max: number | null;
};

type SessionRow = {
  id: string;
  date: string;
  slot: string | null;
  title: string;
  session_type: string | null;
  status: 'planned' | 'done' | 'skipped';
  protocol: Protocol | null;
};

type ItemCheckRow = {
  item_id: string;
};

export default async function ProgrammePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const today = todayIso();
  const thirtyDaysAgo = addDaysIso(today, -30);
  const sixMonthsAgo = addDaysIso(today, -180);

  // Fetch en parallèle
  const [
    phaseRes,
    todaySessionRes,
    achillesEvalsRes,
    sleepCheckinsRes,
    hsrLogsRes,
    monthlyMarkersRes,
  ] = await Promise.all([
    supabase
      .from('program_phase_active')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle<ProgramPhaseRow>(),
    supabase
      .from('sessions')
      .select('id, date, slot, title, session_type, status, protocol')
      .eq('user_id', userId)
      .eq('date', today)
      .order('planned_start_time', { ascending: true, nullsFirst: false })
      .limit(1)
      .returns<SessionRow[]>(),
    supabase
      .from('achilles_morning_eval')
      .select('id, date, score_max')
      .eq('user_id', userId)
      .gte('date', thirtyDaysAgo)
      .order('date', { ascending: false })
      .returns<AchillesEvalRow[]>(),
    supabase
      .from('morning_checkin')
      .select('id, date, sleep_quality')
      .eq('user_id', userId)
      .gte('date', thirtyDaysAgo)
      .order('date', { ascending: false })
      .returns<SleepCheckinRow[]>(),
    supabase
      .from('hsr_exercise_log')
      .select('exercise_key, performed_at, charge_kg, reps, rpe, pain_during')
      .eq('user_id', userId)
      .gte('performed_at', thirtyDaysAgo)
      .order('performed_at', { ascending: false })
      .returns<HsrLogRow[]>(),
    supabase
      .from('monthly_marker')
      .select('id, marker_type, measured_at, value_numeric, value_text, metadata, notes')
      .eq('user_id', userId)
      .gte('measured_at', sixMonthsAgo)
      .order('measured_at', { ascending: false })
      .returns<MonthlyMarkerRow[]>(),
  ]);

  const phase = phaseRes.data ?? null;
  const todaySession = todaySessionRes.data?.[0] ?? null;
  const achillesEvals: AchillesEvalDay[] = (achillesEvalsRes.data ?? []).map(
    (e) => ({ date: e.date, score_max: e.score_max }),
  );
  const sleepCheckins: SleepCheckin[] = (sleepCheckinsRes.data ?? []).map(
    (c) => ({ date: c.date, sleep_quality: c.sleep_quality }),
  );
  const hsrLogs = hsrLogsRes.data ?? [];
  const monthlyMarkers = monthlyMarkersRes.data ?? [];

  // Item checks (uniquement pour la séance du jour, sinon skip)
  let checkedItemIds: string[] = [];
  if (todaySession) {
    const { data: checks } = await supabase
      .from('session_item_checks')
      .select('item_id')
      .eq('session_id', todaySession.id)
      .eq('user_id', userId)
      .returns<ItemCheckRow[]>();
    checkedItemIds = (checks ?? []).map((c) => c.item_id);
  }

  // Calculs métier
  const streak = computeAchillesStreak(achillesEvals, 1, today);
  const conditions = evaluatePalierConditions({
    achillesEvals,
    sleepCheckins,
    hsrLogs: hsrLogs.map((l) => ({
      performed_at: l.performed_at,
      pain_during: l.pain_during,
    })),
    from: today,
  });

  // Score Achille du jour pour le bandeau
  const byDay = indexAchillesEvalsByDay(achillesEvals);
  const todayAchillesScore = byDay.get(today) ?? null;

  // Compteur jours consécutifs ≥ 3 (pour bandeau orange)
  let consecutiveOver3 = 0;
  for (let i = 0; i < 14; i++) {
    const day = addDaysIso(today, -i);
    const score = byDay.get(day);
    if (score === undefined || score === null || score < 3) break;
    consecutiveOver3++;
  }

  // Méta phase
  const weekIso = isoWeekNumber(today);
  const weekStartIso = isoWeekStart(today);
  const weekStartDate = parseIsoDate(weekStartIso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  let programNotStartedYet = false;
  let daysToStart = 0;
  if (phase && phase.started_at > today) {
    programNotStartedYet = true;
    const startDate = parseIsoDate(phase.started_at);
    const todayDate = parseIsoDate(today);
    daysToStart = Math.round(
      (startDate.getTime() - todayDate.getTime()) / (24 * 3600 * 1000),
    );
  }

  // Jours où une séance HSR a eu lieu (pour le décor du chart)
  const hsrSessionDays = Array.from(
    new Set(hsrLogs.map((l) => l.performed_at)),
  );

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold">Programme</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Pilotage du protocole phase 1 — tendinopathie Achille.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/auto-eval"
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            Saisir auto-éval
          </Link>
          <Link
            href="/auto-eval/dashboard"
            className="rounded-md border border-border bg-input px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Voir le suivi
          </Link>
        </div>
      </header>

      <PainAlert
        todayAchillesScore={todayAchillesScore}
        consecutiveOver3={consecutiveOver3}
      />

      <PhaseHeader
        phaseLabel={phase?.phase_label ?? null}
        weekIso={weekIso}
        weekStartDate={weekStartDate}
        hsrFrequencyPerWeek={phase?.hsr_frequency_per_week ?? null}
        hsrFrequencyNext={null /* V1.5e2 : calculé via metadata phase */}
        streak={streak}
        streakTarget={STREAK_TARGET}
        conditions={conditions}
        programNotStartedYet={programNotStartedYet}
        daysToStart={daysToStart}
      />

      <TodaySession
        session={todaySession ? toTodaySessionData(todaySession) : null}
        checkedItemIds={checkedItemIds}
        programNotStartedYet={programNotStartedYet}
      />

      <AchillesChart
        evals={achillesEvals}
        hsrSessionDays={hsrSessionDays}
      />

      <HsrLoadTable logs={hsrLogs} />

      <MonthlyMarkers markers={monthlyMarkers} />
    </main>
  );
}

function toTodaySessionData(s: SessionRow): TodaySessionData {
  return {
    id: s.id,
    date: s.date,
    slot: s.slot,
    title: s.title,
    session_type: s.session_type,
    status: s.status,
    protocol: s.protocol,
  };
}
