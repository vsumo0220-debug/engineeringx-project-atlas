<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Public reads (projects, site settings) go through GET server functions in `src/lib/projects.functions.ts` using a per-request publishable client, so pages SSR with real data.
- Admin writes go through server functions with `requireSupabaseAuth` plus an explicit `has_role(..., 'admin')` check; RLS enforces the same rule as a second layer.
- Admin access comes only from `public.user_roles`; the first auth user created is made admin by a DB trigger, and public sign-up is disabled in auth settings.
- Project cover images live in a private storage bucket; `projects.image_url` stores the storage path and reads return long-lived signed URLs built on `VITE_SUPABASE_URL` (public buckets are blocked by workspace policy).
- Images are uploaded from the browser only at submit time (admin-only storage RLS), and replaced/deleted images are removed server-side.
- The Discord invite link is a single editable row in `public.site_settings`, not a constant.
- Public pages wrap content in `SiteLayout`; the admin area under `/_authenticated/admin` has its own shell.
