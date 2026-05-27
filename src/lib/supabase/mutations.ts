import { supabase } from './client';
import type { ProductRow } from './types';

export type CreateProductInput = {
  category_id: string;
  name: string;
  description?: string | null;
  volume?: string | null;
  price: number;
};

export type UpdateProductPatch = {
  name?: string;
  description?: string | null;
  volume?: string | null;
  price?: number;
  category_id?: string;
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
