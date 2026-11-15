-- Painel de pedidos: pedidos de todos os canais, estoque e equipe.
-- Acesso: somente quem está em `staff` (RLS). O site público só insere pedido via place_site_order().

create table public.staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  is_admin boolean not null default false
);

create function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff where user_id = auth.uid())
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff where user_id = auth.uid() and is_admin)
$$;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('ml', 'site', 'wa')),
  -- Número do pedido no canal de origem (ML, #1042, WA-31); evita duplicar na reimportação.
  external_ref text not null,
  customer_name text not null,
  customer_phone text,
  destination text not null default '',
  shipping text not null default '',
  status text not null default 'pending_payment' check (
    status in ('pending_payment', 'to_make', 'to_pack', 'ready_to_ship', 'shipped', 'delivered', 'cancelled')
  ),
  paid_at timestamptz,
  tracking text,
  note text not null default '',
  ordered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (channel, external_ref)
);
create index orders_status_idx on public.orders (status, ordered_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  -- SKU do catálogo do site; nulo quando o item do Mercado Livre ainda não foi associado.
  variant_id text,
  name text not null,
  qty integer not null check (qty > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  made boolean not null default false
);
create index order_items_order_idx on public.order_items (order_id);

create table public.stock (
  variant_id text primary key,
  qty integer not null default 0 check (qty >= 0)
);

-- Credenciais do Mercado Livre: sem policies, só a Edge Function (service role) lê.
create table public.ml_connection (
  id integer primary key default 1 check (id = 1),
  ml_user_id bigint,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  oauth_state text,
  connected_at timestamptz,
  last_sync_at timestamptz
);

alter table public.staff enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.stock enable row level security;
alter table public.ml_connection enable row level security;

create policy staff_read_self on public.staff for select using (user_id = auth.uid() or public.is_admin());
create policy orders_staff_all on public.orders for all using (public.is_staff()) with check (public.is_staff());
create policy items_staff_all on public.order_items for all using (public.is_staff()) with check (public.is_staff());
create policy stock_staff_all on public.stock for all using (public.is_staff()) with check (public.is_staff());

-- Estado da conexão com o ML, sem expor tokens.
create function public.ml_status() returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when public.is_staff() then
    coalesce((select jsonb_build_object('connected', access_token is not null,
      'connected_at', connected_at, 'last_sync_at', last_sync_at)
      from public.ml_connection), jsonb_build_object('connected', false))
  end
$$;

-- Fabricar/separar um item em todos os pedidos pagos de uma vez; baixa o estoque disponível.
-- Retorna o necessário para desfazer.
create function public.mark_made(p_variant text) returns jsonb
language plpgsql set search_path = '' as $$
declare
  v_ids uuid[];
  v_need integer;
  v_used integer;
begin
  select coalesce(array_agg(i.id), '{}'), coalesce(sum(i.qty), 0) into v_ids, v_need
  from public.order_items i
  join public.orders o on o.id = i.order_id
  where o.status = 'to_make' and not i.made and coalesce(i.variant_id, i.name) = p_variant;

  if v_need = 0 then
    return jsonb_build_object('item_ids', '[]'::jsonb, 'stock_used', 0);
  end if;

  update public.order_items set made = true where id = any (v_ids);

  select least(qty, v_need) into v_used from public.stock where variant_id = p_variant;
  v_used := coalesce(v_used, 0);
  if v_used > 0 then
    update public.stock set qty = qty - v_used where variant_id = p_variant;
  end if;

  update public.orders o set status = 'to_pack'
  where o.status = 'to_make'
    and not exists (select 1 from public.order_items i where i.order_id = o.id and not i.made);

  return jsonb_build_object('item_ids', to_jsonb(v_ids), 'stock_used', v_used);
end $$;

create function public.undo_made(p_variant text, p_item_ids uuid[], p_stock_used integer) returns void
language plpgsql set search_path = '' as $$
begin
  update public.order_items set made = false where id = any (p_item_ids);
  update public.orders set status = 'to_make'
  where status = 'to_pack' and id in (select order_id from public.order_items where id = any (p_item_ids));
  if p_stock_used > 0 then
    perform public.adjust_stock(p_variant, p_stock_used);
  end if;
end $$;

create function public.adjust_stock(p_variant text, p_delta integer) returns void
language sql set search_path = '' as $$
  insert into public.stock (variant_id, qty) values (p_variant, greatest(0, p_delta))
  on conflict (variant_id) do update set qty = greatest(0, public.stock.qty + p_delta)
$$;

-- Pedido vindo do checkout público do site (anônimo). Entra aguardando pagamento;
-- a equipe confere o Pix no banco antes de liberar a fabricação.
create function public.place_site_order(
  p_ref text, p_name text, p_phone text, p_destination text, p_shipping text, p_note text, p_items jsonb
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_item jsonb;
begin
  if length(trim(p_name)) < 3 or length(p_name) > 120 or length(p_ref) > 40 or length(p_destination) > 300
     or length(p_note) > 500 or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 60 then
    raise exception 'pedido inválido';
  end if;

  insert into public.orders (channel, external_ref, customer_name, customer_phone, destination, shipping, note)
  values ('site', p_ref, trim(p_name), left(p_phone, 20), p_destination, p_shipping, p_note)
  on conflict (channel, external_ref) do nothing
  returning id into v_id;
  if v_id is null then return; end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into public.order_items (order_id, variant_id, name, qty, unit_price_cents)
    values (v_id, left(v_item ->> 'variant_id', 80), left(v_item ->> 'name', 200),
            least((v_item ->> 'qty')::integer, 500), (v_item ->> 'unit_price_cents')::integer);
  end loop;
end $$;

revoke execute on function public.place_site_order(text, text, text, text, text, text, jsonb) from public;
grant execute on function public.place_site_order(text, text, text, text, text, text, jsonb) to anon, authenticated;
