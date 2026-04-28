import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf :
     * - _next/static, _next/image (assets Next)
     * - favicon.ico
     * - manifest.webmanifest et sw.js (cruciaux pour la PWA — sinon le
     *   middleware redirige ces fichiers vers /login en HTML quand l'user
     *   n'a pas de session, ce qui casse l'enregistrement du SW et la
     *   lecture du manifest par Chrome)
     * - fichiers images (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
