import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

type CookieSet = { name: string; value: string; options?: CookieOptions };

/**
 * Client Supabase pour les Server Components, Server Actions et Route Handlers.
 *
 * Lit/écrit les cookies de session via l'API Next.js. La session utilisateur
 * est portée par un cookie httpOnly signé par Supabase.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Appelé depuis un Server Component — ignorer (les cookies sont
            // refresh via middleware dans ce cas).
          }
        },
      },
    },
  );
}
