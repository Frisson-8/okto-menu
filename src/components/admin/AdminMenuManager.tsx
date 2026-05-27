'use client';

import { useMemo, useState } from 'react';
import { useAdminMenu } from '@/hooks/useAdminMenu';
import type { MenuProduct, MenuSection } from '@/lib/supabase/queries';
import {
  createProduct,
  deleteProduct,
  setProductAvailability,
  updateProduct,
} from '@/lib/supabase/mutations';
import { AdminProductRow } from './AdminProductRow';
import { ProductForm, type ProductFormValues } from './ProductForm';

type FormState =
  | { mode: 'create'; categoryId: string }
  | { mode: 'edit'; product: MenuProduct; categoryId: string }
  | null;

const DEFAULT_CURRENCY = 'DIN';

export function AdminMenuManager() {
  const { sections, loading, error, reload } = useAdminMenu();

  const [formState, setFormState] = useState<FormState>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const totalProducts = useMemo(
    () =>
      sections?.reduce(
        (acc, s) =>
          acc +
          s.categories.reduce((acc2, c) => acc2 + c.products.length, 0),
        0,
      ) ?? 0,
    [sections],
  );

  const handleOpenCreate = (categoryId: string) => {
    setFormError(null);
    setFormState({ mode: 'create', categoryId });
  };

  const handleOpenEdit = (categoryId: string, product: MenuProduct) => {
    setFormError(null);
    setFormState({ mode: 'edit', product, categoryId });
  };

  const handleCancelForm = () => {
    if (formSubmitting) return;
    setFormState(null);
    setFormError(null);
  };

  const handleSubmitForm = async (values: ProductFormValues) => {
    if (!formState) return;
    setFormSubmitting(true);
    setFormError(null);
    try {
      if (formState.mode === 'create') {
        await createProduct({
          category_id: values.category_id,
          name: values.name,
          description: values.description,
          volume: values.volume,
          price: values.price,
        });
      } else {
        await updateProduct(formState.product.id, {
          category_id: values.category_id,
          name: values.name,
          description: values.description,
          volume: values.volume,
          price: values.price,
        });
      }
      setFormState(null);
      await reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSavePrice = async (productId: string, newPrice: number) => {
    try {
      await updateProduct(productId, { price: newPrice });
      await reload();
    } catch (e) {
      // Propagate so the row shows its own error too.
      setGlobalError(e instanceof Error ? e.message : String(e));
      throw e;
    }
  };

  const handleToggleAvailability = async (productId: string, next: boolean) => {
    try {
      await setProductAvailability(productId, next);
      await reload();
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : String(e));
      throw e;
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await deleteProduct(productId);
      await reload();
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : String(e));
      throw e;
    }
  };

  if (loading && !sections) {
    return (
      <section className="px-5 py-10">
        <p className="font-display uppercase tracking-widish text-muted text-sm">
          Ucitavanje menija...
        </p>
      </section>
    );
  }

  if (error && !sections) {
    return (
      <section className="px-5 py-10">
        <p className="font-display uppercase tracking-widish text-accent text-sm mb-2">
          Greska
        </p>
        <p className="text-white/90 mb-1">Nismo uspeli da ucitamo meni.</p>
        <p className="text-muted text-xs break-words mb-6">{error.message}</p>
        <button
          type="button"
          onClick={() => void reload()}
          className="border border-accent/70 text-accent uppercase tracking-widish text-xs px-4 py-2 hover:bg-accent hover:text-bg transition-colors"
        >
          Pokusaj ponovo
        </button>
      </section>
    );
  }

  const safe = sections ?? [];

  return (
    <section className="px-5 py-6">
      <div className="flex items-baseline justify-between mb-4">
        <p className="text-[11px] uppercase tracking-widest text-muted">
          {totalProducts} stavki · {safe.length} sekcija
        </p>
        {loading && (
          <p className="text-[11px] uppercase tracking-widest text-muted/70">
            Osvezavam...
          </p>
        )}
      </div>

      {globalError && (
        <div
          role="alert"
          className="mb-4 border border-accent/60 bg-accent/10 px-3 py-2 text-[13px] text-accent flex items-start justify-between gap-3"
        >
          <span className="break-words">{globalError}</span>
          <button
            type="button"
            onClick={() => setGlobalError(null)}
            aria-label="Zatvori poruku"
            className="shrink-0 text-accent/80 hover:text-accent"
          >
            ✕
          </button>
        </div>
      )}

      <div className="space-y-10">
        {safe.map((section) => (
          <SectionGroup
            key={section.id}
            section={section}
            onAdd={(catId) => handleOpenCreate(catId)}
            onEdit={(catId, p) => handleOpenEdit(catId, p)}
            onDelete={handleDelete}
            onSavePrice={handleSavePrice}
            onToggleAvailability={handleToggleAvailability}
          />
        ))}
      </div>

      {formState && sections && (
        <ProductForm
          mode={formState.mode}
          sections={sections}
          initial={
            formState.mode === 'create'
              ? { category_id: formState.categoryId }
              : {
                  category_id: formState.categoryId,
                  name: formState.product.name,
                  description: formState.product.description ?? null,
                  volume: formState.product.volume ?? null,
                  price: formState.product.price,
                }
          }
          submitting={formSubmitting}
          errorMessage={formError}
          onSubmit={(v) => void handleSubmitForm(v)}
          onCancel={handleCancelForm}
        />
      )}
    </section>
  );
}

type SectionGroupProps = {
  section: MenuSection;
  onAdd: (categoryId: string) => void;
  onEdit: (categoryId: string, product: MenuProduct) => void;
  onDelete: (productId: string) => Promise<void>;
  onSavePrice: (productId: string, price: number) => Promise<void>;
  onToggleAvailability: (productId: string, next: boolean) => Promise<void>;
};

function SectionGroup({
  section,
  onAdd,
  onEdit,
  onDelete,
  onSavePrice,
  onToggleAvailability,
}: SectionGroupProps) {
  return (
    <div>
      <header className="mb-2">
        <h2 className="font-display font-extrabold uppercase tracking-widish text-2xl leading-none">
          {section.name}
          {!section.is_active && (
            <span className="ml-3 text-[10px] tracking-widish text-muted align-middle">
              (skrivena)
            </span>
          )}
        </h2>
        <span aria-hidden="true" className="mt-2 block h-px w-10 bg-accent" />
      </header>

      {section.categories.length === 0 && (
        <p className="text-muted text-sm py-4">Nema kategorija u ovoj sekciji.</p>
      )}

      {section.categories.map((cat) => (
        <div key={cat.id} className="mt-5">
          <h3 className="font-display font-bold uppercase tracking-widish text-[12px] text-muted mb-1 flex items-baseline gap-2">
            <span>{cat.name}</span>
            {!cat.is_active && (
              <span className="text-[10px] text-muted/70">(skrivena)</span>
            )}
          </h3>
          <ul>
            {cat.products.map((p) => (
              <AdminProductRow
                key={p.id}
                product={p}
                currency={DEFAULT_CURRENCY}
                onEdit={() => onEdit(cat.id, p)}
                onDelete={() => onDelete(p.id)}
                onSavePrice={(price) => onSavePrice(p.id, price)}
                onToggleAvailability={(next) => onToggleAvailability(p.id, next)}
              />
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onAdd(cat.id)}
            className="mt-2 w-full border border-dashed border-white/15 text-muted hover:border-accent hover:text-accent uppercase tracking-widish font-display font-bold text-[11px] py-2 transition-colors"
          >
            + Dodaj stavku u {cat.name}
          </button>
        </div>
      ))}
    </div>
  );
}
