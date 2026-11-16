-- Itens de estoque gerenciados no painel: produtos criados pela equipe e arquivamento.
-- O catálogo do site continua no código; esta tabela só complementa o painel. Itens do catálogo
-- entram aqui apenas ao serem arquivados (a linha guarda o estado, não substitui o catálogo).

create table public.stock_items (
  variant_id text primary key,
  product text not null check (length(trim(product)) between 1 and 80),
  color text not null default '' check (length(color) <= 60),
  size text not null default '' check (length(size) <= 40),
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.stock_items enable row level security;
create policy stock_items_staff_all on public.stock_items for all
  using (public.is_staff()) with check (public.is_staff());
