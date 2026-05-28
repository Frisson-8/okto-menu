import { supabase } from './client';
import type {
  CategoryRow,
  ProductRow,
  SectionRow,
  SettingsRow,
} from './types';

// Shapes returned by getMenu() / getMenuForAdmin(). Narrower than raw rows
// because the menu only needs display + admin-edit fields.
export type MenuProduct = Pick<
  ProductRow,
  | 'id'
  | 'name'
  | 'description'
  | 'volume'
  | 'price'
  | 'image_url'
  | 'sort_order'
  | 'is_available'
>;

export type MenuCategory = Pick<
  CategoryRow,
  'id' | 'name' | 'description' | 'sort_order' | 'is_active'
> & { products: MenuProduct[] };

export type MenuSection = Pick<
  SectionRow,
  'id' | 'name' | 'sort_order' | 'is_active'
> & { categories: MenuCategory[] };

const MENU_SELECT =
  'id,name,sort_order,is_active,' +
  'categories(id,name,description,sort_order,is_active,' +
  'products(id,name,description,volume,price,image_url,sort_order,is_available))';

export async function getSettings(): Promise<SettingsRow | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// One nested query, then filter + sort in JS. Dataset is ~91 rows; doing it
// in JS is intentional — nested-embed filtering in supabase-js is fiddly and
// this stays trivial to reason about.
export async function getMenu(): Promise<MenuSection[]> {
  const { data, error } = await supabase.from('sections').select(MENU_SELECT);
  if (error) throw error;
  if (!data) return [];

  const raw = data as unknown as MenuSection[];

  return raw
    .filter((s) => s.is_active)
    .map((s) => ({
      ...s,
      categories: (s.categories ?? [])
        .filter((c) => c.is_active)
        .map((c) => ({
          ...c,
          products: (c.products ?? [])
            .filter((p) => p.is_available)
            .sort((a, b) => a.sort_order - b.sort_order),
        }))
        .sort((a, b) => a.sort_order - b.sort_order),
    }))
    .sort((a, b) => a.sort_order - b.sort_order);
}

// Admin variant: same shape, NO active/available filtering, sorted at every
// level so the admin sees the truth including hidden rows.
export async function getMenuForAdmin(): Promise<MenuSection[]> {
  const { data, error } = await supabase.from('sections').select(MENU_SELECT);
  if (error) throw error;
  if (!data) return [];

  const raw = data as unknown as MenuSection[];

  return raw
    .map((s) => ({
      ...s,
      categories: (s.categories ?? [])
        .map((c) => ({
          ...c,
          products: (c.products ?? []).sort(
            (a, b) => a.sort_order - b.sort_order,
          ),
        }))
        .sort((a, b) => a.sort_order - b.sort_order),
    }))
    .sort((a, b) => a.sort_order - b.sort_order);
}
