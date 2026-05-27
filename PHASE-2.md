# Phase 2 — Admin auth (owner login)

Prereq (do in the Supabase dashboard first):
- Auth -> Users -> Add user: create the owner account (client email + a
  password). Confirm the user; no email verification flow needed for one owner.
- Auth -> Providers -> Email: turn OFF "Allow new users to sign up" so nobody
  can self-register.

Context: this is a static export, no server. Auth is fully client-side. The
Supabase JS client persists the session in the browser automatically. The admin
guard below is UX only — real protection is RLS (writes already require an
authenticated session from Phase 0). Do not add server middleware or server
actions; keep everything client-side so `output: 'export'` still builds.

## Auth layer
- src/hooks/useAuth.ts ('use client'): thin wrapper over supabase.auth.
  - exposes { user, session, loading, signIn(email, password), signOut() }
  - initializes from supabase.auth.getSession()
  - subscribes to supabase.auth.onAuthStateChange, updates state, cleans up on unmount

## Login page (src/app/admin/login/page.tsx, 'use client')
- Email + password inputs and a submit button. Do NOT use a server <form> post;
  use an onClick handler that calls signIn().
- On invalid credentials, show an inline error and stay on the page.
- On success, router.replace('/admin').
- If already authenticated when the page loads, router.replace('/admin').
- Style matches the menu: dark (#121212), accent (#E8A33D) button, IBM Plex Sans.
  Keep it minimal and centered.

## Protected dashboard (src/app/admin/page.tsx, 'use client')
- On mount: if not loading and there is no session, router.replace('/admin/login').
- While loading: a small loading state.
- When authenticated, render an admin shell:
  - header: "OKTO Admin", the current user's email, and a Logout button
    (calls signOut(), then router.replace('/admin/login'))
  - body: placeholder text "Upravljanje menijem stize u sledecoj fazi."
- This shell is the mount point for Phase 3 CRUD.

## Out of scope (later phases)
- No menu editing yet (Phase 3).
- No password reset, no multi-user (single owner by design).

## Done when
- Visiting /admin with no session redirects to /admin/login.
- Wrong credentials show an error and stay on login.
- Correct credentials land on /admin showing the owner email + a Logout button.
- Logout returns to /admin/login and /admin is blocked again.
- The public menu at / is unchanged.
- `npm run build` still produces a clean static out/.

Stop after Phase 2 and summarize for review. Do not start Phase 3.
