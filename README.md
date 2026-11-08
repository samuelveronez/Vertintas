# VerTintas

Site e loja de uma fabricante de tintas para artesanato (João Pessoa/PB): landing de vendas,
catálogo, carrinho e checkout por Pix. Contato por WhatsApp; o Mercado Livre aparece só como
link discreto.

Plano e decisões: [`docs/PLAN.md`](docs/PLAN.md) · Design: [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md)

## Como funciona (versão GitHub Pages)

Site 100% estático (Next.js `output: "export"`), sem backend. O carrinho fica no navegador.
No checkout o cliente preenche os dados, recebe um **Pix copia e cola/QR Code** gerado no
navegador com o valor do pedido e envia pedido + comprovante pelo WhatsApp. A confirmação do
pagamento é manual; ver [ADR 0001](docs/decisions/0001-checkout-pix-estatico.md).

## Rodar localmente

```bash
pnpm install
cp .env.example .env.local   # preencha NEXT_PUBLIC_PIX_KEY
pnpm dev
```

`pnpm lint && pnpm typecheck && pnpm test && pnpm build` antes de concluir uma tarefa.

## Publicar no GitHub Pages

1. No GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. **Settings → Secrets and variables → Actions → Variables** e crie:
   - `PIX_KEY`: chave Pix que recebe os pagamentos (obrigatória para o QR Code);
   - `PIX_NAME` (nome do recebedor, até 25 caracteres) e `PIX_CITY` (ex.: `JOAO PESSOA`);
   - `ML_STORE_URL`: página da loja no Mercado Livre (opcional);
   - `NEXT_PUBLIC_BASE_PATH`: opcional. Por padrão o site usa `/<repositório>`; ao migrar para
     domínio próprio, remova esse prefixo no `build` do workflow.
3. Faça merge na `main`: o workflow [`pages.yml`](.github/workflows/pages.yml) roda lint, tipos,
   testes, build e publica em `https://<usuário>.github.io/<repositório>/`.

## Frete (Melhor Envio)

Cotação no carrinho via Supabase Edge Function; ver [ADR 0002](docs/decisions/0002-frete-melhor-envio.md).

1. Na conta Supabase do cliente, crie o projeto e anote o *Project ID* (Settings → General).
2. Em **Account → Access Tokens**, gere um token. No GitHub (*Settings → Secrets and variables → Actions*):
   secret `SUPABASE_ACCESS_TOKEN` e variável `SUPABASE_PROJECT_ID`.
3. Em **Edge Functions → Secrets**, crie `ME_TOKEN`, `ME_ENV` (`sandbox` ou `production`), `ME_FROM_CEP`,
   `ME_CONTACT_EMAIL` e `ALLOWED_ORIGIN` (`https://<usuário>.github.io`).
4. Rode o workflow [`deploy-shipping.yml`](.github/workflows/deploy-shipping.yml) (Actions → Run workflow).
5. Crie a variável `SHIPPING_API_URL` = `https://<project-id>.supabase.co/functions/v1/shipping-quote`
   e republique o site.

## Dados do catálogo

`src/features/catalog/data.ts` foi gerado de [`docs/reference/catalog.json`](docs/reference/catalog.json).
Fotos em `public/produtos/` (material da marca; uso no site depende de autorização do dono).
