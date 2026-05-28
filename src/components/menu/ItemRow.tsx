import type { MenuProduct } from '@/lib/supabase/queries';

type Props = {
  product: MenuProduct;
  currency: string;
};

function formatPrice(price: number, currency: string): string {
  return `${Math.round(price).toLocaleString('sr-RS')} ${currency}`;
}

export function ItemRow({ product, currency }: Props) {
  return (
    <li className="flex items-baseline gap-3 py-2.5">
      {product.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.image_url}
          alt=""
          className="h-10 w-10 shrink-0 object-cover border border-white/10"
        />
      )}
      <div className="flex items-baseline gap-2 min-w-0 max-w-[70%]">
        <span className="font-medium text-white truncate">{product.name}</span>
        {product.volume && (
          <span className="shrink-0 text-[12px] tracking-wide text-muted">
            {product.volume}
          </span>
        )}
      </div>
      <span aria-hidden="true" className="leader" />
      <span className="shrink-0 tabular-nums font-semibold text-white">
        {formatPrice(product.price, currency)}
      </span>
    </li>
  );
}
