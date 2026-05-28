'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAdminMenu } from '@/hooks/useAdminMenu';
import type { MenuCategory, MenuProduct, MenuSection } from '@/lib/supabase/queries';
import {
  createCategory,
  createProduct,
  createSection,
  deleteCategory,
  deleteProduct,
  deleteSection,
  setProductAvailability,
  updateCategorySortOrder,
  updateCategory,
  updateProductSortOrder,
  updateProduct,
  updateSectionSortOrder,
  updateSection,
} from '@/lib/supabase/mutations';
import { AdminProductRow } from './AdminProductRow';
import { CategoryForm, type CategoryFormValues } from './CategoryForm';
import { ProductForm, type ProductFormValues } from './ProductForm';
import { SectionForm, type SectionFormValues } from './SectionForm';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type ProductFormState =
  | { mode: 'create'; categoryId: string }
  | { mode: 'edit'; product: MenuProduct; categoryId: string }
  | null;

type SectionFormState =
  | { mode: 'create' }
  | { mode: 'edit'; section: MenuSection }
  | null;

type CategoryFormState =
  | { mode: 'create'; sectionId: string }
  | { mode: 'edit'; category: MenuCategory; sectionId: string }
  | null;

const DEFAULT_CURRENCY = 'DIN';

export function AdminMenuManager() {
  const { sections, loading, error, reload } = useAdminMenu();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const [productForm, setProductForm] = useState<ProductFormState>(null);
  const [sectionForm, setSectionForm] = useState<SectionFormState>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(null);

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [orderingBusy, setOrderingBusy] = useState(false);

  const [orderedSections, setOrderedSections] = useState<MenuSection[] | null>(null);
  useEffect(() => {
    if (sections) setOrderedSections(sections);
  }, [sections]);

  const totalProducts = useMemo(
    () =>
      orderedSections?.reduce(
        (acc, s) =>
          acc + s.categories.reduce((acc2, c) => acc2 + c.products.length, 0),
        0,
      ) ?? 0,
    [orderedSections],
  );

  const runMutation = async (fn: () => Promise<void>) => {
    setFormSubmitting(true);
    setFormError(null);
    try {
      await fn();
      setProductForm(null);
      setSectionForm(null);
      setCategoryForm(null);
      await reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSubmitProduct = (values: ProductFormValues) => {
    if (!productForm) return;
    void runMutation(async () => {
      if (productForm.mode === 'create') {
        await createProduct({
          category_id: values.category_id,
          name: values.name,
          description: values.description,
          volume: values.volume,
          price: values.price,
          image_url: values.image_url,
        });
      } else {
        await updateProduct(productForm.product.id, {
          category_id: values.category_id,
          name: values.name,
          description: values.description,
          volume: values.volume,
          price: values.price,
          image_url: values.image_url,
        });
      }
    });
  };

  const handleSubmitSection = (values: SectionFormValues) => {
    if (!sectionForm) return;
    void runMutation(async () => {
      if (sectionForm.mode === 'create') {
        await createSection({ name: values.name });
      } else {
        await updateSection(sectionForm.section.id, {
          name: values.name,
          is_active: values.is_active,
        });
      }
    });
  };

  const handleSubmitCategory = (values: CategoryFormValues) => {
    if (!categoryForm) return;
    void runMutation(async () => {
      if (categoryForm.mode === 'create') {
        await createCategory({
          section_id: values.section_id,
          name: values.name,
          description: values.description,
        });
      } else {
        await updateCategory(categoryForm.category.id, {
          name: values.name,
          description: values.description,
          section_id: values.section_id,
          is_active: values.is_active,
        });
      }
    });
  };

  const handleDeleteSection = async (section: MenuSection) => {
    const productCount = section.categories.reduce(
      (n, c) => n + c.products.length,
      0,
    );
    const msg =
      `Obrisati sekciju "${section.name}"?` +
      ` Ovo brise i sve kategorije (${section.categories.length})` +
      ` i stavke (${productCount}). Ne moze se opozvati.`;
    if (!window.confirm(msg)) return;
    try {
      await deleteSection(section.id);
      await reload();
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleDeleteCategory = async (sectionName: string, cat: MenuCategory) => {
    const msg =
      `Obrisati kategoriju "${cat.name}" u sekciji "${sectionName}"?` +
      ` Brise se i ${cat.products.length} stavki. Ne moze se opozvati.`;
    if (!window.confirm(msg)) return;
    try {
      await deleteCategory(cat.id);
      await reload();
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleSavePrice = async (productId: string, newPrice: number) => {
    try {
      await updateProduct(productId, { price: newPrice });
      await reload();
    } catch (e) {
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

  const handleDeleteProduct = async (productId: string) => {
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

  const safe = orderedSections ?? sections ?? [];

  return (
    <section className="px-5 py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <p className="text-[11px] uppercase tracking-widest text-muted">
          {totalProducts} stavki · {safe.length} sekcija
        </p>
        <div className="flex items-center gap-2">
          {(loading || orderingBusy) && (
            <p className="text-[11px] uppercase tracking-widest text-muted/70">
              {orderingBusy ? 'Cuvam redosled...' : 'Osvezavam...'}
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setSectionForm({ mode: 'create' });
            }}
            className="border border-accent/70 text-accent uppercase tracking-widish font-display font-bold text-[10px] px-2.5 py-1.5 hover:bg-accent hover:text-bg transition-colors"
          >
            + Sekcija
          </button>
        </div>
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(e) => void handleSectionDragEnd(e, safe, setOrderedSections, setGlobalError, setOrderingBusy, reload)}
      >
        <SortableContext items={safe.map((s) => s.id)}>
          <div className="space-y-10">
            {safe.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                disabled={orderingBusy || formSubmitting}
                onEditSection={() => {
                  setFormError(null);
                  setSectionForm({ mode: 'edit', section });
                }}
                onDeleteSection={() => void handleDeleteSection(section)}
                onAddCategory={() => {
                  setFormError(null);
                  setCategoryForm({ mode: 'create', sectionId: section.id });
                }}
                onEditCategory={(cat) => {
                  setFormError(null);
                  setCategoryForm({ mode: 'edit', category: cat, sectionId: section.id });
                }}
                onDeleteCategory={(cat) => void handleDeleteCategory(section.name, cat)}
                onAddProduct={(catId) => {
                  setFormError(null);
                  setProductForm({ mode: 'create', categoryId: catId });
                }}
                onEditProduct={(catId, p) => {
                  setFormError(null);
                  setProductForm({ mode: 'edit', product: p, categoryId: catId });
                }}
                onDeleteProduct={handleDeleteProduct}
                onSavePrice={handleSavePrice}
                onToggleAvailability={handleToggleAvailability}
                onReorderCategories={async (nextCategories) => {
                  // optimistic UI
                  setOrderedSections((prev) =>
                    (prev ?? safe).map((s) =>
                      s.id === section.id ? { ...s, categories: nextCategories } : s,
                    ),
                  );
                  setOrderingBusy(true);
                  try {
                    await updateCategorySortOrder(
                      nextCategories.map((c, idx) => ({
                        id: c.id,
                        section_id: section.id,
                        name: c.name,
                        is_active: c.is_active,
                        sort_order: idx + 1,
                      })),
                    );
                    await reload();
                  } catch (err) {
                    setGlobalError(err instanceof Error ? err.message : String(err));
                    await reload();
                  } finally {
                    setOrderingBusy(false);
                  }
                }}
                onReorderProducts={async (categoryId, nextProducts) => {
                  setOrderedSections((prev) =>
                    (prev ?? safe).map((s) =>
                      s.id !== section.id
                        ? s
                        : {
                            ...s,
                            categories: s.categories.map((c) =>
                              c.id === categoryId ? { ...c, products: nextProducts } : c,
                            ),
                          },
                    ),
                  );
                  setOrderingBusy(true);
                  try {
                    await updateProductSortOrder(
                      nextProducts.map((p, idx) => ({
                        id: p.id,
                        category_id: categoryId,
                        name: p.name,
                        sort_order: idx + 1,
                      })),
                    );
                    await reload();
                  } catch (err) {
                    setGlobalError(err instanceof Error ? err.message : String(err));
                    await reload();
                  } finally {
                    setOrderingBusy(false);
                  }
                }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {productForm && sections && (
        <ProductForm
          mode={productForm.mode}
          sections={sections}
          initial={
            productForm.mode === 'create'
              ? { category_id: productForm.categoryId }
              : {
                  category_id: productForm.categoryId,
                  name: productForm.product.name,
                  description: productForm.product.description ?? null,
                  volume: productForm.product.volume ?? null,
                  price: productForm.product.price,
                  image_url: productForm.product.image_url ?? null,
                }
          }
          submitting={formSubmitting}
          errorMessage={formError}
          onSubmit={handleSubmitProduct}
          onCancel={() => {
            if (formSubmitting) return;
            setProductForm(null);
            setFormError(null);
          }}
        />
      )}

      {sectionForm && (
        <SectionForm
          mode={sectionForm.mode}
          section={sectionForm.mode === 'edit' ? sectionForm.section : undefined}
          submitting={formSubmitting}
          errorMessage={formError}
          onSubmit={handleSubmitSection}
          onCancel={() => {
            if (formSubmitting) return;
            setSectionForm(null);
            setFormError(null);
          }}
        />
      )}

      {categoryForm && sections && (
        <CategoryForm
          mode={categoryForm.mode}
          sections={sections}
          initialSectionId={categoryForm.sectionId}
          category={categoryForm.mode === 'edit' ? categoryForm.category : undefined}
          submitting={formSubmitting}
          errorMessage={formError}
          onSubmit={handleSubmitCategory}
          onCancel={() => {
            if (formSubmitting) return;
            setCategoryForm(null);
            setFormError(null);
          }}
        />
      )}
    </section>
  );
}

type SectionGroupProps = {
  section: MenuSection;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  onEditSection: () => void;
  onDeleteSection: () => void;
  onAddCategory: () => void;
  onEditCategory: (cat: MenuCategory) => void;
  onDeleteCategory: (cat: MenuCategory) => void;
  onAddProduct: (categoryId: string) => void;
  onEditProduct: (categoryId: string, product: MenuProduct) => void;
  onDeleteProduct: (productId: string) => Promise<void>;
  onSavePrice: (productId: string, price: number) => Promise<void>;
  onToggleAvailability: (productId: string, next: boolean) => Promise<void>;
  onReorderCategories: (next: MenuCategory[]) => Promise<void>;
  onReorderProducts: (categoryId: string, next: MenuProduct[]) => Promise<void>;
};

function SectionGroup({
  section,
  dragHandleProps,
  onEditSection,
  onDeleteSection,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onSavePrice,
  onToggleAvailability,
  onReorderCategories,
  onReorderProducts,
}: SectionGroupProps) {
  return (
    <div>
      <header className="mb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex items-start gap-2">
            <button
              type="button"
              aria-label="Prevuci za promenu redosleda"
              className="mt-0.5 h-8 w-7 grid place-items-center border border-white/10 text-muted hover:text-white hover:border-white/30 transition-colors cursor-grab active:cursor-grabbing"
              {...dragHandleProps}
            >
              ⋮⋮
            </button>
            <h2 className="font-display font-extrabold uppercase tracking-widish text-2xl leading-none min-w-0">
              {section.name}
              {!section.is_active && (
                <span className="ml-3 text-[10px] tracking-widish text-muted align-middle">
                  (skrivena)
                </span>
              )}
            </h2>
          </div>
          <div className="flex shrink-0 flex-wrap gap-1 justify-end">
            <AdminChipButton label="Izmeni" onClick={onEditSection} />
            <AdminChipButton label="Obrisi" onClick={onDeleteSection} danger />
          </div>
        </div>
        <span aria-hidden="true" className="mt-2 block h-px w-10 bg-accent" />
        <button
          type="button"
          onClick={onAddCategory}
          className="mt-3 border border-dashed border-white/15 text-muted hover:border-accent hover:text-accent uppercase tracking-widish font-display font-bold text-[10px] px-2 py-1.5 transition-colors"
        >
          + Kategorija u {section.name}
        </button>
      </header>

      {section.categories.length === 0 && (
        <p className="text-muted text-sm py-4">Nema kategorija u ovoj sekciji.</p>
      )}

      <CategorySortableSection
        sectionId={section.id}
        categories={section.categories}
        onReorder={onReorderCategories}
        renderCategory={(cat) => (
          <ProductSortableCategory
            key={cat.id}
            category={cat}
            onReorder={(next) => onReorderProducts(cat.id, next)}
            renderHeader={(dragHandleProps) => (
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <div className="min-w-0 flex items-baseline gap-2">
                  <button
                    type="button"
                    aria-label="Prevuci za promenu redosleda"
                    className="h-6 w-6 grid place-items-center border border-white/10 text-muted hover:text-white hover:border-white/30 transition-colors cursor-grab active:cursor-grabbing"
                    {...dragHandleProps}
                  >
                    ⋮⋮
                  </button>
                  <h3 className="font-display font-bold uppercase tracking-widish text-[12px] text-muted flex items-baseline gap-2 min-w-0">
                    <span className="truncate">{cat.name}</span>
                    {!cat.is_active && (
                      <span className="text-[10px] text-muted/70 shrink-0">(skrivena)</span>
                    )}
                  </h3>
                </div>
                <div className="flex shrink-0 gap-1">
                  <AdminChipButton label="Izmeni" onClick={() => onEditCategory(cat)} />
                  <AdminChipButton
                    label="Obrisi"
                    onClick={() => onDeleteCategory(cat)}
                    danger
                  />
                </div>
              </div>
            )}
            renderProduct={(p, dragHandleProps) => (
              <SortableProductRow
                key={p.id}
                product={p}
                currency={DEFAULT_CURRENCY}
                onEdit={() => onEditProduct(cat.id, p)}
                onDelete={() => onDeleteProduct(p.id)}
                onSavePrice={(price) => onSavePrice(p.id, price)}
                onToggleAvailability={(next) => onToggleAvailability(p.id, next)}
                dragHandleProps={dragHandleProps}
              />
            )}
            footerButton={
              <button
                type="button"
                onClick={() => onAddProduct(cat.id)}
                className="mt-2 w-full border border-dashed border-white/15 text-muted hover:border-accent hover:text-accent uppercase tracking-widish font-display font-bold text-[11px] py-2 transition-colors"
              >
                + Dodaj stavku u {cat.name}
              </button>
            }
          />
        )}
      />
    </div>
  );
}

function AdminChipButton({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`uppercase tracking-widish font-display font-bold text-[9px] px-1.5 py-1 border transition-colors ${
        danger
          ? 'border-white/10 text-muted hover:border-accent hover:text-accent'
          : 'border-white/15 text-white/80 hover:border-white/40 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

function SortableSection({
  section,
  disabled,
  ...rest
}: Omit<SectionGroupProps, 'dragHandleProps'> & { disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <SectionGroup section={section} dragHandleProps={{ ...attributes, ...listeners }} {...rest} />
    </div>
  );
}

async function handleSectionDragEnd(
  event: DragEndEvent,
  current: MenuSection[],
  setOrdered: (v: MenuSection[] | ((prev: MenuSection[] | null) => MenuSection[])) => void,
  setError: (v: string | null) => void,
  setBusy: (v: boolean) => void,
  reload: () => Promise<void>,
) {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const oldIndex = current.findIndex((s) => s.id === String(active.id));
  const newIndex = current.findIndex((s) => s.id === String(over.id));
  if (oldIndex < 0 || newIndex < 0) return;

  const next = arrayMove(current, oldIndex, newIndex);
  setOrdered(next);

  setBusy(true);
  try {
    await updateSectionSortOrder(
      next.map((s, idx) => ({
        id: s.id,
        name: s.name,
        is_active: s.is_active,
        sort_order: idx + 1,
      })),
    );
    await reload();
  } catch (e) {
    setError(e instanceof Error ? e.message : String(e));
    await reload();
  } finally {
    setBusy(false);
  }
}

function CategorySortableSection({
  sectionId,
  categories,
  onReorder,
  renderCategory,
}: {
  sectionId: string;
  categories: MenuCategory[];
  onReorder: (next: MenuCategory[]) => Promise<void>;
  renderCategory: (cat: MenuCategory) => React.ReactNode;
}) {
  return (
    <DndContext
      sensors={useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))}
      collisionDetection={closestCenter}
      onDragEnd={(e) => {
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        const oldIndex = categories.findIndex((c) => c.id === String(active.id));
        const newIndex = categories.findIndex((c) => c.id === String(over.id));
        if (oldIndex < 0 || newIndex < 0) return;
        void onReorder(arrayMove(categories, oldIndex, newIndex));
      }}
    >
      <SortableContext items={categories.map((c) => c.id)}>
        {categories.map((cat) => (
          <div key={`${sectionId}:${cat.id}`}>{renderCategory(cat)}</div>
        ))}
      </SortableContext>
    </DndContext>
  );
}

function ProductSortableCategory({
  category,
  onReorder,
  renderHeader,
  renderProduct,
  footerButton,
}: {
  category: MenuCategory;
  onReorder: (next: MenuProduct[]) => Promise<void>;
  renderHeader: (dragHandleProps: React.HTMLAttributes<HTMLButtonElement>) => React.ReactNode;
  renderProduct: (
    product: MenuProduct,
    dragHandleProps: React.HTMLAttributes<HTMLButtonElement>,
  ) => React.ReactNode;
  footerButton: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
  };

  const products = category.products;

  return (
    <div ref={setNodeRef} style={style} className="mt-5">
      {renderHeader({ ...attributes, ...listeners })}

      {category.description && (
        <p className="text-[12px] text-muted/80 mb-2">{category.description}</p>
      )}

      <DndContext
        sensors={useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))}
        collisionDetection={closestCenter}
        onDragEnd={(e) => {
          const { active, over } = e;
          if (!over || active.id === over.id) return;
          const oldIndex = products.findIndex((p) => p.id === String(active.id));
          const newIndex = products.findIndex((p) => p.id === String(over.id));
          if (oldIndex < 0 || newIndex < 0) return;
          void onReorder(arrayMove(products, oldIndex, newIndex));
        }}
      >
        <SortableContext items={products.map((p) => p.id)}>
          <ul>
            {products.map((p) => (
              <SortableProductWrapper key={p.id} id={p.id}>
                {(dragHandleProps) => renderProduct(p, dragHandleProps)}
              </SortableProductWrapper>
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {footerButton}
    </div>
  );
}

function SortableProductWrapper({
  id,
  children,
}: {
  id: string;
  children: (dragHandleProps: React.HTMLAttributes<HTMLButtonElement>) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ ...attributes, ...listeners })}
    </div>
  );
}

function SortableProductRow({
  product,
  currency,
  onEdit,
  onDelete,
  onSavePrice,
  onToggleAvailability,
  dragHandleProps,
}: {
  product: MenuProduct;
  currency: string;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onSavePrice: (newPrice: number) => Promise<void>;
  onToggleAvailability: (next: boolean) => Promise<void>;
  dragHandleProps: React.HTMLAttributes<HTMLButtonElement>;
}) {
  return (
    <div className="flex gap-2 items-stretch">
      <button
        type="button"
        aria-label="Prevuci za promenu redosleda"
        className="mt-3 h-8 w-7 grid place-items-center border border-white/10 text-muted hover:text-white hover:border-white/30 transition-colors cursor-grab active:cursor-grabbing shrink-0"
        {...dragHandleProps}
      >
        ⋮⋮
      </button>
      <div className="min-w-0 flex-1">
        <AdminProductRow
          product={product}
          currency={currency}
          onEdit={onEdit}
          onDelete={onDelete}
          onSavePrice={onSavePrice}
          onToggleAvailability={onToggleAvailability}
        />
      </div>
    </div>
  );
}
