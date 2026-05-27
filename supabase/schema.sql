-- Supabase schema for the reception kiosk employee directory.
-- Real hardware, Teams, and 3CX integrations are intentionally out of scope.

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department text not null,
  "function" text not null,
  phone_extension text not null,
  image_url text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz null
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'employees'
      and column_name = 'funtion'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'employees'
      and column_name = 'function'
  ) then
    alter table public.employees rename column funtion to "function";
  end if;
end $$;

alter table public.employees
  add column if not exists image_url text null;

alter table public.employees
  add column if not exists updated_at timestamptz null;

create index if not exists employees_is_active_idx
  on public.employees (is_active);

create index if not exists employees_name_idx
  on public.employees (name);

create index if not exists employees_function_idx
  on public.employees ("function");

create index if not exists employees_department_idx
  on public.employees (department);

create table if not exists public.employee_access_codes (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  pin_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists employee_access_codes_one_active_per_employee_idx
  on public.employee_access_codes (employee_id)
  where is_active;

create index if not exists employee_access_codes_employee_id_idx
  on public.employee_access_codes (employee_id);

create index if not exists employee_access_codes_is_active_idx
  on public.employee_access_codes (is_active);

comment on table public.employee_access_codes is
  'Stores hashed employee PIN codes only. Never store raw PIN codes.';

comment on column public.employee_access_codes.pin_hash is
  'Salted hash of the employee PIN. Raw PIN values must never be stored.';

create table if not exists public.event_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  employee_id uuid null references public.employees(id) on delete set null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists event_logs_employee_id_idx
  on public.event_logs (employee_id);

create index if not exists event_logs_created_at_idx
  on public.event_logs (created_at desc);

create index if not exists event_logs_event_type_idx
  on public.event_logs (event_type);

create or replace view public.event_logs_readable as
select
  event_logs.id,
  event_logs.created_at,
  event_logs.event_type,
  event_logs.message,
  event_logs.employee_id,
  employees.name as employee_name,
  employees.department as employee_department,
  employees."function" as employee_function,
  employees.phone_extension as employee_phone_extension
from public.event_logs
left join public.employees
  on employees.id = event_logs.employee_id;

grant select on public.event_logs_readable to authenticated;

create table if not exists public.access_codes (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  code_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists access_codes_is_active_idx
  on public.access_codes (is_active);

comment on table public.access_codes is
  'Reserved for future generic access codes. Employee-specific PINs use employee_access_codes. Store only hashes; never store raw codes.';

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'employee-photos',
  'employee-photos',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.employees enable row level security;
alter table public.employee_access_codes enable row level security;
alter table public.event_logs enable row level security;
alter table public.access_codes enable row level security;

-- DEVELOPMENT ONLY: Temporary employee policies for local kiosk/admin testing.
-- These policies intentionally allow both anonymous visitor reads and
-- authenticated admin writes during development.
-- Intended access model: /visitor remains public, /pin remains public, and
-- /admin is limited in the app to the single server-configured ADMIN_EMAIL.
-- TODO: Before production, restrict INSERT and UPDATE to authenticated admin
-- users only. For this project, that means the single configured admin user.
-- TODO: Public read access is a temporary development choice. Production
-- visitor reads should expose only active employees, preferably through a
-- least-privilege policy or view that does not leak inactive employee rows.
drop policy if exists "development employees anon select" on public.employees;
create policy "development employees anon select"
  on public.employees
  for select
  to anon, authenticated
  using (true);

drop policy if exists "development employees anon insert" on public.employees;
create policy "development employees anon insert"
  on public.employees
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "development employees anon update" on public.employees;
create policy "development employees anon update"
  on public.employees
  for update
  to anon, authenticated
  using (true)
  with check (true);

-- DEVELOPMENT ONLY: Temporary employee PIN policies for kiosk/admin testing.
-- PIN values are stored only as salted hashes in pin_hash.
-- TODO: Before production, restrict direct employee_access_codes access to
-- authenticated admin users only and move visitor PIN validation behind a
-- least-privilege server-side path/RPC. Never expose pin_hash values to
-- browsers.
-- TODO: The public kiosk PIN flow may validate submitted PINs server-side, but
-- public clients must never be able to read employee_access_codes directly.
drop policy if exists "development employee access codes authenticated select"
  on public.employee_access_codes;
create policy "development employee access codes authenticated select"
  on public.employee_access_codes
  for select
  to anon, authenticated
  using (true);

drop policy if exists "development employee access codes authenticated insert"
  on public.employee_access_codes;
create policy "development employee access codes authenticated insert"
  on public.employee_access_codes
  for insert
  to authenticated
  with check (true);

drop policy if exists "development employee access codes authenticated update"
  on public.employee_access_codes;
create policy "development employee access codes authenticated update"
  on public.employee_access_codes
  for update
  to authenticated
  using (true)
  with check (true);

-- DEVELOPMENT ONLY: Temporary event logging policy for kiosk/admin testing.
-- TODO: Before production, public/kiosk flows may insert event logs but must
-- not read all logs.
-- TODO: Before production, restrict event log reads to the single authenticated
-- admin user only.
-- TODO: Add admin event log review, rate limiting, and lockout handling for
-- repeated failed PIN attempts.
drop policy if exists "development event logs anon insert"
  on public.event_logs;
create policy "development event logs anon insert"
  on public.event_logs
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "development event logs authenticated select"
  on public.event_logs;
create policy "development event logs authenticated select"
  on public.event_logs
  for select
  to authenticated
  using (true);

-- DEVELOPMENT ONLY: Temporary Storage policies for employee photo uploads.
-- The employee-photos bucket is public so visitor cards can render public URLs.
-- TODO: Before production, restrict uploads to the single authenticated admin
-- user only.
-- TODO: Review whether public photo reads are acceptable for production.
drop policy if exists "development employee photos public read"
  on storage.objects;
create policy "development employee photos public read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'employee-photos');

drop policy if exists "development employee photos authenticated upload"
  on storage.objects;
create policy "development employee photos authenticated upload"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'employee-photos');

-- TODO: Add least-privilege RLS policies for access_codes before using it.
-- access_codes is reserved for future generic access codes and must not be
-- exposed to anonymous clients.
