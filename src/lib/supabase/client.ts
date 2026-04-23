import { createBrowserClient } from '@supabase/ssr';

/**
 * Client Supabase pour les composants React côté navigateur.
 *
 * Utilise la clé `anon`, publique par conception. RLS activée sur toutes les
 * tables garantit que le user ne peut accéder qu'à ses propres données.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
