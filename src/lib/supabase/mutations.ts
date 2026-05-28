import { supabase } from './client';
import type { CategoryRow, ProductRow, SectionRow } from './types';

export type CreateProductInput = {
  category_id: string;
  name: string;
  description?: string | null;
  volume?: string | null;
  price: number;
  image_url?: string | null;
};

export type UpdateProductPatch = {
  name?: string;
  description?: string | null;
  volume?: string | null;
  price?: number;
  category_id?: string;
  image_url?: string | null;
};

export type CreateSectionInput = { name: string };
export type UpdateSectionPatch = { name?: string; is_active?: boolean };

export type CreateCategoryInput = {
  section_id: string;
  name: string;
  description?: string | null;
};
export type UpdateCategoryPatch = {
  name?: string;
  description?: string | null;
  section_id?: string;
  is_active?: boolean;
};

// New products append to the end of their category by sort_order.
// Drag-and-drop reordering arrives in Phase 5.
export async function createProduct(input: CreateProductInput): Promise<ProductRow> {
  const { data: lastRows, error: maxError } = await supabase
    .from('products')
    .select('sort_order')
    .eq('category_id', input.category_id)
    .order('sort_order', { ascending: false })
    .limit(1);
  if (maxError) throw maxError;
  const nextOrder = (lastRows?.[0]?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from('products')
    .insert({
      category_id: input.category_id,
      name: input.name,
      description: input.description ?? null,
      volume: input.volume ?? null,
      price: input.price,
      image_url: input.image_url ?? null,
      sort_order: nextOrder,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProduct(
  id: string,
  patch: UpdateProductPatch,
): Promise<ProductRow> {
  const { data, error } = await supabase
    .from('products')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function setProductAvailability(
  id: string,
  isAvailable: boolean,
): Promise<ProductRow> {
  const { data, error } = await supabase
    .from('products')
    .update({ is_available: isAvailable })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createSection(input: CreateSectionInput): Promise<SectionRow> {
  const { data: lastRows, error: maxError } = await supabase
    .from('sections')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1);
  if (maxError) throw maxError;
  const nextOrder = (lastRows?.[0]?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from('sections')
    .insert({ name: input.name, sort_order: nextOrder })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSection(
  id: string,
  patch: UpdateSectionPatch,
): Promise<SectionRow> {
  const { data, error } = await supabase
    .from('sections')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSection(id: string): Promise<void> {
  const { error } = await supabase.from('sections').delete().eq('id', id);
  if (error) throw error;
}

export async function createCategory(input: CreateCategoryInput): Promise<CategoryRow> {
  const { data: lastRows, error: maxError } = await supabase
    .from('categories')
    .select('sort_order')
    .eq('section_id', input.section_id)
    .order('sort_order', { ascending: false })
    .limit(1);
  if (maxError) throw maxError;
  const nextOrder = (lastRows?.[0]?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from('categories')
    .insert({
      section_id: input.section_id,
      name: input.name,
      description: input.description ?? null,
      sort_order: nextOrder,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCategory(
  id: string,
  patch: UpdateCategoryPatch,
): Promise<CategoryRow> {
  const { data, error } = await supabase
    .from('categories')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

export type SectionSortOrderPatch = Pick<SectionRow, 'id' | 'name' | 'is_active' | 'sort_order'>;
export type CategorySortOrderPatch = Pick<
  CategoryRow,
  'id' | 'section_id' | 'name' | 'is_active' | 'sort_order'
>;
export type ProductSortOrderPatch = Pick<ProductRow, 'id' | 'category_id' | 'name' | 'sort_order'>;

export async function updateSectionSortOrder(
  patches: SectionSortOrderPatch[],
): Promise<void> {
  if (patches.length === 0) return;
  const { error } = await supabase.from('sections').upsert(patches);
  if (error) throw error;
}

export async function updateCategorySortOrder(
  patches: CategorySortOrderPatch[],
): Promise<void> {
  if (patches.length === 0) return;
  const { error } = await supabase.from('categories').upsert(patches);
  if (error) throw error;
}

export async function updateProductSortOrder(
  patches: ProductSortOrderPatch[],
): Promise<void> {
  if (patches.length === 0) return;
  const { error } = await supabase.from('products').upsert(patches);
  if (error) throw error;
}
