# Okto Menu

## What this is
A QR-code digital menu for a pub. Guests scan a QR at the table and open a
mobile-first web menu on their phone. The owner logs into a private `/admin`
dashboard and edits everything: categories, items, descriptions, prices,
images, availability, and ordering. Replaces a paid Webflow site; runs at 0 EUR.

## Tech stack
- Next.js 14+ (App Router) with `output: 'export'` -> fully static build
- TypeScript
- Tailwind CSS
- Supabase: Postgres (data), Auth (single owner login), Storage (images)
- dnd-kit for drag-and-drop ordering
- Hosting: Cloudflare Pages (own account, free, commercial use allowed). Static
  `out/` deploys on push. Ship on the free `*.pages.dev` URL; custom subdomain
  meni.okto.rs is optional later via a CNAME (needs DNS access, not server access).

## Why static export (read before changing architecture)
The whole app is a static bundle. There is NO server, NO Next route handlers,
NO server actions, NO middleware. All data is read/written from the browser
using the Supabase JS client.

- Public menu fetches live from Supabase on load, so price/menu changes show
  up instantly without a rebuild.
- Admin auth guard is CLIENT-SIDE only (check session, redirect if missing).
  This is fine because real security is enforced by Supabase Row Level Security:
  anon key can only READ; writes require an authenticated session. The client
  guard is UX, not the security boundary.

If you ever need true SSR, switch host to Cloudflare Pages via OpenNext and drop
`output: 'export'`. Do not do this unless there is a concrete reason.

## Project structure
src/
  app/
    page.tsx              # public menu (the QR target)
    admin/
      page.tsx            # admin dashboard (auth-guarded, client)
      login/page.tsx      # owner login
    layout.tsx
  components/
    menu/                 # public menu UI (category nav, item card)
    admin/                # admin UI (product form, category list, dnd, uploader)
    ui/                   # primitives
  lib/
    supabase/
      client.ts           # browser Supabase client (anon key)
      types.ts            # generated DB types (supabase gen types)
      queries.ts          # read helpers (categories, products, settings)
      mutations.ts        # write helpers (admin CRUD)
  hooks/
  types/

## Data model (see schema.sql) — TWO LEVELS
The real OKTO menu has two levels, so the model is sections -> categories -> products.
- settings: single row (id=1). pub_name, logo_url, hero_url, currency ('DIN'),
  accent_color, wifi_password, instagram, address, phone, email, website, footer_note.
- sections: top-level tabs (Energija, Sokovi, Domaca piva, Strana piva,
  Zestoka pica, Akov, Grickalice i igre). name unique, sort_order, is_active.
- categories: belong to a section (section_id, cascade). name, description,
  sort_order, is_active. unique(section_id, name) because sub-names like
  "Flasica"/"Toceno" repeat across sections.
- products: belong to a category (category_id, cascade). name, description,
  volume (e.g. "0,33 l", "0,03 l", "min"), price numeric(10,2), image_url,
  is_available, sort_order.
- Every table has created_at / updated_at (updated_at via trigger).
- RLS: SELECT for everyone, write for authenticated only.
- Storage bucket: `menu-images` (public read, authenticated write).
- Seeded with the full real menu from Cenovnik 08-2025 (~78 items).

## Key patterns
- TypeScript everywhere, no `any`. Generate DB types, do not hand-write them.
- Ordering: integer `sort_order` per scope (categories globally; products within
  a category). Drag-and-drop updates sort_order in a single batch.
- Prices stored as numeric(10,2); format on display with the currency from
  settings. Never do money math in floats beyond display.
- Public menu filters `is_active` / `is_available` in the QUERY, not via RLS,
  so the admin can still see hidden items.
- Single owner: no signup flow in the app. The owner account is created once in
  the Supabase dashboard.

## Environment variables
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
(Both are public-safe: the anon key is meant for the browser; RLS protects data.)

## Design direction
Brand: dark theme, orange accent (#E8A33D), octopus-in-top-hat logo, playful
neon octopus mascots. Mobile-first: phone first, desktop is the exception.
Public menu UX: sections are sticky top tabs; within a section, categories are
sub-headers; products are rows (name, volume, price in DIN). Show footer_note
("Na svirkama cene su uvecane za 10%") and optionally WiFi at the bottom.

## Current status
- [x] Schema + RLS + storage, two-level model, seeded with real OKTO menu (schema.sql)
- [x] Phase 0: project setup
- [x] Phase 1: public menu (read-only) — ship first
- [x] Phase 2: admin auth
- [x] Phase 3: product CRUD
- [x] Phase 4: section + category CRUD + image upload
- [ ] Phase 5: drag-and-drop ordering
- [ ] Phase 6: settings panel
- [ ] Phase 7: deploy + QR code
(See BUILD-PLAN.md for phase details.)

## Commands
- `npm run dev`    — start development
- `npm run build`  — static export to ./out
- `npm run lint`   — lint
