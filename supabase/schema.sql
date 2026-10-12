-- ============================================================================
--  Kitan Essentials — Supabase schema
--  Paste this whole file into Supabase → SQL Editor → "New query" → Run.
--  It is safe to run more than once.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- admins ----
-- Only users listed here can use the admin panel.
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins for select using (user_id = auth.uid());

-- -------------------------------------------------------------- settings ----
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.settings enable row level security;

drop policy if exists "settings public read" on public.settings;
create policy "settings public read" on public.settings for select using (true);
drop policy if exists "settings admin write" on public.settings;
create policy "settings admin write" on public.settings for all using (public.is_admin()) with check (public.is_admin());

insert into public.settings (id, data) values (1, jsonb_build_object(
  'storeName', 'Kitan Essentials',
  'handle', 'kitan_essentials0',
  'tagline', 'Clothing & sunglasses — classic and affordable. Wholesale & retail.',
  'email', 'musaolaitan5@gmail.com',
  'phone', '+234 903 450 6977', 'whatsapp', '+234 903 450 6977', 'instagram', 'kitan_essentials0',
  'location', 'Lagos & Ibadan, Nigeria',
  'announcement', 'Doorstep delivery in Lagos & Ibadan · Nationwide shipping on every order',
  'ibadanFee', 2000, 'lagosFee', 2500, 'nationwideFee', 5000, 'freeDeliveryOver', 0,
  'bankName', '', 'accountName', '', 'accountNumber', '',
  'heroImages', '[]'::jsonb, 'lookbook', '[]'::jsonb, 'lookbookTitle', 'The new collection'
)) on conflict (id) do nothing;

-- -------------------------------------------------------------- products ----
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null check (char_length(name) between 1 and 80),
  category text not null default 'Classic',
  cut text not null default 'cuffed',
  description text not null default '',
  price int not null default 0 check (price >= 0),
  wholesale_price int not null default 0 check (wholesale_price >= 0),
  wholesale_min int not null default 6 check (wholesale_min >= 1),
  stock int not null default 0 check (stock >= 0),
  featured boolean not null default false,
  active boolean not null default true,
  colors jsonb not null default '[{"name":"Jet Black","hex":"#1b1a1c"}]'::jsonb,
  sizes jsonb not null default '["S","M","L","XL","XXL"]'::jsonb,
  images jsonb not null default '[]'::jsonb,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
alter table public.products drop constraint if exists products_cut_check;
alter table public.products add constraint products_cut_check
  check (cut in ('cuffed', 'open', 'wide', 'cargo', 'slim', 'shorts', 'tee', 'shades'));

drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products for select using (active or public.is_admin());
drop policy if exists "products admin write" on public.products;
create policy "products admin write" on public.products for all using (public.is_admin()) with check (public.is_admin());

