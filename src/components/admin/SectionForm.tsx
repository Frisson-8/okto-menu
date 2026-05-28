'use client';

import { useEffect, useState } from 'react';
import type { MenuSection } from '@/lib/supabase/queries';

export type SectionFormValues = {
  name: string;
  is_active: boolean;
};

type Props = {
  mode: 'create' | 'edit';
  section?: MenuSection;
  submitting: boolean;
  errorMessage: string | null;
  onSubmit: (values: SectionFormValues) => void;
  onCancel: () => void;
};

export function SectionForm({
  mode,
  section,
  submitting,
  errorMessage,
  onSubmit,
  onCancel,
}: Props) {
  const [name, setName] = useState(section?.name ?? '');
  const [isActive, setIsActive] = useState(section?.is_active ?? true);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, submitting]);

  const handleSubmit = () => {
    setValidationError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setValidationError('Naziv sekcije je obavezan.');
      return;
    }
    onSubmit({ name: trimmed, is_active: isActive });
  };

  const shownError = validationError ?? errorMessage;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'create' ? 'Dodaj sekciju' : 'Izmeni sekciju'}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-6"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onCancel();
      }}
    >
      <div className="w-full max-w-md bg-surface border border-white/10">
        <header className="px-5 pt-5 pb-3 border-b border-white/10">
          <h2 className="font-display font-extrabold uppercase tracking-widish text-xl leading-none">
            {mode === 'create' ? 'Dodaj sekciju' : 'Izmeni sekciju'}
          </h2>
          <span aria-hidden="true" className="mt-3 block h-px w-8 bg-accent" />
        </header>

        <div className="px-5 py-5 space-y-4">
          <label className="block">
            <span className="block text-[11px] uppercase tracking-widish text-muted mb-1.5">
              Naziv
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              autoFocus
              className={inputClasses}
            />
          </label>

          {mode === 'edit' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={submitting}
                className="accent-accent"
              />
              <span className="text-sm text-white">Vidljiva na javnom meniju</span>
            </label>
          )}

          {shownError && (
            <p role="alert" className="text-[13px] text-accent">
              {shownError}
            </p>
          )}
        </div>

        <footer className="px-5 py-4 border-t border-white/10 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="border border-white/20 text-white uppercase tracking-widish font-display font-bold text-[11px] px-3 py-2 hover:border-white/50 disabled:opacity-50 transition-colors"
          >
            Odustani
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-accent text-bg uppercase tracking-widish font-display font-bold text-[12px] px-4 py-2 disabled:opacity-50 hover:brightness-110 transition"
          >
            {submitting ? 'Cuvam...' : mode === 'create' ? 'Dodaj' : 'Sacuvaj'}
          </button>
        </footer>
      </div>
    </div>
  );
}

const inputClasses =
  'w-full bg-bg text-white px-3 py-2 border border-white/10 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60';
