-- Execute no SQL Editor do Supabase. Nunca exponha service_role no navegador.
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null default '', role text not null default 'customer' check(role in ('customer','admin')),
 created_at timestamptz not null default now()
);
create table if not exists public.collections (
 id text primary key, name text not null, artist text, image text, description text
);
create table if not exists public.products (
 id text primary key, collection_id text references public.collections(id), name text not null,
 price numeric(12,2) not null check(price>=0), old_price numeric(12,2),
 stock integer not null default 0 check(stock>=0), description text, image text,
 capacity text, material text, dimensions text, care text, sold integer not null default 0,
 active boolean not null default true
);
create table if not exists public.orders (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
 status text not null default 'pending' check(status in ('pending','paid','cancelled','shipped')),
 subtotal numeric(12,2) not null, shipping numeric(12,2) not null default 0,
 total numeric(12,2) not null, address jsonb not null, payment_id text,
 created_at timestamptz not null default now()
);
create table if not exists public.order_items (
 id bigint generated always as identity primary key, order_id uuid not null references public.orders(id) on delete cascade,
 product_id text not null references public.products(id), quantity integer not null check(quantity>0),
 unit_price numeric(12,2) not null, name text not null
);
create table if not exists public.favorites (
 user_id uuid not null references auth.users(id) on delete cascade,
 product_id text not null references public.products(id) on delete cascade,
 primary key(user_id,product_id)
);
create or replace function public.create_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin insert into public.profiles(id,name) values(new.id,coalesce(new.raw_user_meta_data->>'name','')); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.create_profile();
alter table public.profiles enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.favorites enable row level security;
create policy "read collections" on public.collections for select using(true);
create policy "read active products" on public.products for select using(active = true);
create policy "own profile" on public.profiles for select to authenticated using(id=auth.uid());
create policy "own orders" on public.orders for select to authenticated using(user_id=auth.uid());
create policy "own order items" on public.order_items for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and o.user_id=auth.uid()));
create policy "own favorites read" on public.favorites for select to authenticated using(user_id=auth.uid());
create policy "own favorites insert" on public.favorites for insert to authenticated with check(user_id=auth.uid());
create policy "own favorites delete" on public.favorites for delete to authenticated using(user_id=auth.uid());
-- Admin updates are handled by the API with service_role, never from client-side SQL.
