# 0002. Painel de pedidos no Supabase, sem sair do GitHub Pages

Status: aceita

## Contexto

Pedidos chegam por Mercado Livre, site e WhatsApp. Quem opera é a família: o pai (66 anos)
fabrica e embala; a irmã atende e já cuida do Mercado Livre. Há pequeno estoque de frascos
prontos. O site é estático no GitHub Pages ([ADR 0001](0001-checkout-pix-estatico.md)).

## Decisão

- **Painel em `/painel`**, no mesmo projeto, também estático. Fala direto com o Supabase
  pelo navegador; a segurança está nas políticas RLS, não no front-end
  (`supabase/migrations`). Não foi preciso trocar de hospedagem.
- **Login por e-mail e senha** (Supabase Auth). Só entra quem está na tabela `staff`.
- **Dois modos, sem perfis**: _Simples_ (só fabricar e embalar, botões grandes, para o pai) e
  _Completo_ (pedidos, estoque, canais). O aparelho lembra o último modo.
- **Fluxo do pedido**: aguardando pagamento → a fabricar → a embalar → pronto p/ enviar →
  enviado → entregue. "Fabricar" soma o mesmo item de todos os canais e desconta o estoque
  (`mark_made`, com desfazer). Todas as ações têm Desfazer.
- **Estoque** por variante do catálogo; baixa ao fabricar/separar, ajuste manual na aba Estoque.
- **Site → painel**: o checkout chama `place_site_order` (função pública, só insere, idempotente
  pelo número do pedido) ao tocar no botão do WhatsApp. Se falhar, o pedido segue pelo WhatsApp.
  O Pix continua estático e **confirmado à mão** no painel.
- **WhatsApp**: lançamento manual de pedido.
- **Mercado Livre, fase 1 (somente leitura)**: Edge Function `ml` faz o OAuth, recebe o webhook
  `orders_v2` e importa o pedido. Etiqueta e envio continuam no Mercado Livre. Tokens ficam em
  tabela sem política de leitura (só a função acessa).

## Consequências

- Sem servidor próprio e sem custo fixo previsível além do plano do Supabase.
- `place_site_order` é público: qualquer um pode inserir pedido falso (aparece "aguardando
  pagamento" e nunca vira fabricação sem confirmação humana). Limites de tamanho na função;
  se virar problema, adicionar captcha ou limite por IP.
- Preço do pedido do site vem do navegador; a conferência é o valor do Pix no banco.
- Fase 2 (fora deste ADR): estoque único com o anúncio do Mercado Livre e Pix com confirmação
  automática por webhook de gateway (substitui a confirmação manual).
- O mapeamento item do ML → SKU usa `user_product_id`/`seller_sku`; precisa ser validado com um
  pedido real. Itens sem correspondência aparecem pelo título, sem baixar estoque.
