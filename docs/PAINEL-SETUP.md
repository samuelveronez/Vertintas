# Painel de pedidos: colocar no ar

Decisões em [ADR 0002](decisions/0002-painel-de-pedidos-supabase.md). Protótipo visual em
[`prototype/painel.html`](prototype/painel.html).

> **Pix da loja:** a chave, o nome e a cidade ficam em Canais de venda → Pix da loja (tabela
> `public_settings`, chave `pix`). Valem mais que `PIX_KEY` das variáveis de build, que vira só
> o padrão.

## 1. Banco (Supabase)

1. Criar um projeto em supabase.com (região São Paulo).
2. Aplicar, nesta ordem, `supabase/migrations/20261115000000_orders_panel.sql` e
   `20261116000000_public_settings.sql` e, depois, `20261118000000_customers.sql` (SQL Editor ou
   `supabase db push`).
3. Em Authentication → Users, criar um usuário por pessoa (e-mail e senha). Depois, no SQL
   Editor, liberar cada um:

   ```sql
   insert into public.staff (user_id, name, is_admin)
   select id, 'Samuel', true from auth.users where email = 'EMAIL_AQUI';
   ```

   `is_admin = true` só para quem pode conectar o Mercado Livre.

4. Em Authentication → Providers, **manter** o cadastro público ligado: o login por e-mail dos
   clientes ([ADR 0004](decisions/0004-clientes-e-remarketing.md)) cria usuários. A equipe é só quem
   está em `staff`; os demais usuários não acessam o painel. Em Authentication → URL Configuration,
   adicionar a URL do site (`/conta/`) em _Redirect URLs_, e configurar SMTP próprio (Resend, Brevo…).

## 2. Site (GitHub Pages)

No repositório, Settings → Variables → Actions: `SUPABASE_URL` e `SUPABASE_ANON_KEY` (chave
_publishable/anon_; é pública, a proteção é a RLS). Localmente, copiar de `.env.example` para
`.env.local`.

## 3. Mercado Livre

1. Criar um app em developers.mercadolivre.com.br. URL de redirecionamento:
   `https://<projeto>.supabase.co/functions/v1/ml/callback`. Tópico de notificação:
   `orders_v2`, URL `https://<projeto>.supabase.co/functions/v1/ml/webhook`. Permissão de
   leitura.
2. Segredos da função:

   ```bash
   supabase secrets set ML_APP_ID=... ML_CLIENT_SECRET=... PANEL_URL=https://<site>/painel/canais/
   supabase functions deploy ml --no-verify-jwt
   ```

3. No painel (modo Completo → Canais de venda), um administrador toca em _Conectar Mercado
   Livre_.
4. Conferir com um pedido real: cliente, cidade, itens e se o SKU casou com o catálogo (ver
   ADR, consequências). A função não foi testada contra a API real.
