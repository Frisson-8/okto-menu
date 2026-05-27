'use client';

import { useEffect, useRef, useState } from 'react';
import type { MenuProduct } from '@/lib/supabase/queries';

type Props = {
  product: MenuProduct;
  currency: string;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onSavePrice: (newPrice: number) => Promise<void>;
  onToggleAvailability: (next: boolean) => Promise<void>;
};

export function AdminProductRow({
  product,
  currency,
  onEdit,
  onDelete,
  onSavePrice,
  onToggleAvailability,
}: Props) {
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceText, setPriceText] = useState(String(Math.round(product.price)));
  const [rowError, setRowError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | 'price' | 'toggle' | 'delete'>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingPrice) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editingPrice]);

  // If the parent re-fetches and the price changes underneath us, sync.
  useEffect(() => {
    if (!editingPrice) {
      setPriceText(String(Math.round(product.price)));
    }
  }, [product.price, editingPrice]);

  const startPriceEdit = () => {
    if (busy) return;
    setRowError(null);
    setPriceText(String(Math.round(product.price)));
    setEditingPrice(true);
  };

  const cancelPriceEdit = () => {
    setEditingPrice(false);
    setRowError(null);
    setPriceText(String(Math.round(product.price)));
  };

  const commitPrice = async () => {
    const next = Number(priceText);
    if (!priceText.trim() || !Number.isFinite(next) || next < 0 || !Number.isInteger(next)) {
      setRowError('Cena mora biti pozitivan ceo broj.');
      return;
    }
    if (next === Math.round(product.price)) {
      setEditingPrice(false);
      return;
    }
    setBusy('price');
    setRowError(null);
    try {
      await onSavePrice(next);
      setEditingPrice(false);
    } catch (e) {
      setRowError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const handleToggle = async () => {
    if (busy) return;
    setBusy('toggle');
    setRowError(null);
    try {
      await onToggleAvailability(!product.is_available);
    } catch (e) {
      setRowError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    if (busy) return;
    const ok = window.confirm(`Obrisati "${product.name}"? Ovo se ne moze opozvati.`);
    if (!ok) return;
    setBusy('delete');
    setRowError(null);
    try {
      await onDelete();
      // No state to clear — parent will unmount us after reload.
    } catch (e) {
      setRowError(e instanceof Error ? e.message : String(e));
      setBusy(null);
    }
  };

  const priceDisplay = `${Math.round(product.price).toLocaleString('sr-RS')} ${currency}`;
  const dimmed = !product.is_available;

  return (
    <li className={`py-3 border-b border-white/5 transition-opacity ${dimmed ? 'opacity-50' : ''}`}>
      <div className="flex items-baseline gap-3">
        <div className="min-w-0 flex-1 flex items-baseline gap-2">
          <span className="font-medium text-white truncate">{product.name}</span>
          {product.volume && (
            <span className="shrink-0 text-[12px] text-muted">{product.volume}</span>
          )}
        </div>

        {editingPrice ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <input
              ref={inputRef}
              type="number"
              inputMode="numeric"
              step={1}
              min={0}
              value={priceText}
              onChange={(e) => setPriceText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void commitPrice();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  cancelPriceEdit();
                }
              }}
              disabled={busy !== null}
              className="w-20 bg-bg text-white px-2 py-1 border border-accent focus:outline-none tabular-nums text-right"
            />
            <span className="text-[11px] uppercase tracking-widish text-muted">{currency}</span>
            <button
              type="button"
              onClick={() => void commitPrice()}
              disabled={busy !== null}
              aria-label="Sacuvaj cenu"
              className="h-7 w-7 grid place-items-center border border-accent text-accent hover:bg-accent hover:text-bg disabled:opacity-50 transition-colors"
            >
              ✓
            </button>
            <button
              type="button"
              onClick={cancelPriceEdit}
              disabled={busy !== null}
              aria-label="Otkazi"
              className="h-7 w-7 grid place-items-center border border-white/20 text-muted hover:border-white/50 hover:text-white disabled:opacity-50 transition-colors"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startPriceEdit}
            disabled={busy !== null}
            className="shrink-0 tabular-nums font-semibold text-white hover:text-accent disabled:opacity-50 transition-colors"
            title="Klikni za izmenu cene"
          >
            {priceDisplay}
          </button>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2 text-[11px]">
        <button
          type="button"
          onClick={() => void handleToggle()}
          disabled={busy !== null}
          aria-pressed={product.is_available}
          className={`uppercase tracking-widish font-display font-bold px-2 py-1 border transition-colors disabled:opacity-50 ${
            product.is_available
              ? 'border-accent/60 text-accent hover:bg-accent/10'
              : 'border-white/15 text-muted hover:border-white/40 hover:text-white'
          }`}
        >
          {busy === 'toggle'
            ? '...'
            : product.is_available
              ? 'Dostupno'
              : 'Skriveno'}
        </button>

        <button
          type="button"
          onClick={onEdit}
          disabled={busy !== null}
          className="uppercase tracking-widish font-display font-bold px-2 py-1 border border-white/15 text-white hover:border-white/40 disabled:opacity-50 transition-colors"
        >
          Izmeni
        </button>

        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={busy !== null}
          className="uppercase tracking-widish font-display font-bold px-2 py-1 border border-white/15 text-muted hover:border-accent hover:text-accent disabled:opacity-50 transition-colors"
        >
          {busy === 'delete' ? 'Brisem...' : 'Obrisi'}
        </button>

        {rowError && (
          <span role="alert" className="text-accent text-[11px] truncate">
            {rowError}
          </span>
        )}
      </div>
    </li>
  );
}
