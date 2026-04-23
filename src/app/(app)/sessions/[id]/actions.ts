'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { sessionNoteStructSchema } from '@/lib/validations/session-note';

function parseOptionalInt(v: FormDataEntryValue | null): number | undefined {
  if (v === null || v === '') return undefined;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : undefined;
}

function parseText(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

export async function saveSessionNote(
  sessionId: string,
  formData: FormData,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const rpe = parseOptionalInt(formData.get('rpe'));
  const fatigue = parseOptionalInt(formData.get('fatigue'));
  const notes_brut = parseText(formData.get('notes_brut'));
  const status = String(formData.get('status') ?? 'done');

  // Zones douleur : string séparé par virgules → array
  const pain_raw = parseText(formData.get('zones_douleur'));
  const zones_douleur = pain_raw
    ? pain_raw.split(',').map((z) => z.trim()).filter(Boolean)
    : undefined;

  // Construit la struct en filtrant les undefined (Zod les traitera comme absents)
  const structInput: Record<string, unknown> = {};
  if (rpe !== undefined) structInput.rpe = rpe;
  if (fatigue !== undefined) structInput.fatigue = fatigue;
  if (zones_douleur && zones_douleur.length > 0) {
    structInput.zones_douleur = zones_douleur;
  }

  const structParsed = sessionNoteStructSchema.safeParse(structInput);
  if (!structParsed.success) {
    const msg =
      structParsed.error.issues[0]?.message ?? 'Note structurée invalide.';
    redirect(
      `/sessions/${sessionId}?error=${encodeURIComponent(msg)}`,
    );
  }

  const hasStruct = Object.keys(structParsed.data).length > 0;

  // Vérification status
  if (!['planned', 'done', 'skipped'].includes(status)) {
    redirect(
      `/sessions/${sessionId}?error=${encodeURIComponent('Statut invalide.')}`,
    );
  }

  // 1) Update status sur sessions
  const { error: updateErr } = await supabase
    .from('sessions')
    .update({ status })
    .eq('id', sessionId)
    .eq('user_id', user.id);

  if (updateErr) {
    redirect(
      `/sessions/${sessionId}?error=${encodeURIComponent(updateErr.message)}`,
    );
  }

  // 2) Insert session_note si contenu à capturer
  if (hasStruct || notes_brut) {
    const { error: insertErr } = await supabase.from('session_notes').insert({
      user_id: user.id,
      session_id: sessionId,
      notes_struct: hasStruct ? structParsed.data : null,
      notes_brut: notes_brut,
    });
    if (insertErr) {
      redirect(
        `/sessions/${sessionId}?error=${encodeURIComponent(insertErr.message)}`,
      );
    }
  }

  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath('/sessions');
  redirect(`/sessions/${sessionId}?saved=1`);
}
