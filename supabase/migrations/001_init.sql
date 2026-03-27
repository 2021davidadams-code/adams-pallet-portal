create extension if not exists pgcrypto;

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table public.asset_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  replacement_cost numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.transfers (
  id uuid primary key default gen_random_uuid(),
  transfer_number text not null unique,
  from_company_id uuid references public.companies(id) on delete restrict,
  to_name text not null,
  asset_type_id uuid references public.asset_types(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  location text,
  transfer_date date not null,
  status text not null default 'pending_review',
  created_at timestamptz not null default now()
);
