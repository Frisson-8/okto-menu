# Phase 1 — Public menu (read-only)

Prereq: Phase 0 connectivity is green (sections/categories/products = 7/20/91).

Types (no Supabase CLI / account access available): do NOT run
`supabase gen types`. Instead, hand-write src/lib/supabase/types.ts as a
Supabase-style `Database` type based on schema.sql (it is on disk). Cover the
four tables (settings, sections, categories, products) with Row / Insert /
Update, then wire createClient<Database>(...) in client.ts so queries are
fully typed end to end.

Read the `frontend-design` skill before building any UI.

## Data layer
- src/lib/supabase/queries.ts
  - getSettings(): fetch the single settings row (id = 1).
  - getMenu(): one nested query, then shape in JS.
    Select:
      from('sections')
      .select('id,name,sort_order,is_active, categories(id,name,sort_order,is_active, products(id,name,volume,price,image_url,sort_order,is_available))')
    Then in JS:
      - drop inactive sections, inactive categories, unavailable products
      - sort sections, categories, and products by sort_order ascending
      - return a clean typed tree: Section[] with categories[] with products[]
    (Filtering/sorting in JS is intentional: the dataset is tiny (~78 rows) and
     nested embed filtering in supabase-js is fiddly. Keep it simple.)
- src/hooks/useMenu.ts: client hook that loads settings + menu in parallel and
  exposes { menu, settings, loading, error, reload }.

## Page
- Replace the temporary test in src/app/page.tsx with the real menu.
- Make it a client component ('use client'); fetch via useMenu.
- States: loading (simple skeleton), error (message + retry button), empty.
- Mobile-first: design for a 375px wide phone; desktop just centers a max-width column.

## Components (src/components/menu)
- MenuHeader: dark top bar with OKTO wordmark. Leave a slot/placeholder for the
  octopus logo image (asset pending) — for now a styled "OKTO" wordmark.
- SectionTabs: sticky, horizontally scrollable row of tabs (one per section).
  Tapping a tab smooth-scrolls to that section. Active tab underlined in accent.
- SectionBlock: section title (large, bold, uppercase).
- CategoryGroup: category sub-header (uppercase) above its items.
- ItemRow: item name on the left with volume in muted text next to it
  (e.g. "JELEN  0,33 l"); a dotted leader line filling the middle; the price on
  the right. Format price as an integer plus the currency from settings,
  e.g. "230 DIN" (no decimals).
- MenuFooter: footer_note (the "+10% na svirkama" line), WiFi password,
  Instagram, address, phone — all from settings, only render fields that exist.

## Design tokens (OKTO brand, from the price list)
- Page background: #121212. Surfaces/cards: #1c1c1c.
- Accent: use settings.accent_color (#E8A33D) for the active tab underline,
  a thin section divider, and small accent details. Use it sparingly.
- Text: #FFFFFF primary; #9a9a9a muted (volume, dotted leaders, footer).
- Headers bold + UPPERCASE; body regular weight.
- Optional nice touch matching the printed menu: a thin accent (#E8A33D) hairline
  divider under each section title.
- Keep it clean and high-contrast; it must read instantly on a phone in a dim pub.

## Out of scope (later phases)
- No editing, no auth (that's Phase 2+).
- No mascot illustrations yet (assets pending).

## Done when
- All 7 sections render with their categories and items; prices and volumes correct.
- Section tabs scroll to the correct section and stick on scroll.
- Looks clean at 375px; loading, error, and empty states all work.
- `npm run build` still produces a static out/ with no errors.

Stop after Phase 1 and summarize for review. Do not start Phase 2.
