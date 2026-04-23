import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Layout partagé des pages authentifiées (/wellness, /sessions, ...).
 *
 * Vérifie la session, affiche une nav basse mobile-first avec signout.
 * Le middleware protège déjà ces routes, mais on double-check ici pour
 * être sûr d'avoir `user` disponible côté serveur.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-full flex-col pb-20">
      {children}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          <NavLink href="/" label="Accueil" icon="home" />
          <NavLink href="/wellness" label="Wellness" icon="heart" />
          <NavLink href="/sessions" label="Séances" icon="activity" />
          <SignOutButton />
        </div>
      </nav>
    </div>
  );
}

function NavLink({
  href,
  label,
}: {
  href: string;
  label: string;
  icon?: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-0.5 py-3 text-xs font-medium text-muted-foreground transition hover:text-foreground"
    >
      {label}
    </Link>
  );
}

function SignOutButton() {
  return (
    <form action="/auth/signout" method="POST" className="flex">
      <button
        type="submit"
        className="flex w-full flex-col items-center gap-0.5 py-3 text-xs font-medium text-muted-foreground transition hover:text-foreground"
      >
        Sortir
      </button>
    </form>
  );
}
