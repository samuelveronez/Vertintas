-- Ajustes que o site público precisa ler (ex.: retirada na fábrica ligada/desligada).
-- Leitura aberta; só a equipe altera. Não guardar nada sensível aqui.
create table public.public_settings (
  key text primary key,
  value jsonb not null
);

alter table public.public_settings enable row level security;

create policy settings_read_all on public.public_settings for select using (true);
create policy settings_staff_write on public.public_settings for all
  using (public.is_staff()) with check (public.is_staff());

insert into public.public_settings (key, value) values ('pickup_enabled', 'true');
