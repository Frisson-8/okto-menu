# Okto Menu — Build Plan

Phased plan for Claude Code. One phase at a time, Standard mode. Each phase is
independently shippable. Ship Phase 1 first — it is the visible value (the QR
menu). Admin comes after.

Use this order with GSD:
- /gsd:new-project   -> feed CLAUDE.md + this plan
- /gsd:new-milestone -> one milestone per phase below
- /gsd:execute-phase -> one phase at a time

---

## Phase 0 — Project setup
Goal: empty app that builds and connects to Supabase.

- Scaffold Next.js 14 (App Router) + TypeScript + Tailwind.
- Set `output: 'export'` in next.config (static export).
- Create the Supabase project, run schema.sql in the SQL Editor.
- Create the owner user in Supabase dashboard (Auth -> Users -> Add user).
  Disable public signups (Auth -> Providers -> Email).
- Add `.env.local` with NEXT_PUBLIC_SUPABASE_URL and _ANON_KEY.
- `src/lib/supabase/client.ts` — browser client.
- Generate types: `npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts`.
Done when: `npm run dev` runs and a test query returns the seed categories.

## Phase 1 — Public menu (read-only)  [SHIP FIRST]
Goal: the QR target. A guest opens the URL on a phone and sees the full menu.

- `lib/supabase/queries.ts`: getSettings(), getMenu() -> sections (is_active)
  -> their categories (is_active) -> their products (is_available),
  all ordered by sort_order.
- `app/page.tsx`: fetch on load, render mobile-first.
- Components: sticky section tabs (scroll-to), category sub-header, item row
  (name, volume, price formatted with settings.currency = DIN, optional image).
- Footer: footer_note + WiFi/contact from settings. Use accent_color + pub_name.
- Empty/loading states.
Done when: deployed static build shows the real seeded menu correctly on a phone.

## Phase 2 — Admin auth
Goal: only the owner can reach /admin.

- `app/admin/login/page.tsx`: email+password via supabase.auth.signInWithPassword.
- Client-side guard in `app/admin/page.tsx`: if no session, redirect to login.
- Logout button. Show current user email.
Done when: wrong/no session redirects to login; correct login reaches dashboard.

## Phase 3 — Product CRUD
Goal: owner edits items and prices (the core ask).

- `lib/supabase/mutations.ts`: create/update/delete product, toggle is_available.
- Admin view: products grouped by category, inline price edit, availability
  toggle, add/edit form (name, description, price, category, image_url later).
- Optimistic UI or refetch after write. Surface errors, never swallow them.
Done when: a price change in admin shows on the public menu after refresh.

## Phase 4 — Section + category CRUD + image upload
Goal: full content control over the menu structure.

- Section create/edit/delete (cascade deletes its categories + products — confirm).
- Category create/edit/delete under a section (cascade deletes its products).
- Image upload to Storage bucket `menu-images`; store public URL on the product.
  Compress/resize client-side before upload (keep images small for phones).
Done when: owner can add a section, a category, an item with a photo, see it live.

## Phase 5 — Drag-and-drop ordering
Goal: owner controls display order.

- dnd-kit: reorder sections (tabs), categories (within a section), and products
  (within a category).
- Persist new sort_order in one batch update per reorder.
Done when: reordered items keep their order after reload and on the public menu.

## Phase 6 — Settings panel
Goal: brand the menu without code.

- Edit settings row: pub_name, logo, hero image, currency, accent_color.
- Accent color drives the public theme (CSS variable from settings).
Done when: changing pub_name/accent in admin updates the public menu.

## Phase 7 — Deploy + QR
Goal: live and scannable.

- Host: Cloudflare Pages (own account, free, commercial use allowed). Connect the
  GitHub repo; build command `npm run build`, output dir `out`; set the two
  NEXT_PUBLIC env vars. Auto-deploys on push.
- URL: use the free `*.pages.dev` URL to ship immediately — the QR encodes the
  URL, so a pages.dev domain is fine for guests. No custom domain needed to launch.
- Custom domain (optional, later): `meni.okto.rs` via a CNAME in the okto.rs DNS
  zone pointing to the pages.dev target. Requires DNS access (NOT server access).
  Only a subdomain is possible via CNAME; a subpath (okto.rs/meni) is not, since
  that would need the main site's server to proxy. Regenerate the QR if/when the
  custom domain goes live.
- Generate a QR code pointing to the live URL; hand off print-ready PNG/SVG.
Done when: scanning the QR on a real phone opens the live menu.

---

## Notes / decisions
- Host: Cloudflare Pages (free, commercial use allowed). Chosen because the
  client has no server access. Ship on the free `*.pages.dev` URL; a custom
  subdomain (meni.okto.rs) is optional and only needs a CNAME in the okto.rs DNS
  zone (DNS access, not server access). Avoid Vercel: its free Hobby plan forbids
  commercial use, and a pub menu is commercial.
- Static export means the build is just files behind the QR; the domain is
  cosmetic. Do not block launch on domain/DNS politics.
- Supabase is the only external service (DB/Auth/Storage), free tier, no
  commercial-use restriction at this scale.
- Supabase free projects pause after ~1 week of zero activity. A pub used daily
  will not pause; if it ever does, the owner just reopens it. Note for handoff.
- Keep it boring: no realtime, no SSR, no extra services until something
  actually needs them.
