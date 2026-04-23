import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Home — redirect selon état d'authentification.
 *
 * Le middleware (src/middleware.ts) protège déjà les routes non publiques,
 * mais on explicite le redirect ici pour UX propre sur /.
 */
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }
  redirect('/wellness');
}
