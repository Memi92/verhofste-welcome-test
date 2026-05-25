-- Supabase schema for the reception kiosk employee directory.
-- Hardware, PIN, Teams, and 3CX integrations are intentionally out of scope
-- for this milestone.

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
  'Future table for employee access. Store only hashed PINs; never store raw codes.';

alter table public.employees enable row level security;
alter table public.event_logs enable row level security;
alter table public.access_codes enable row level security;

-- DEVELOPMENT ONLY: Temporary employee policies for local kiosk/admin testing.
-- TODO: Before production, replace anon insert/update with authenticated
-- admin-only policies. Public read access is also a temporary development
-- choice and must be reviewed before go-live.
drop policy if exists "development employees anon select" on public.employees;
create policy "development employees anon select"
  on public.employees
  for select
  to anon
  using (true);

drop policy if exists "development employees anon insert" on public.employees;
create policy "development employees anon insert"
  on public.employees
  for insert
  to anon
  with check (true);

drop policy if exists "development employees anon update" on public.employees;
create policy "development employees anon update"
  on public.employees
  for update
  to anon
  using (true)
  with check (true);

-- TODO: Add least-privilege RLS policies for event_logs and access_codes once
-- the authentication model is defined. In particular, do not expose
-- access_codes to anonymous clients.
