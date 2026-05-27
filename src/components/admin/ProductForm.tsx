'use client';

import { useEffect, useState } from 'react';
import type { MenuSection } from '@/lib/supabase/queries';

export type ProductFormInitial = {
  name?: string;
  description?: string | null;
  volume?: string | null;
  price?: number;
  category_id: string;
};

export type ProductFormValues = {
  name: string;
  description: string | null;
  volume: string | null;
  price: number;
  category_id: string;
};

type Props = {
  mode: 'create' | 'edit';
  sections: MenuSection[];
  initial: ProductFormInitial;
  submitting: boolean;
  errorMessage: string | null;
  onSubmit: (values: ProductFormValues) => void;
  onCancel: () => void;
};

export function ProductForm({
  mode,
  sections,
  initial,
  submitting,
  errorMessage,
  onSubmit,
  onCancel,
}: Props) {
  const [name, setName] = useState(initial.name ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [volume, setVolume] = useState(initial.volume ?? '');
  const [priceText, setPriceText] = useState(
    initial.price != null ? String(Math.round(initial.price)) : '',
  );
  const [categoryId, setCategoryId] = useState(initial.category_id);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, submitting]);

  const handleSubmit = () => {
    setValidationError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError('Naziv je obavezan.');
      return;
    }

    const priceNum = Number(priceText);
    if (!priceText.trim() || !Number.isFinite(priceNum) || priceNum < 0) {
      setValidationError('Cena mora biti pozitivan ceo broj.');
      return;
    }
    if (!Number.isInteger(priceNum)) {
      setValidationError('Cena mora biti ceo broj (bez decimala).');
      return;
    }

    if (!categoryId) {
      setValidationError('Izaberi kategoriju.');
      return;
    }

    onSubmit({
      name: trimmedName,
      description: description.trim() ? description.trim() : null,
      volume: volume.trim() ? volume.trim() : null,
      price: priceNum,
      category_id: categoryId,
    });
  };

  const shownError = validationError ?? errorMessage;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'create' ? 'Dodaj stavku' : 'Izmeni stavku'}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-6"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onCancel();
      }}
    >
      <div className="w-full max-w-md bg-surface border border-white/10 max-h-[90vh] overflow-y-auto">
        <header className="px-5 pt-5 pb-3 border-b border-white/10">
          <h2 className="font-display font-extrabold uppercase tracking-widish text-xl leading-none">
            {mode === 'create' ? 'Dodaj stavku' : 'Izmeni stavku'}
          </h2>
          <span aria-hidden="true" className="mt-3 block h-px w-8 bg-accent" />
        </header>

        <div className="px-5 py-5 space-y-4">
          <FormField label="Naziv">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              autoFocus
              className={inputClasses}
            />
          </FormField>

          <FormField label="Opis (opciono)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              rows={2}
              className={`${inputClasses} resize-none`}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Kolicina">
              <input
                type="text"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                disabled={submitting}
                placeholder="0,33 l"
                className={inputClasses}
              />
            </FormField>

            <FormField label="Cena (DIN)">
              <input
                type="number"
                inputMode="numeric"
                step={1}
                min={0}
                value={priceText}
                onChange={(e) => setPriceText(e.target.value)}
                disabled={submitting}
                className={`${inputClasses} tabular-nums`}
              />
            </FormField>
          </div>

          <FormField label="Kategorija">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={submitting}
              className={`${inputClasses} pr-8`}
            >
              {sections.map((s) => (
                <optgroup key={s.id} label={s.name}>
                  {s.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </FormField>

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
  'w-full bg-bg text-white px-3 py-2 border border-white/10 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent placeholder-muted/50 disabled:opacity-60';

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-widish text-muted mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
