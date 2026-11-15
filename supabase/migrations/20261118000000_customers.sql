-- Clientes do site: base para contato e remarketing (com consentimento) e conta simples.
-- Dois tipos de linha: conta (user_id preenchido, login por e-mail) e convidado (só o checkout,
-- chave = WhatsApp). Só a equipe lê tudo; o cliente logado lê e edita apenas a própria linha.

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  name text not null,
  phone text,
  email text,
  cep text,
  street text,
  number text,
  complement text,
  district text,
  city text,
  state text,
  -- LGPD: consentimento por canal, nunca marcado por padrão.
  accepts_whatsapp boolean not null default false,
  accepts_email boolean not null default false,
  consent_at timestamptz,
  last_order_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index customers_guest_phone on public.customers (phone) where user_id is null;

alter table public.orders add column customer_id uuid references public.customers (id) on delete set null;

-- Data do consentimento e updated_at não dependem do cliente (não dá para forjar pelo navegador).
create function public.customers_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  if tg_op = 'INSERT' then
    if new.accepts_whatsapp or new.accepts_email then new.consent_at := now(); else new.consent_at := null; end if;
  elsif (new.accepts_whatsapp and not old.accepts_whatsapp) or (new.accepts_email and not old.accepts_email) then
    new.consent_at := now();
  else
    new.consent_at := old.consent_at;
  end if;
  return new;
end $$;

create trigger customers_touch before insert or update on public.customers
  for each row execute function public.customers_touch();

alter table public.customers enable row level security;

create policy customers_staff_all on public.customers for all
  using (public.is_staff()) with check (public.is_staff());
create policy customers_own_select on public.customers for select using (user_id = auth.uid());
create policy customers_own_insert on public.customers for insert with check (user_id = auth.uid());
create policy customers_own_update on public.customers for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- place_site_order passa a gravar o cliente junto do pedido (p_customer é opcional).
drop function public.place_site_order(text, text, text, text, text, text, jsonb);

create function public.place_site_order(
  p_ref text, p_name text, p_phone text, p_destination text, p_shipping text, p_note text, p_items jsonb,
  p_customer jsonb default null
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_item jsonb;
  v_cid uuid;
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_email text := nullif(lower(trim(coalesce(p_customer ->> 'email', ''))), '');
  v_wa boolean := coalesce((p_customer ->> 'accepts_whatsapp')::boolean, false);
  v_mail boolean := coalesce((p_customer ->> 'accepts_email')::boolean, false) and v_email is not null;
begin
  if length(trim(p_name)) < 3 or length(p_name) > 120 or length(p_ref) > 40 or length(p_destination) > 300
     or length(p_note) > 500 or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 60
     or length(coalesce(v_email, '')) > 120 then
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

  if p_customer is null or length(v_phone) not between 10 and 11 then return; end if;

  if auth.uid() is not null then
    -- Logado: atualiza a própria conta; o consentimento só sobe aqui (revogar é na página da conta).
    insert into public.customers (user_id, name, phone, email, cep, street, number, complement, district, city, state,
                                  accepts_whatsapp, accepts_email, last_order_at)
    values (auth.uid(), trim(p_name), v_phone, v_email,
            left(p_customer ->> 'cep', 8), left(p_customer ->> 'street', 120), left(p_customer ->> 'number', 20),
            left(p_customer ->> 'complement', 60), left(p_customer ->> 'district', 80),
            left(p_customer ->> 'city', 80), left(p_customer ->> 'state', 2), v_wa, v_mail, now())
    on conflict (user_id) do update set
      last_order_at = now(),
      accepts_whatsapp = public.customers.accepts_whatsapp or excluded.accepts_whatsapp,
      accepts_email = public.customers.accepts_email or excluded.accepts_email
    returning id into v_cid;
  else
    -- Convidado: um cadastro por WhatsApp; o último pedido atualiza nome e endereço.
    insert into public.customers (name, phone, email, cep, street, number, complement, district, city, state,
                                  accepts_whatsapp, accepts_email, last_order_at)
    values (trim(p_name), v_phone, v_email,
            left(p_customer ->> 'cep', 8), left(p_customer ->> 'street', 120), left(p_customer ->> 'number', 20),
            left(p_customer ->> 'complement', 60), left(p_customer ->> 'district', 80),
            left(p_customer ->> 'city', 80), left(p_customer ->> 'state', 2), v_wa, v_mail, now())
    on conflict (phone) where user_id is null do update set
      name = excluded.name,
      email = coalesce(excluded.email, public.customers.email),
      cep = coalesce(excluded.cep, public.customers.cep),
      street = coalesce(excluded.street, public.customers.street),
      number = coalesce(excluded.number, public.customers.number),
      complement = coalesce(excluded.complement, public.customers.complement),
      district = coalesce(excluded.district, public.customers.district),
      city = coalesce(excluded.city, public.customers.city),
      state = coalesce(excluded.state, public.customers.state),
      last_order_at = now(),
      accepts_whatsapp = public.customers.accepts_whatsapp or excluded.accepts_whatsapp,
      accepts_email = public.customers.accepts_email or excluded.accepts_email
    returning id into v_cid;
  end if;

  update public.orders set customer_id = v_cid where id = v_id;
end $$;

revoke execute on function public.place_site_order(text, text, text, text, text, text, jsonb, jsonb) from public;
grant execute on function public.place_site_order(text, text, text, text, text, text, jsonb, jsonb) to anon, authenticated;
