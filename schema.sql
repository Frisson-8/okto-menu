-- ============================================================
-- OKTO MENU - Supabase schema (two-level: sections -> categories -> products)
-- Run in: Supabase Dashboard -> SQL Editor -> New query
-- Idempotent: safe to re-run.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- updated_at trigger helper ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- settings (single row config for the whole venue + menu)
-- ============================================================
create table if not exists public.settings (
  id            smallint primary key default 1,
  pub_name      text not null default 'OKTO',
  logo_url      text,
  hero_url      text,
  currency      text not null default 'DIN',
  accent_color  text not null default '#E8A33D',
  wifi_password text,
  instagram     text,
  address       text,
  phone         text,
  email         text,
  website       text,
  footer_note   text,
  updated_at    timestamptz not null default now(),
  constraint settings_singleton check (id = 1)
);

drop trigger if exists trg_settings_updated_at on public.settings;
create trigger trg_settings_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- ============================================================
-- sections (top-level menu tabs: Energija, Sokovi, Piva...)
-- ============================================================
create table if not exists public.sections (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_sections_updated_at on public.sections;
create trigger trg_sections_updated_at
  before update on public.sections
  for each row execute function public.set_updated_at();

create index if not exists idx_sections_sort on public.sections (sort_order);

-- ============================================================
-- categories (sub-groups within a section: Voda, Kafa, Flasica...)
-- ============================================================
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  section_id  uuid not null references public.sections(id) on delete cascade,
  name        text not null,
  description text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (section_id, name)   -- Flasica/Toceno can repeat across sections
);

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create index if not exists idx_categories_section on public.categories (section_id, sort_order);

-- ============================================================
-- products (menu items)
-- ============================================================
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.categories(id) on delete cascade,
  name         text not null,
  description  text,
  volume       text,                       -- e.g. "0,33 l", "0,03 l", "100 gr", "min"
  price        numeric(10,2) not null default 0,
  image_url    text,
  is_available boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create index if not exists idx_products_category on public.products (category_id, sort_order);

-- ============================================================
-- ROW LEVEL SECURITY
-- Everyone can READ (public menu via anon key); only authenticated WRITE.
-- ============================================================
alter table public.settings   enable row level security;
alter table public.sections   enable row level security;
alter table public.categories enable row level security;
alter table public.products   enable row level security;

drop policy if exists "settings_read_all"   on public.settings;
drop policy if exists "settings_write_auth" on public.settings;
create policy "settings_read_all"   on public.settings for select using (true);
create policy "settings_write_auth" on public.settings for update to authenticated using (true) with check (true);

drop policy if exists "sections_read_all"   on public.sections;
drop policy if exists "sections_write_auth" on public.sections;
create policy "sections_read_all"   on public.sections for select using (true);
create policy "sections_write_auth" on public.sections for all to authenticated using (true) with check (true);

drop policy if exists "categories_read_all"   on public.categories;
drop policy if exists "categories_write_auth" on public.categories;
create policy "categories_read_all"   on public.categories for select using (true);
create policy "categories_write_auth" on public.categories for all to authenticated using (true) with check (true);

drop policy if exists "products_read_all"   on public.products;
drop policy if exists "products_write_auth" on public.products;
create policy "products_read_all"   on public.products for select using (true);
create policy "products_write_auth" on public.products for all to authenticated using (true) with check (true);

-- ============================================================
-- STORAGE: menu images
-- ============================================================
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

drop policy if exists "menu_images_read_all" on storage.objects;
create policy "menu_images_read_all" on storage.objects for select using (bucket_id = 'menu-images');

drop policy if exists "menu_images_write_auth" on storage.objects;
create policy "menu_images_write_auth" on storage.objects for all to authenticated
  using (bucket_id = 'menu-images') with check (bucket_id = 'menu-images');

-- ============================================================
-- SEED: real OKTO menu (Cenovnik 08-2025)
-- ============================================================

-- settings (single row, filled from the price list)
insert into public.settings (id, pub_name, currency, accent_color, wifi_password, instagram, address, phone, email, website, footer_note)
values (1, 'OKTO', 'DIN', '#E8A33D', 'oktobilijar', '@okto.pub',
        'Jurija Gagarina 151a, Beograd', '+381 60 43 48 130',
        'rezervacije@okto.rs', 'www.okto.rs',
        'Na svirkama cene su uvecane za 10%')
on conflict (id) do nothing;

-- sections
insert into public.sections (name, sort_order) values
  ('Energija', 1),
  ('Sokovi', 2),
  ('Domaca piva', 3),
  ('Strana piva', 4),
  ('Zestoka pica', 5),
  ('Akov', 6),
  ('Grickalice i igre', 7)
on conflict (name) do nothing;

