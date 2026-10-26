-- Esquema de Supabase para "Alquiler en Regla".
-- Ejecútalo en el SQL Editor de tu proyecto Supabase.
-- Todas las tablas con datos personales tienen RLS: cada propietario solo ve lo suyo.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

-- Crea el perfil automáticamente al registrarse.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Ficha de propiedad + contrato (una fila por piso alquilado).
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  address text,
  tenant_name text,
  tenant_email text,
  tenant_phone text,
  rent numeric(10, 2) not null check (rent >= 0),
  signed_date date not null,
  start_date date not null,
  duration_years int not null default 1 check (duration_years between 1 and 30),
  update_clause boolean not null default true,
  update_index text not null default 'IPC' check (update_index in ('IPC', 'IRAV', 'OTRO', 'NINGUNO')),
  update_clause_text text,
  landlord_is_company boolean not null default false,
  payment_day int not null default 5 check (payment_day between 1 and 28),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists properties_owner_idx on public.properties (owner_id);

-- Registro de cobros: una fila por mes cobrado.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  period date not null, -- primer día del mes al que corresponde
  amount numeric(10, 2) not null,
  paid_at date not null default current_date,
  created_at timestamptz not null default now(),
  unique (property_id, period)
);
create index if not exists payments_property_idx on public.payments (property_id);

-- Lista de espera de la landing (semana 1).
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  flats int,
  how_they_update text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.payments enable row level security;
alter table public.waitlist enable row level security;

drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles for select using (auth.uid() = id);
-- Sin política de UPDATE: el plan y el cliente de Stripe solo los cambia el webhook (service role).
-- Si el usuario pudiera editar stripe_customer_id, podría abrir el portal de Stripe de otra persona.
drop policy if exists "own profile update" on public.profiles;

drop policy if exists "own properties" on public.properties;
create policy "own properties" on public.properties for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "own payments" on public.payments;
create policy "own payments" on public.payments for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Cualquiera puede apuntarse a la lista de espera, nadie puede leerla desde el cliente.
drop policy if exists "join waitlist" on public.waitlist;
create policy "join waitlist" on public.waitlist for insert to anon, authenticated with check (true);

-- Historial de rentas: cada actualización aplicada queda registrada.
create table if not exists public.rent_changes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  effective_date date not null,
  old_rent numeric(10, 2) not null,
  new_rent numeric(10, 2) not null,
  pct numeric(6, 2) not null,
  created_at timestamptz not null default now()
);
create index if not exists rent_changes_property_idx on public.rent_changes (property_id);
alter table public.rent_changes enable row level security;
drop policy if exists "own rent changes" on public.rent_changes;
create policy "own rent changes" on public.rent_changes for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Uso de la lectura de contratos con IA (para el límite mensual). Sin DELETE: no se puede "resetear".
create table if not exists public.extractions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists extractions_owner_idx on public.extractions (owner_id, created_at);
alter table public.extractions enable row level security;
drop policy if exists "own extractions read" on public.extractions;
create policy "own extractions read" on public.extractions for select using (auth.uid() = owner_id);
drop policy if exists "own extractions insert" on public.extractions;
create policy "own extractions insert" on public.extractions for insert with check (auth.uid() = owner_id);

-- Variación anual de IPC e IRAV publicada por el INE (la rellena el cron /api/cron/indices).
create table if not exists public.index_values (
  index_name text not null check (index_name in ('IPC', 'IRAV')),
  period date not null, -- primer día del mes de referencia
  pct numeric(6, 2) not null,
  fetched_at timestamptz not null default now(),
  primary key (index_name, period)
);
alter table public.index_values enable row level security;
drop policy if exists "read indices" on public.index_values;
create policy "read indices" on public.index_values for select to authenticated using (true);
