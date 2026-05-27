import type { MenuSection } from '@/lib/supabase/queries';
import { CategoryGroup } from './CategoryGroup';

type Props = { section: MenuSection; currency: string };

export function SectionBlock({ section, currency }: Props) {
  return (
    <section
      id={`section-${section.id}`}
      className="scroll-mt-16 px-5 pt-10 pb-2"
      data-section-id={section.id}
    >
      <header className="mb-2">
        <h2 className="font-display font-extrabold uppercase tracking-widish text-4xl leading-none">
          {section.name}
        </h2>
        <span aria-hidden="true" className="mt-3 block h-px w-12 bg-accent" />
      </header>
      <div>
        {section.categories.map((c) => (
          <CategoryGroup key={c.id} category={c} currency={currency} />
        ))}
      </div>
    </section>
  );
}