-- categories (matched to section by name)
insert into public.categories (section_id, name, sort_order)
select s.id, v.cat, v.ord
from (values
  ('Energija','Voda',1),
  ('Energija','Kafa',2),
  ('Energija','Energetska pica',3),
  ('Sokovi','Negazirani',1),
  ('Sokovi','Gazirani',2),
  ('Domaca piva','Flasica',1),
  ('Domaca piva','Toceno',2),
  ('Strana piva','Flasica',1),
  ('Strana piva','Toceno',2),
  ('Zestoka pica','Viski',1),
  ('Zestoka pica','Rum',2),
  ('Zestoka pica','Liker',3),
  ('Zestoka pica','Tekila',4),
  ('Zestoka pica','Vodka',5),
  ('Zestoka pica','Gin',6),
  ('Zestoka pica','Vina',7),
  ('Zestoka pica','Rakija',8),
  ('Akov','Akov',1),
  ('Grickalice i igre','Grickalice',1),
  ('Grickalice i igre','Igre',2)
) as v(sec, cat, ord)
join public.sections s on s.name = v.sec
on conflict (section_id, name) do nothing;

-- products (matched to category by section + category name)
insert into public.products (category_id, name, volume, price, sort_order)
select c.id, v.name, nullif(v.volume,''), v.price, v.ord
from (values
  -- Energija / Voda
  ('Energija','Voda','Rosa','0,33 l',190,1),
  ('Energija','Voda','Rosa gazirana','0,33 l',190,2),
  ('Energija','Voda','Romerquelle limun','0,35 l',240,3),
  -- Energija / Kafa
  ('Energija','Kafa','Espresso','',170,1),
  ('Energija','Kafa','Espresso sa mlekom','',190,2),
  ('Energija','Kafa','Nes kafa','',200,3),
  ('Energija','Kafa','Caj','',160,4),
  -- Energija / Energetska pica
  ('Energija','Energetska pica','Red Bull','0,25 l',330,1),
  ('Energija','Energetska pica','Red Bull Sugar Free','0,25 l',330,2),
  ('Energija','Energetska pica','Red Bull Red','0,25 l',330,3),
  ('Energija','Energetska pica','Red Bull Zero','0,25 l',350,4),
  ('Energija','Energetska pica','Red Bull Summer breskva','0,25 l',350,5),
  -- Sokovi / Negazirani
  ('Sokovi','Negazirani','Cedjena pomorandza','0,20 l',360,1),
  ('Sokovi','Negazirani','Limunada','0,15 l',240,2),
  ('Sokovi','Negazirani','Ice tea','0,25 l',240,3),
  ('Sokovi','Negazirani','Next sokovi','0,20 l',260,4),
  ('Sokovi','Negazirani','Cedevita','0,25 l',180,5),
  -- Sokovi / Gazirani
  ('Sokovi','Gazirani','Coca Cola','0,25 l',240,1),
  ('Sokovi','Gazirani','Coca Cola Zero','0,25 l',240,2),
  ('Sokovi','Gazirani','Coca Cola Lime','0,25 l',240,3),
  ('Sokovi','Gazirani','Sprite','0,25 l',240,4),
  ('Sokovi','Gazirani','Fanta','0,25 l',240,5),
  ('Sokovi','Gazirani','Schweppes Tonic Water','0,25 l',290,6),
  ('Sokovi','Gazirani','Schweppes Bitter Lemon','0,25 l',290,7),
  ('Sokovi','Gazirani','Schweppes Pink Tonik','0,25 l',290,8),
  -- Domaca piva / Flasica
  ('Domaca piva','Flasica','Jelen','0,33 l',240,1),
  ('Domaca piva','Flasica','Niksicko','0,33 l',320,2),
  -- Domaca piva / Toceno
  ('Domaca piva','Toceno','Jelen','0,33 l',230,1),
  ('Domaca piva','Toceno','Jelen','0,50 l',320,2),
  ('Domaca piva','Toceno','Niksicko','0,33 l',230,3),
  ('Domaca piva','Toceno','Niksicko','0,50 l',320,4),
  ('Domaca piva','Toceno','Niksicko tamno','0,33 l',280,5),
  ('Domaca piva','Toceno','Niksicko tamno','0,50 l',390,6),
  -- Strana piva / Flasica
  ('Strana piva','Flasica','Stella Artois','0,33 l',460,1),
  ('Strana piva','Flasica','Staropramen','0,33 l',260,2),
  ('Strana piva','Flasica','Bavaria','0,25 l',320,3),
  ('Strana piva','Flasica','Corona','0,35 l',550,4),
  -- Strana piva / Toceno
  ('Strana piva','Toceno','Stella Artois','0,25 l',260,1),
  ('Strana piva','Toceno','Stella Artois','0,50 l',440,2),
  ('Strana piva','Toceno','Bavaria','0,25 l',250,3),
  ('Strana piva','Toceno','Bavaria','0,50 l',440,4),
  ('Strana piva','Toceno','Blue Moon','0,33 l',460,5),
  ('Strana piva','Toceno','Blue Moon','0,50 l',600,6),
  ('Strana piva','Toceno','Hoegaarden','0,33 l',460,7),
  ('Strana piva','Toceno','Hoegaarden','0,50 l',600,8),
  -- Zestoka / Viski
  ('Zestoka pica','Viski','Ballantine''s Finest','0,03 l',250,1),
  ('Zestoka pica','Viski','Chivas Regal 12 Y.O.','0,03 l',390,2),
  ('Zestoka pica','Viski','Jameson','0,03 l',330,3),
  ('Zestoka pica','Viski','Johnnie Walker Red','0,03 l',250,4),
  ('Zestoka pica','Viski','Johnnie Walker Black','0,03 l',450,5),
  ('Zestoka pica','Viski','Jack Daniel''s','0,03 l',350,6),
  ('Zestoka pica','Viski','Four Roses','0,03 l',350,7),
  ('Zestoka pica','Viski','Deacon','0,03 l',460,8),
  ('Zestoka pica','Viski','Monkey Shoulder','0,03 l',530,9),
  -- Zestoka / Rum
  ('Zestoka pica','Rum','Havana Club 3 Y.O.','0,03 l',300,1),
  ('Zestoka pica','Rum','Bacardi Blanco','0,03 l',320,2),
  -- Zestoka / Liker
  ('Zestoka pica','Liker','Ramazzotti','0,03 l',170,1),
  ('Zestoka pica','Liker','Ramazzotti Limoncello','0,03 l',170,2),
  ('Zestoka pica','Liker','Gorki list','0,03 l',190,3),
  ('Zestoka pica','Liker','Jagermeister','0,03 l',250,4),
  ('Zestoka pica','Liker','Vinjak 5','0,03 l',230,5),
  -- Zestoka / Tekila
  ('Zestoka pica','Tekila','Olmeca Silver','0,03 l',250,1),
  ('Zestoka pica','Tekila','Olmeca Gold','0,03 l',250,2),
  -- Zestoka / Vodka
  ('Zestoka pica','Vodka','Absolut','0,03 l',260,1),
  ('Zestoka pica','Vodka','Finlandia','0,03 l',260,2),
  ('Zestoka pica','Vodka','Ivan Grozny','0,03 l',720,3),
  -- Zestoka / Gin
  ('Zestoka pica','Gin','Beefeater','0,03 l',260,1),
  ('Zestoka pica','Gin','Bombay Gin','0,03 l',260,2),
  ('Zestoka pica','Gin','Malfy Gin','0,03 l',360,3),
  ('Zestoka pica','Gin','Hendrick''s','0,03 l',460,4),
  ('Zestoka pica','Gin','Monkey 47','0,03 l',570,5),
  -- Zestoka / Vina
  ('Zestoka pica','Vina','Aspall Jabuka','0,33 l',420,1),
  ('Zestoka pica','Vina','Aspall Malina','0,33 l',420,2),
  ('Zestoka pica','Vina','Chardonnay','0,187 l',420,3),
  ('Zestoka pica','Vina','Rubin Rose','0,187 l',360,4),
  ('Zestoka pica','Vina','Vranac','0,187 l',420,5),
  ('Zestoka pica','Vina','Aleksic Barbara','0,187 l',420,6),
  -- Zestoka / Rakija
  ('Zestoka pica','Rakija','Medovaca','0,03 l',220,1),
  ('Zestoka pica','Rakija','Viljamovka Takovo','0,03 l',240,2),
  -- Akov
  ('Akov','Akov','Akov Sljiva','0,03 l',300,1),
  ('Akov','Akov','Akov Kajsija','0,03 l',300,2),
  ('Akov','Akov','Akov Dunja','0,03 l',300,3),
  ('Akov','Akov','Akov Kruska','0,03 l',300,4),
  ('Akov','Akov','Akov Jabuka','0,03 l',300,5),
  ('Akov','Akov','Akov Loza','0,03 l',300,6),
  ('Akov','Akov','Akov Sargarepa','0,03 l',300,7),
  ('Akov','Akov','Medunja liker','0,03 l',300,8),
  -- Grickalice
  ('Grickalice i igre','Grickalice','Kokice slane','100 gr',190,1),
  -- Igre
  ('Grickalice i igre','Igre','Pikado kredit','',35,1),
  ('Grickalice i igre','Igre','Bilijar','min',13,2),
  ('Grickalice i igre','Igre','Premium bilijar','min',15,3)
) as v(sec, cat, name, volume, price, ord)
join public.sections   s on s.name = v.sec
join public.categories c on c.section_id = s.id and c.name = v.cat
where not exists (
  select 1 from public.products p
  where p.category_id = c.id and p.name = v.name
    and coalesce(p.volume,'') = coalesce(nullif(v.volume,''),'')
);

-- ============================================================
-- NEXT:
--  1) Create owner login: Authentication -> Users -> Add user.
--     Disable public signups: Authentication -> Providers -> Email.
--  2) Generate TS types:
--     npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts
-- ============================================================
