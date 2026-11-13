-- Site settings: only admins may read the full row (it holds the contact email).
drop policy if exists "Anyone can view site settings" on public.site_settings;
revoke select on public.site_settings from anon;

create policy "Admins can view site settings"
on public.site_settings for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Visitors get only the non-sensitive public fields.
create or replace function public.get_public_site_settings()
returns table (discord_url text, active_members integer)
language sql
stable
security definer
set search_path = public
as $$
  select s.discord_url, s.active_members from public.site_settings s where s.id = 1
$$;
revoke all on function public.get_public_site_settings() from public;
grant execute on function public.get_public_site_settings() to anon, authenticated, service_role;

-- Project images: no open read rule; visitors use server-issued signed links.
drop policy if exists "Anyone can view project images" on storage.objects;

create policy "Admins can view project images"
on storage.objects for select to authenticated
using (bucket_id = 'project-images' and public.has_role(auth.uid(), 'admin'));