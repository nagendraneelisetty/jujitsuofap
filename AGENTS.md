<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Public pages read data client-side via react-query options in src/lib/queries.ts using the browser Supabase client; RLS enforces read-only for visitors.
- /admin is a client-only layout (ssr: false) that renders the login form instead of <Outlet /> until the user has the admin role in user_roles.
- Single-admin access is pinned to the designated existing auth user ID in the database role helper, with one admin role allowed; the auth creation trigger rejects additional accounts so public signup cannot grant access.
- Media bucket is private (workspace blocks public buckets); uploads store a 10-year signed URL in the row.
- The public SiteLayout wraps every route except /admin/* in __root.tsx.
