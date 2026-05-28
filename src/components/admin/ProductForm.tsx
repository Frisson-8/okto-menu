'use client';

import { useEffect, useRef, useState } from 'react';
import type { MenuSection } from '@/lib/supabase/queries';
import { uploadMenuImage } from '@/lib/uploadMenuImage';

export type ProductFormInitial = {
  name?: string;
  description?: string | null;
  volume?: string | null;
  price?: number;
  category_id: string;
  image_url?: string | null;
};

export type ProductFormValues = {
  name: string;
  description: string | null;
  volume: string | null;
  price: number;
  category_id: string;
  image_url: string | null;
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
  const [imageUrl, setImageUrl] = useState<string | null>(initial.image_url ?? null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const busy = submitting || uploadingImage;

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onCancel]);

  const handleSubmit = () => {
    void (async () => {
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

      let finalImageUrl = imageUrl;
      if (pendingFile) {
        setUploadingImage(true);
        try {
          finalImageUrl = await uploadMenuImage(pendingFile);
        } catch (e) {
          setValidationError(e instanceof Error ? e.message : String(e));
          setUploadingImage(false);
          return;
        }
        setUploadingImage(false);
      }

      onSubmit({
        name: trimmedName,
        description: description.trim() ? description.trim() : null,
        volume: volume.trim() ? volume.trim() : null,
        price: priceNum,
        category_id: categoryId,
        image_url: finalImageUrl,
      });
    })();
  };

  const shownError = validationError ?? errorMessage;
  const displayPreview = previewUrl ?? imageUrl;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'create' ? 'Dodaj stavku' : 'Izmeni stavku'}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-6"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
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
              disabled={busy}
              autoFocus
              className={inputClasses}
            />
          </FormField>

          <FormField label="Slika (opciono)">
            <div className="flex items-start gap-3">
              {displayPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayPreview}
                  alt=""
                  className="h-16 w-16 object-cover border border-white/10 shrink-0"
                />
              ) : (
                <div className="h-16 w-16 border border-dashed border-white/15 shrink-0 grid place-items-center text-muted text-[10px] uppercase tracking-widish text-center px-1">
                  Nema
                </div>
              )}
              <div className="flex flex-col gap-2 min-w-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setPendingFile(file);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy}
                  className="border border-white/20 text-white uppercase tracking-widish font-display font-bold text-[10px] px-2 py-1.5 hover:border-accent hover:text-accent disabled:opacity-50 transition-colors text-left"
                >
                  {uploadingImage ? 'Otpremam...' : 'Izaberi sliku'}
                </button>
                {(imageUrl || pendingFile) && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl(null);
                      setPendingFile(null);
                    }}
                    disabled={busy}
                    className="text-[10px] uppercase tracking-widish text-muted hover:text-accent disabled:opacity-50 text-left"
                  >
                    Ukloni sliku
                  </button>
                )}
              </div>
            </div>
          </FormField>

          <FormField label="Opis (opciono)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={busy}
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
                disabled={busy}
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
                disabled={busy}
                className={`${inputClasses} tabular-nums`}
              />
            </FormField>
          </div>

          <FormField label="Kategorija">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={busy}
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
            disabled={busy}
            className="border border-white/20 text-white uppercase tracking-widish font-display font-bold text-[11px] px-3 py-2 hover:border-white/50 disabled:opacity-50 transition-colors"
          >
            Odustani
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            className="bg-accent text-bg uppercase tracking-widish font-display font-bold text-[12px] px-4 py-2 disabled:opacity-50 hover:brightness-110 transition"
          >
            {busy ? 'Cuvam...' : mode === 'create' ? 'Dodaj' : 'Sacuvaj'}
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
