create type public.app_role as enum ('admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Public signup is disabled, so every account is created by the owner and becomes admin.
create or replace function public.handle_new_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_admin();

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- Events
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null default current_date,
  description text not null default '',
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Notices
create table public.notices (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Contact info (single row)
create table public.contact_info (
  id int primary key default 1 check (id = 1),
  address text not null default '',
  emails text[] not null default '{}',
  phones text[] not null default '{}',
  updated_at timestamptz not null default now()
);
-- About content (single row)
create table public.about_content (
  id int primary key default 1 check (id = 1),
  history text not null default '',
  mission text not null default '',
  updated_at timestamptz not null default now()
);
create table public.office_bearers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  designation text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  storage_path text,
  caption text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.districts (
  id uuid primary key default gen_random_uuid(),
  district_name text not null,
  coordinator_name text not null,
  phone text not null default '',
  email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 255),
  phone text check (phone is null or char_length(phone) <= 20),
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['events','notices','contact_info','about_content','office_bearers','gallery_images','districts'] loop
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "admin insert" on public.%I for insert to authenticated with check (public.has_role(auth.uid(), ''admin''))', t);
    execute format('create policy "admin update" on public.%I for update to authenticated using (public.has_role(auth.uid(), ''admin'')) with check (public.has_role(auth.uid(), ''admin''))', t);
    execute format('create policy "admin delete" on public.%I for delete to authenticated using (public.has_role(auth.uid(), ''admin''))', t);
    execute format('create trigger touch before update on public.%I for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

grant insert on public.enquiries to anon, authenticated;
grant select, delete on public.enquiries to authenticated;
grant all on public.enquiries to service_role;
alter table public.enquiries enable row level security;
create policy "anyone can submit" on public.enquiries for insert to anon, authenticated with check (true);
create policy "admin read" on public.enquiries for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "admin delete" on public.enquiries for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

alter publication supabase_realtime add table public.notices;

-- Storage policies for media bucket
create policy "media public read" on storage.objects for select using (bucket_id = 'media');
create policy "media admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));
create policy "media admin update" on storage.objects for update to authenticated using (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));
create policy "media admin delete" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));

-- Seed
insert into public.contact_info (id, address, emails, phones) values
 (1, 'Ju Jitsu Association of Andhra Pradesh, Vijayawada, Andhra Pradesh - 520001', array['info@jujitsuap.org'], array['+91 90000 00000']);
insert into public.about_content (id, history, mission) values
 (1, 'The Ju Jitsu Association of Andhra Pradesh was formed to promote and develop the martial art of Ju Jitsu across all districts of the state, conducting championships, coaching camps and referee seminars.',
  'To make Ju Jitsu accessible to every youth in Andhra Pradesh, build discipline and self-defence skills, and nurture athletes for national and international competition.');
insert into public.office_bearers (name, designation, sort_order) values
 ('To be updated', 'President', 1), ('To be updated', 'General Secretary', 2), ('To be updated', 'Treasurer', 3);
insert into public.notices (message) values ('Welcome to the official website of the Ju Jitsu Association of Andhra Pradesh.');
insert into public.events (title, event_date, description) values
 ('State Ju Jitsu Championship', current_date, 'Annual state-level championship for all age categories. Details will be updated by the association.');
insert into public.districts (district_name, coordinator_name, phone, email) values
 ('Krishna', 'To be updated', '', ''), ('Guntur', 'To be updated', '', ''), ('Visakhapatnam', 'To be updated', '', '');
