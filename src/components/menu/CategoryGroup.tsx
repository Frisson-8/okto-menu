import type { MenuCategory } from '@/lib/supabase/queries';
import { ItemRow } from './ItemRow';

type Props = { category: MenuCategory; currency: string };

export function CategoryGroup({ category, currency }: Props) {
  if (category.products.length === 0) return null;
  return (
    <div className="pt-6 first:pt-2">
      <h3 className="font-display font-bold uppercase tracking-widish text-[13px] text-muted mb-1">
        {category.name}
      </h3>
      <ul className="divide-y divide-white/5">
        {category.products.map((p) => (
          <ItemRow key={p.id} product={p} currency={currency} />
        ))}
      </ul>
    </div>
  );
}
