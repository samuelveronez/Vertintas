-- Gestão da equipe e dos clientes pelo painel. Tudo restrito a quem está em `staff`.
-- Sem hierarquia: toda a equipe tem os mesmos poderes (is_admin deixa de ser usado).

alter table public.staff add column added_at timestamptz not null default now();

-- O e-mail fica em auth.users, que o navegador não lê; por isso as funções são security definer.
create function public.staff_list() returns table (user_id uuid, name text, email text, added_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select s.user_id, s.name, u.email::text, s.added_at
  from public.staff s
  join auth.users u on u.id = s.user_id
  where public.is_staff()
  order by s.added_at
$$;

-- Promove quem já tem login (criado em Authentication → Users).
create function public.staff_add(p_email text, p_name text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  if not public.is_staff() then raise exception 'sem_permissao'; end if;
  if length(trim(p_name)) < 2 or length(p_name) > 80 then raise exception 'nome_invalido'; end if;
  select id into v_id from auth.users where lower(email) = lower(trim(p_email));
  if v_id is null then raise exception 'usuario_nao_encontrado'; end if;
  insert into public.staff (user_id, name) values (v_id, trim(p_name)) on conflict (user_id) do nothing;
end $$;

-- Não remove a si mesmo: quem chama é staff, então sempre sobra ao menos uma pessoa.
create function public.staff_remove(p_user_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_staff() then raise exception 'sem_permissao'; end if;
  if p_user_id = auth.uid() then raise exception 'nao_pode_remover_a_si_mesmo'; end if;
  delete from public.staff where user_id = p_user_id;
end $$;

-- Clientes com o resumo de compras (pedidos cancelados não contam).
create function public.customers_overview() returns table (
  id uuid, name text, phone text, email text, city text, state text,
  accepts_whatsapp boolean, accepts_email boolean, consent_at timestamptz,
  has_account boolean, created_at timestamptz,
  orders_count bigint, total_cents bigint, last_order_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  select c.id, c.name, c.phone, c.email, c.city, c.state,
         c.accepts_whatsapp, c.accepts_email, c.consent_at,
         c.user_id is not null, c.created_at,
         count(distinct o.id) filter (where o.status <> 'cancelled'),
         coalesce(sum(i.qty::bigint * i.unit_price_cents) filter (where o.status <> 'cancelled'), 0)::bigint,
         max(o.ordered_at)
  from public.customers c
  left join public.orders o on o.customer_id = c.id
  left join public.order_items i on i.order_id = o.id
  where public.is_staff()
  group by c.id
  order by max(o.ordered_at) desc nulls last, c.created_at desc
$$;

revoke execute on function public.staff_list() from public;
revoke execute on function public.staff_add(text, text) from public;
revoke execute on function public.staff_remove(uuid) from public;
revoke execute on function public.customers_overview() from public;
grant execute on function public.staff_list() to authenticated;
grant execute on function public.staff_add(text, text) to authenticated;
grant execute on function public.staff_remove(uuid) to authenticated;
grant execute on function public.customers_overview() to authenticated;
