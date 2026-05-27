# Phase 3 — Product CRUD (edit items + prices)

This is the core feature: the owner edits menu items and prices, and the change
shows up on the public menu.

Auth: everything here lives behind the existing /admin guard from Phase 2.
Mutations run while logged in, so the RLS "authenticated" write policies pass.
Nothing here is exposed to anon. Keep it all client-side (static export).

## Data: admin must see EVERYTHING
The public getMenu() filters out inactive/unavailable rows. Admin must see them.
- src/lib/supabase/queries.ts: add getMenuForAdmin() — same nested
  sections -> categories -> products shape, but with NO is_active/is_available
  filtering. Sort by sort_order at every level. Each product keeps its
  is_available flag so the UI can show and toggle it.

## Mutations (src/lib/supabase/mutations.ts)
- createProduct(input): insert into products (category_id, name, description,
  volume, price; is_available defaults true; sort_order = current max + 1 in
  that category).
- updateProduct(id, patch): update name / description / volume / price / category_id.
- deleteProduct(id): delete (UI must confirm first).
- setProductAvailability(id, isAvailable): update is_available.
All return the affected row or throw. Never swallow errors.

## Admin UI (replace the Phase 2 placeholder in src/app/admin/page.tsx)
Keep the Phase 2 shell (OKTO Admin header, owner email, Logout). Replace the
placeholder body with the menu manager:
- Load via getMenuForAdmin(); render sections -> categories -> products.
- Each product row: name, volume, price, an availability toggle, an Edit button,
  and a Delete button. Dim the row when unavailable.
- Quick price edit: clicking the price lets the owner change just the price fast
  and save — this is the single most common action, make it low-friction.
- Availability toggle writes immediately (setProductAvailability).
- "Dodaj stavku" per category -> opens the product form.
- Product form (modal or inline panel), used for both create and edit:
  fields name, description, volume, price, and a category selector grouped by
  section (so an item can be moved to another category).
- After any successful write, refetch getMenuForAdmin() to show the truth.
  No optimistic complexity needed; the dataset is tiny.
- Surface errors visibly (inline message or small toast). Disable buttons while
  a write is in flight.

## Price input rules
- Prices are whole DIN. Accept integers, store as numeric. Reject empty /
  negative / non-numeric with an inline message.
- Display formatting stays the same as the public menu ("230 DIN").

## Out of scope (later phases)
- Creating / editing / deleting sections and categories -> Phase 4.
- Image upload -> Phase 4.
- Drag-and-drop ordering -> Phase 5.
  (For now new items just append to the end of their category by sort_order.)

## Done when
- Logged in at /admin, the full menu (including unavailable items) is listed.
- Editing a product's price and saving updates the DB; reloading the public menu
  at / shows the new price.
- Adding an item makes it appear on the public menu (available by default).
- Toggling availability off hides it from the public menu but keeps it in admin.
- Deleting an item (after a confirm) removes it from both admin and public.
- Errors are shown, not swallowed. `npm run build` still produces static out/.

Stop after Phase 3 and summarize for review. Do not start Phase 4.
