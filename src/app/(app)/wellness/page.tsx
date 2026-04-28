import { createClient } from '@/lib/supabase/server';
import { WellnessClient, type CheckinRow } from './WellnessClient';

export default async function WellnessPage({
  searchParams,
}: {
  searchParams: Promise<{
    saved?: string;
    updated?: string;
    deleted?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const saved = params.saved === '1';
  const updated = params.updated === '1';
  const deleted = params.deleted === '1';
  const errorMsg = params.error ? decodeURIComponent(params.error) : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: recent } = await supabase
    .from('morning_checkin')
    .select('*')
    .eq('user_id', user!.id)
    .order('captured_at', { ascending: false })
    .limit(20)
    .returns<CheckinRow[]>();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6">
      {saved && (
        <Banner tone="success">Check-in enregistré.</Banner>
      )}
      {updated && (
        <Banner tone="success">Check-in mis à jour.</Banner>
      )}
      {deleted && (
        <Banner tone="success">Check-in supprimé.</Banner>
      )}
      {errorMsg && (
        <Banner tone="error">{errorMsg}</Banner>
      )}

      <WellnessClient entries={recent ?? []} />
    </main>
  );
}

function Banner({
  tone,
  children,
}: {
  tone: 'success' | 'error';
  children: React.ReactNode;
}) {
  const classes =
    tone === 'success'
      ? 'border-primary/40 bg-primary/10 text-primary'
      : 'border-destructive/40 bg-destructive/10 text-destructive';
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${classes}`}>
      {children}
    </div>
  );
}
