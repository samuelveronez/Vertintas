-- Credenciais do Melhor Envio (OAuth): sem policies, só a Edge Function (service role) lê.
create table public.melhor_envio_connection (
  id integer primary key default 1 check (id = 1),
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  connected_at timestamptz not null default now()
);

alter table public.melhor_envio_connection enable row level security;