-- Starter catalogue (only inserted when the table is empty). Prices are placeholders.
insert into public.products (slug, name, category, cut, description, price, wholesale_price, wholesale_min, stock, featured, colors, sizes, sort)
select * from (values
  ('signature-jogger', 'The Signature Jogger', 'Classic', 'cuffed',
   'Our everyday hero. Heavy-knit 100% cotton, ribbed ankle cuffs, deep side pockets and an adjustable drawcord waist. Soft on day one, softer every wash.',
   12500, 9500, 6, 120, true,
   '[{"name":"Jet Black","hex":"#1b1a1c"},{"name":"Charcoal","hex":"#3d3e42"},{"name":"Ash Grey","hex":"#a7a7a3"},{"name":"Midnight Navy","hex":"#1f2a44"}]'::jsonb,
   '["S","M","L","XL","XXL"]'::jsonb, 1),
  ('open-hem-lounger', 'The Open-Hem Lounger', 'Lounge', 'open',
   'A relaxed straight-leg silhouette with a clean open hem. Brushed-back cotton for that lived-in feel — made for slow Sundays and long journeys.',
   13000, 10000, 6, 80, true,
   '[{"name":"Oat Cream","hex":"#e7dcc8"},{"name":"Jet Black","hex":"#1b1a1c"},{"name":"Mocha","hex":"#6b4f3f"}]'::jsonb,
   '["S","M","L","XL","XXL"]'::jsonb, 2),
  ('cargo-utility', 'The Cargo Utility', 'Utility', 'cargo',
   'Street-ready cargo joggers with flap thigh pockets, a tapered leg and cuffed ankles. Thick cotton that keeps its shape.',
   15500, 12000, 6, 64, true,
   '[{"name":"Olive","hex":"#565a3c"},{"name":"Sand","hex":"#c8b48f"},{"name":"Jet Black","hex":"#1b1a1c"}]'::jsonb,
   '["S","M","L","XL","XXL"]'::jsonb, 3),
  ('essential-slim', 'The Essential Slim', 'Classic', 'slim',
   'A sharper, slimmer taper that dresses up as easily as it dresses down. Lightweight cotton jersey with a snug cuff.',
   12000, 9000, 6, 96, false,
   '[{"name":"Midnight Navy","hex":"#1f2a44"},{"name":"Wine","hex":"#5a2230"},{"name":"Jet Black","hex":"#1b1a1c"}]'::jsonb,
   '["S","M","L","XL","XXL"]'::jsonb, 4),
  ('heavyweight-fleece', 'The Heavyweight Fleece', 'Lounge', 'cuffed',
   'Our warmest pair. Dense 100% cotton fleece with a cloud-soft brushed interior — harmattan mornings never felt this good.',
   16500, 13000, 6, 48, false,
   '[{"name":"Charcoal","hex":"#3d3e42"},{"name":"Forest","hex":"#27392f"},{"name":"Jet Black","hex":"#1b1a1c"}]'::jsonb,
   '["S","M","L","XL","XXL"]'::jsonb, 5),
  ('wide-leg-trouser', 'The Wide-Leg Trouser', 'Pants & Shorts', 'wide',
   'Flowing wide-leg cotton trousers with a soft drawcord waist — effortless, breezy and made to be styled up or down.',
   14000, 11000, 6, 70, true,
   '[{"name":"Cloud White","hex":"#efece6"},{"name":"Jet Black","hex":"#1b1a1c"},{"name":"Sand","hex":"#d9c7a3"}]'::jsonb,
   '["S","M","L","XL","XXL"]'::jsonb, 6),
  ('lounge-short', 'The Lounge Short', 'Pants & Shorts', 'shorts',
   'Easy cotton shorts with a drawcord waist and deep pockets. Your hot-afternoon essential.',
   8000, 6000, 6, 90, false,
   '[{"name":"Oat Cream","hex":"#e7dcc8"},{"name":"Olive","hex":"#565a3c"},{"name":"Jet Black","hex":"#1b1a1c"}]'::jsonb,
   '["S","M","L","XL","XXL"]'::jsonb, 7),
  ('everyday-tee', 'The Everyday Tee', 'Tops', 'tee',
   'A clean, breathable cotton tee with a ribbed collar — the perfect partner for every pair of joggers.',
   7000, 5000, 6, 110, false,
   '[{"name":"Midnight Navy","hex":"#1f2a44"},{"name":"Cloud White","hex":"#efece6"},{"name":"Jet Black","hex":"#1b1a1c"}]'::jsonb,
   '["S","M","L","XL","XXL"]'::jsonb, 8),
  ('classic-shades', 'The Classic Shades', 'Sunglasses', 'shades',
   'Bold, classic and affordable sunglasses with dark lenses — the finishing touch to any Kitan fit.',
   6000, 4000, 6, 60, false,
   '[{"name":"Gloss Black","hex":"#1b1a1c"},{"name":"Tortoise Brown","hex":"#6b4f3f"}]'::jsonb,
   '["One size"]'::jsonb, 9)
) as v(slug, name, category, cut, description, price, wholesale_price, wholesale_min, stock, featured, colors, sizes, sort)
where not exists (select 1 from public.products);

-- ---------------------------------------------------------------- orders ----
create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  customer jsonb not null,
  delivery text not null,
  items jsonb not null,
  subtotal int not null,
  delivery_fee int not null,
  total int not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled')),
  note text not null default '',
  admin_notes text not null default '',
  stock_applied boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.orders enable row level security;
alter table public.orders drop constraint if exists orders_delivery_check;
alter table public.orders add constraint orders_delivery_check check (delivery in ('ibadan', 'lagos', 'nationwide'));

-- Customers never read or write this table directly: they go through place_order().
drop policy if exists "orders admin all" on public.orders;
create policy "orders admin all" on public.orders for all using (public.is_admin()) with check (public.is_admin());

create index if not exists orders_created_idx on public.orders (created_at desc);

