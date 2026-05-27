'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMenu } from '@/hooks/useMenu';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { MenuHeader } from '@/components/menu/MenuHeader';
import { SectionTabs } from '@/components/menu/SectionTabs';
import { SectionBlock } from '@/components/menu/SectionBlock';
import { MenuFooter } from '@/components/menu/MenuFooter';

export default function Home() {
  const { menu, settings, loading, error, reload } = useMenu();

  const sections = useMemo(() => menu ?? [], [menu]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Seed the active tab with the first section as soon as data lands.
  useEffect(() => {
    if (sections.length > 0 && activeId === null) {
      setActiveId(sections[0].id);
    }
  }, [sections, activeId]);

  // Track which section is currently in view; update the active tab.
  useEffect(() => {
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const id = visible[0].target.getAttribute('data-section-id');
          if (id) setActiveId(id);
        }
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: 0 },
    );
    sections.forEach((s) => {
      const el = document.getElementById(`section-${s.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  const handleSelect = (id: string) => {
    const el = document.getElementById(`section-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
  };

  const pubName = settings?.pub_name ?? 'OKTO';
  const currency = settings?.currency ?? 'DIN';

  return (
    <main className="mx-auto min-h-screen max-w-[640px]">
      <MenuHeader pubName={pubName} />

      {!isSupabaseConfigured && <ConfigMissing />}

      {isSupabaseConfigured && loading && <LoadingSkeleton />}

      {isSupabaseConfigured && error && (
        <ErrorState message={error.message} onRetry={reload} />
      )}

      {isSupabaseConfigured && !loading && !error && sections.length === 0 && (
        <EmptyState />
      )}

      {isSupabaseConfigured && !loading && !error && sections.length > 0 && (
        <>
          <SectionTabs
            sections={sections}
            activeId={activeId}
            onSelect={handleSelect}
          />
          <div>
            {sections.map((s) => (
              <SectionBlock key={s.id} section={s} currency={currency} />
            ))}
          </div>
          <MenuFooter settings={settings} />
        </>
      )}
    </main>
  );
}

function LoadingSkeleton() {
  return (
    <div className="px-5 py-8 animate-pulse">
      <div className="h-10 w-2/3 bg-white/10 rounded-sm mb-4" />
      <div className="h-px w-12 bg-accent/40 mb-8" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-3 w-1/3 bg-white/10 rounded-sm" />
            <div className="flex-1 h-px bg-white/5" />
            <div className="h-3 w-12 bg-white/10 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="px-5 py-10">
      <p className="font-display uppercase tracking-widish text-accent text-sm mb-2">
        Greska
      </p>
      <p className="text-white/90 mb-1">Nismo uspeli da ucitamo meni.</p>
      <p className="text-muted text-xs break-words mb-6">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="border border-accent/70 text-accent uppercase tracking-widish text-xs px-4 py-2 hover:bg-accent hover:text-bg transition-colors"
      >
        Pokusaj ponovo
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-5 py-12">
      <p className="font-display uppercase tracking-widish text-muted text-sm mb-2">
        Prazno
      </p>
      <p className="text-white/80">Meni jos uvek nije postavljen.</p>
    </div>
  );
}

function ConfigMissing() {
  return (
    <div className="px-5 py-10">
      <p className="font-display uppercase tracking-widish text-accent text-sm mb-2">
        Konfiguracija
      </p>
      <p className="text-white/90 mb-1">
        Supabase kredencijali nisu postavljeni.
      </p>
      <p className="text-muted text-xs">
        Kopiraj <code className="text-white/80">.env.local.example</code> u{' '}
        <code className="text-white/80">.env.local</code> i popuni{' '}
        <code className="text-white/80">NEXT_PUBLIC_SUPABASE_URL</code> i{' '}
        <code className="text-white/80">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
      </p>
    </div>
  );
}
