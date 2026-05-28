# Phase 4 — Section + category CRUD + image upload

Prereq: Phase 3 product CRUD is working behind /admin.

## Mutations (`src/lib/supabase/mutations.ts`)
- `createSection` / `updateSection` / `deleteSection`
- `createCategory` / `updateCategory` / `deleteCategory`
- Product create/update accept `image_url`

## Image upload (`src/lib/uploadMenuImage.ts`)
- Client-side resize (max 800px edge) + JPEG compress before upload
- Bucket: `menu-images`, path `products/<uuid>.jpg`
- Public URL stored on `products.image_url`

## Admin UI
- **+ Sekcija** — add top-level tab
- Per section: Izmeni, Obrisi (confirm cascade), **+ Kategorija**
- Per category: Izmeni (name, description, section, visibility), Obrisi (confirm)
- Product form: optional image (pick, preview, remove)
- Section/category forms: visibility checkbox on edit

## Public menu
- `ItemRow` shows thumbnail when `image_url` is set

## Out of scope (Phase 5+)
- Drag-and-drop reorder
- Settings panel (logo, accent, pub name)

## Done when
- Owner can add/edit/delete sections and categories (with confirm on delete).
- Owner can attach a photo to a product; it appears on `/` after refresh.
- `npm run build` still exports static `out/`.

Stop after Phase 4 and summarize for review. Do not start Phase 5.
