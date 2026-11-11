-- Projects: richer metadata and an ordered image gallery (first image = main image)
alter table public.projects
  add column category text,
  add column status text not null default 'completed',
  add column team text,
  add column technologies text[] not null default '{}',
  add column demo_url text,
  add column images text[] not null default '{}';

update public.projects set images = array[image_url] where cardinality(images) = 0;

alter table public.projects
  add constraint projects_status_check check (status in ('completed', 'in_progress', 'planning'));

comment on column public.projects.image_url is 'Main image path; kept equal to images[1]';

-- Site settings: impact + contact placeholders
alter table public.site_settings
  add column active_members integer check (active_members is null or active_members >= 0),
  add column contact_email text;

-- News posts
create table public.news_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  body text not null default '',
  category text not null default 'club',
  image_path text,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint news_category_check check (category in ('milestone','prototype','competition','recruitment','partnership','club','event'))
);
grant select on public.news_posts to anon;
grant select, insert, update, delete on public.news_posts to authenticated;
grant all on public.news_posts to service_role;
alter table public.news_posts enable row level security;
create policy "Anyone can view news" on public.news_posts for select to anon, authenticated using (true);
create policy "Admins can create news" on public.news_posts for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins can update news" on public.news_posts for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins can delete news" on public.news_posts for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
create trigger news_posts_set_updated_at before update on public.news_posts for each row execute function public.set_updated_at();
create index news_posts_published_at_idx on public.news_posts (published_at desc);

-- Partners & sponsors
create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'partner',
  description text,
  website_url text,
  logo_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partners_kind_check check (kind in ('partner','sponsor'))
);
grant select on public.partners to anon;
grant select, insert, update, delete on public.partners to authenticated;
grant all on public.partners to service_role;
alter table public.partners enable row level security;
create policy "Anyone can view partners" on public.partners for select to anon, authenticated using (true);
create policy "Admins can create partners" on public.partners for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins can update partners" on public.partners for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins can delete partners" on public.partners for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
create trigger partners_set_updated_at before update on public.partners for each row execute function public.set_updated_at();

-- Contact inquiries (visitors can only insert)
create table public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  organization text,
  category text not null,
  message text not null,
  handled boolean not null default false,
  created_at timestamptz not null default now(),
  constraint contact_category_check check (category in ('general','sponsorship','partnership','collaboration','membership')),
  constraint contact_lengths check (char_length(full_name) <= 120 and char_length(email) <= 255 and char_length(coalesce(organization,'')) <= 160 and char_length(message) <= 5000)
);
grant insert on public.contact_inquiries to anon;
grant select, insert, update, delete on public.contact_inquiries to authenticated;
grant all on public.contact_inquiries to service_role;
alter table public.contact_inquiries enable row level security;
create policy "Anyone can send an inquiry" on public.contact_inquiries for insert to anon, authenticated with check (handled = false);
create policy "Admins can view inquiries" on public.contact_inquiries for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can update inquiries" on public.contact_inquiries for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins can delete inquiries" on public.contact_inquiries for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
create index contact_inquiries_created_at_idx on public.contact_inquiries (created_at desc);

-- Membership applications (visitors can only insert)
create table public.membership_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  age_or_year text not null,
  interests text[] not null default '{}',
  skills text,
  motivation text not null,
  previous_projects text,
  handled boolean not null default false,
  created_at timestamptz not null default now(),
  constraint membership_lengths check (char_length(full_name) <= 120 and char_length(email) <= 255 and char_length(age_or_year) <= 60 and char_length(coalesce(skills,'')) <= 2000 and char_length(motivation) <= 4000 and char_length(coalesce(previous_projects,'')) <= 4000 and cardinality(interests) <= 20)
);
grant insert on public.membership_applications to anon;
grant select, insert, update, delete on public.membership_applications to authenticated;
grant all on public.membership_applications to service_role;
alter table public.membership_applications enable row level security;
create policy "Anyone can apply" on public.membership_applications for insert to anon, authenticated with check (handled = false);
create policy "Admins can view applications" on public.membership_applications for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can update applications" on public.membership_applications for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins can delete applications" on public.membership_applications for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
create index membership_applications_created_at_idx on public.membership_applications (created_at desc);