'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AdminMenuManager } from '@/components/admin/AdminMenuManager';

export default function AdminPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  // Client-side guard. RLS is the actual protection; this is UX only.
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/admin/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="font-display uppercase tracking-widish text-muted text-sm">
          Ucitavanje...
        </p>
      </main>
    );
  }

  if (!user) {
    // Mid-redirect — render nothing.
    return null;
  }

  const handleLogout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    await signOut();
    router.replace('/admin/login');
  };

  return (
    <main className="min-h-screen">
      <header className="border-b border-white/10 px-5 py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display font-extrabold uppercase tracking-widish text-xl leading-none">
            OKTO<span className="text-accent"> Admin</span>
          </h1>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted truncate">
            {user.email}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={signingOut}
          className="shrink-0 border border-white/20 text-white uppercase tracking-widish font-display font-bold text-[11px] px-3 py-2 hover:border-accent hover:text-accent disabled:opacity-50 transition-colors"
        >
          {signingOut ? 'Odjavljujem...' : 'Odjavi se'}
        </button>
      </header>

      <AdminMenuManager />
    </main>
  );
}
