'use client';

import { useEffect, useRef } from 'react';
import type { MenuSection } from '@/lib/supabase/queries';

type Props = {
  sections: MenuSection[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

export function SectionTabs({ sections, activeId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep the active tab visible inside the horizontally-scrolling rail.
  useEffect(() => {
    if (!activeId || !containerRef.current) return;
    const el = containerRef.current.querySelector<HTMLButtonElement>(
      `[data-tab-id="${activeId}"]`,
    );
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeId]);

  return (
    <nav
      aria-label="Menu sections"
      className="sticky top-0 z-20 backdrop-blur-md bg-bg/85 border-b border-white/5"
    >
      <div
        ref={containerRef}
        className="no-scrollbar flex gap-1 overflow-x-auto px-3"
      >
        {sections.map((s) => {
          const active = s.id === activeId;
          return (
            <button
              key={s.id}
              data-tab-id={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              className={`relative shrink-0 px-3 py-3 text-[11px] font-display font-bold uppercase tracking-widish transition-colors ${
                active ? 'text-white' : 'text-muted hover:text-white'
              }`}
            >
              {s.name}
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute left-3 right-3 bottom-1 h-[2px] rounded-full transition-opacity ${
                  active ? 'bg-accent opacity-100' : 'opacity-0'
                }`}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
