-- Roles
create type public.app_role as enum ('admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users can read their own roles"
on public.user_roles for select to authenticated
using (user_id = auth.uid());

-- First account created becomes the administrator (public sign-up is disabled).
create or replace function public.assign_initial_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created_assign_admin
after insert on auth.users
for each row execute function public.assign_initial_admin();

-- Timestamps helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  short_description text not null,
  full_description text not null,
  image_url text not null,
  youtube_url text,
  github_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.projects to anon;
grant select, insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
alter table public.projects enable row level security;

create policy "Anyone can view projects"
on public.projects for select to anon, authenticated
using (true);

create policy "Admins can create projects"
on public.projects for insert to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update projects"
on public.projects for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete projects"
on public.projects for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create index projects_created_at_idx on public.projects (created_at desc);

-- Site settings (single row)
create table public.site_settings (
  id integer primary key default 1 check (id = 1),
  discord_url text not null default 'https://discord.gg/',
  updated_at timestamptz not null default now()
);
grant select on public.site_settings to anon;
grant select, update on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;

create policy "Anyone can view site settings"
on public.site_settings for select to anon, authenticated
using (true);

create policy "Admins can update site settings"
on public.site_settings for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

insert into public.site_settings (id, discord_url) values (1, 'https://discord.gg/');