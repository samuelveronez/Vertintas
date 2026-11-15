# 0003. Frete e envio pelo Melhor Envio

Status: aceita (substitui a regra "frete combinado no WhatsApp" do ADR 0001)

## Contexto

A loja agora é cliente do Melhor Envio e quer que o cliente cote frete e prazo no carrinho.
O site é estático (GitHub Pages) e o token da conta não pode ir para o navegador.

## Decisão

- Uma Supabase Edge Function (`supabase/functions/shipping-quote`) recebe CEP + itens, chama
  `POST /api/v2/me/shipment/calculate` com o token (secret) e devolve só serviço, preço
  (`custom_price`, com as tarifas da conta) e prazo.
- O carrinho (`features/shipping`) cota por CEP, mostra as opções e guarda a escolha; ela só
  vale enquanto o carrinho for o mesmo (assinatura). O checkout soma o frete ao Pix e à
  mensagem do WhatsApp. Sem `NEXT_PUBLIC_SHIPPING_API_URL`, tudo volta ao fluxo anterior.
- Peso e caixa por frasco ficam em `features/shipping/packaging.ts` (estimativas).
- Retirada na fábrica continua sem frete.

## Fora desta decisão

Comprar a etiqueta e gerar a postagem continua **manual** no painel do Melhor Envio, após
confirmar o Pix. Automatizar exige pagamento confirmado por webhook (fase 3 do plano).

## Consequências

- Autenticação OAuth (o access token vale 30 dias e o refresh token, 45): a função
  `melhor-envio-auth` liga a conta uma vez (`/start?key=…` → `/callback`) e guarda os tokens em
  `melhor_envio_connection` (RLS sem policies). `shipping-quote` renova o token sozinho; se a conta
  não estiver ligada, responde 503 e o carrinho oferece combinar o frete pelo WhatsApp.
- Segredos só no Supabase: `ME_CLIENT_ID`, `ME_CLIENT_SECRET`, `ME_SETUP_KEY`, `ME_ENV`,
  `ME_FROM_CEP`, `ME_CONTACT_EMAIL`, `ALLOWED_ORIGIN`.
- O escopo pedido é só `shipping-calculate`; gerar etiqueta pela API exigirá reautorizar.
- A função é pública (`--no-verify-jwt`) e só faz cotação; limites de entrada evitam abuso.
- O valor cotado é informativo no navegador; a loja confere antes de postar.