-- Checkout. Prices, wholesale tiers, delivery fee and stock are all
-- recomputed here from the database — the browser’s numbers are ignored.
create or replace function public.place_order(payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  c jsonb := coalesce(payload -> 'customer', '{}'::jsonb);
  v_name text := left(trim(coalesce(c ->> 'name', '')), 80);
  v_phone text := left(trim(coalesce(c ->> 'phone', '')), 20);
  v_email text := left(trim(coalesce(c ->> 'email', '')), 120);
  v_address text := left(trim(coalesce(c ->> 'address', '')), 240);
  v_city text := left(trim(coalesce(c ->> 'city', '')), 60);
  v_state text := left(trim(coalesce(c ->> 'state', '')), 40);
  v_delivery text := case when payload ->> 'delivery' in ('ibadan', 'lagos') then payload ->> 'delivery' else 'nationwide' end;
  s jsonb;
  raw jsonb;
  p public.products;
  v_qty int;
  v_color jsonb;
  v_size text;
  lines jsonb := '[]'::jsonb;
  totals jsonb := '{}'::jsonb;
  line jsonb;
  out_items jsonb := '[]'::jsonb;
  v_unit int;
  v_wh boolean;
  v_sub int := 0;
  v_fee int;
  v_number text;
  k text;
begin
  if char_length(v_name) < 2 then raise exception 'Please enter your full name.'; end if;
  if v_phone !~ '^\+?[0-9 -]{10,16}$' then raise exception 'Enter a valid phone number, e.g. 0803 123 4567.'; end if;
  if v_email <> '' and v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then raise exception 'That email doesn’t look right.'; end if;
  if char_length(v_address) < 5 then raise exception 'Please enter your delivery address.'; end if;
  if v_city = '' or v_state = '' then raise exception 'Please enter your city and state.'; end if;
  if jsonb_typeof(payload -> 'items') <> 'array' or jsonb_array_length(payload -> 'items') = 0 then
    raise exception 'Your bag is empty.';
  end if;
  if jsonb_array_length(payload -> 'items') > 40 then raise exception 'Too many items in one order.'; end if;

  for raw in select * from jsonb_array_elements(payload -> 'items') loop
    select * into p from public.products where id = (raw ->> 'productId')::uuid and active for update;
    if not found then raise exception 'One of the items in your bag is no longer available.'; end if;
    v_qty := greatest(1, least(500, coalesce((raw ->> 'qty')::int, 1)));
    v_color := null;
    select e into v_color from jsonb_array_elements(p.colors) e where e ->> 'name' = raw ->> 'color' limit 1;
    if v_color is null then v_color := p.colors -> 0; end if;
    v_size := case when p.sizes ? (raw ->> 'size') then raw ->> 'size' else p.sizes ->> 0 end;
    totals := jsonb_set(totals, array[p.id::text], to_jsonb(coalesce((totals ->> p.id::text)::int, 0) + v_qty));
    lines := lines || jsonb_build_object('productId', p.id, 'name', p.name, 'color', v_color ->> 'name',
      'colorHex', v_color ->> 'hex', 'size', v_size, 'qty', v_qty);
  end loop;

  for k in select jsonb_object_keys(totals) loop
    select * into p from public.products where id = k::uuid;
    if p.stock < (totals ->> k)::int then
      raise exception 'Sorry, only % of % left in stock. Reduce the quantity or message us for a restock date.', p.stock, p.name;
    end if;
  end loop;

  for line in select * from jsonb_array_elements(lines) loop
    select * into p from public.products where id = (line ->> 'productId')::uuid;
    v_wh := (totals ->> p.id::text)::int >= p.wholesale_min;
    v_unit := case when v_wh then p.wholesale_price else p.price end;
    v_sub := v_sub + v_unit * (line ->> 'qty')::int;
    out_items := out_items || (line || jsonb_build_object('unitPrice', v_unit, 'wholesale', v_wh,
      'lineTotal', v_unit * (line ->> 'qty')::int));
  end loop;

  select data into s from public.settings where id = 1;
  if coalesce((s ->> 'freeDeliveryOver')::int, 0) > 0 and v_sub >= (s ->> 'freeDeliveryOver')::int then
    v_fee := 0;
  elsif v_delivery = 'ibadan' then
    v_fee := coalesce((s ->> 'ibadanFee')::int, 0);
  elsif v_delivery = 'lagos' then
    v_fee := coalesce((s ->> 'lagosFee')::int, 0);
  else
    v_fee := coalesce((s ->> 'nationwideFee')::int, 0);
  end if;

  for k in select jsonb_object_keys(totals) loop
    update public.products set stock = stock - (totals ->> k)::int, updated_at = now() where id = k::uuid;
  end loop;

  v_number := 'KE-' || nextval('public.order_number_seq');
  insert into public.orders (number, customer, delivery, items, subtotal, delivery_fee, total, note, stock_applied)
  values (v_number,
    jsonb_build_object('name', v_name, 'phone', v_phone, 'email', v_email, 'address', v_address, 'city', v_city, 'state', v_state),
    v_delivery, out_items, v_sub, v_fee, v_sub + v_fee, left(coalesce(payload ->> 'note', ''), 500), true);

  return jsonb_build_object(
    'number', v_number, 'subtotal', v_sub, 'deliveryFee', v_fee, 'total', v_sub + v_fee,
    'payment', case when coalesce(s ->> 'accountNumber', '') <> '' then
      jsonb_build_object('bankName', s ->> 'bankName', 'accountName', s ->> 'accountName', 'accountNumber', s ->> 'accountNumber')
      else null end);
end;
$$;

-- Public order tracking: needs the order number AND the phone used at checkout.
create or replace function public.track_order(p_number text, p_phone text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
  digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
begin
  if char_length(digits) < 8 then return null; end if;
  select * into o from public.orders
   where number = upper(trim(p_number))
     and right(regexp_replace(customer ->> 'phone', '\D', '', 'g'), 8) = right(digits, 8);
  if not found then return null; end if;
  return jsonb_build_object('number', o.number, 'status', o.status, 'total', o.total,
    'delivery', o.delivery, 'createdAt', o.created_at, 'updatedAt', o.updated_at);
end;
$$;

-- Admin: change status and keep stock in sync (cancelling returns items to stock).
create or replace function public.set_order_status(p_id uuid, p_status text)
returns public.orders language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
  it jsonb;
  dir int := 0;
begin
  if not public.is_admin() then raise exception 'Not authorised'; end if;
  if p_status not in ('pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled') then
    raise exception 'Unknown status';
  end if;
  select * into o from public.orders where id = p_id for update;
  if not found then raise exception 'Order not found'; end if;
  if p_status = 'cancelled' and o.stock_applied then dir := 1; end if;
  if o.status = 'cancelled' and p_status <> 'cancelled' and not o.stock_applied then dir := -1; end if;
  if dir <> 0 then
    for it in select * from jsonb_array_elements(o.items) loop
      update public.products set stock = greatest(0, stock + dir * (it ->> 'qty')::int) where id = (it ->> 'productId')::uuid;
    end loop;
  end if;
  update public.orders set status = p_status, updated_at = now(),
    stock_applied = case when dir = 1 then false when dir = -1 then true else stock_applied end
  where id = p_id returning * into o;
  return o;
end;
$$;

-- ------------------------------------------------------------- inquiries ----
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'contact' check (type in ('contact', 'wholesale')),
  name text not null check (char_length(name) between 2 and 80),
  phone text not null default '' check (char_length(phone) <= 20),
  email text not null default '' check (char_length(email) <= 120),
  business text not null default '' check (char_length(business) <= 120),
  quantity int not null default 0 check (quantity between 0 and 1000000),
  message text not null default '' check (char_length(message) <= 1500),
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.inquiries enable row level security;

drop policy if exists "inquiries public insert" on public.inquiries;
create policy "inquiries public insert" on public.inquiries for insert
  with check (read = false and (phone <> '' or email <> ''));
drop policy if exists "inquiries admin all" on public.inquiries;
create policy "inquiries admin all" on public.inquiries for all using (public.is_admin()) with check (public.is_admin());

-- --------------------------------------------------------------- reviews ----
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  location text not null default '',
  text text not null check (char_length(text) between 1 and 500),
  rating int not null default 5 check (rating between 1 and 5),
  visible boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;

drop policy if exists "reviews public read" on public.reviews;
create policy "reviews public read" on public.reviews for select using (visible or public.is_admin());
drop policy if exists "reviews admin write" on public.reviews;
create policy "reviews admin write" on public.reviews for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------- grants ----
grant usage on schema public to anon, authenticated;
grant select on public.settings, public.products, public.reviews to anon, authenticated;
grant insert on public.inquiries to anon, authenticated;
grant all on public.settings, public.products, public.orders, public.inquiries, public.reviews to authenticated;
grant select on public.admins to authenticated;
grant usage on sequence public.order_number_seq to authenticated;
grant execute on function public.place_order(jsonb) to anon, authenticated;
grant execute on function public.track_order(text, text) to anon, authenticated;
grant execute on function public.set_order_status(uuid, text) to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- --------------------------------------------------------------- storage ----
-- Public bucket for product photos; only admins can upload or delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 6291456, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

drop policy if exists "product images public read" on storage.objects;
create policy "product images public read" on storage.objects for select using (bucket_id = 'product-images');
drop policy if exists "product images admin insert" on storage.objects;
create policy "product images admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "product images admin update" on storage.objects;
create policy "product images admin update" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "product images admin delete" on storage.objects;
create policy "product images admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

-- ----------------------------------------------------------- make admin -----
-- After creating her user in Authentication → Users, run this again (or just
-- this statement) to give that account admin access:
insert into public.admins (user_id)
select id from auth.users where lower(email) = 'musaolaitan5@gmail.com'
on conflict do nothing;
