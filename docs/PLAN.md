# Plano — Site e E-commerce

Fabricante de **tintas para artesanato** de pequeno porte, vendendo apenas a própria
marca, em **pequenos volumes** (frascos de poucos mililitros a ~1 L).

## Decisões já tomadas

| Tema | Decisão |
| --- | --- |
| Stack | Next.js + TypeScript + Tailwind + Supabase |
| Pagamento | Pix e cartão de crédito (gateway a definir) |
| Entrega | Entrega regional (por CEP/faixa) + retirada na fábrica |
| Catálogo | Linha fechada, cores prontas, variações de cor × tamanho (frascos pequenos) |
| Público | Artesãos e consumidores finais; compra de várias cores por pedido e kits |
| Repositório | Público, tratado como case |

## Escopo

**Dentro (MVP):** páginas institucionais, catálogo, página de produto, carrinho,
checkout com Pix/cartão, frete regional e retirada, conta do cliente e histórico de
pedidos, painel administrativo enxuto, e-mails transacionais, SEO básico, LGPD.

**Implicações dos pequenos volumes:** pedidos têm muitos itens leves; o catálogo
precisa de grade de cores (swatches), filtro por cor/acabamento/superfície, kits e
compra rápida de várias cores. Frete por peso/dimensão via Correios/Melhor Envio
passa a ser viável além da entrega regional (ver pergunta 3).

**Fora (por ora):** cores sob demanda, marketplace, multi-loja, programa de
fidelidade, app mobile, emissão fiscal automatizada (avaliar na fase 5).

## Arquitetura

```
Cliente ── Next.js (Vercel) ──┬─ Supabase: Postgres + Auth + Storage
                              ├─ Gateway: cria cobrança / recebe webhook
                              └─ E-mail transacional
```

### Modelo de dados (inicial)

`products` → `product_variants` (cor, tamanho, preço em centavos, estoque, SKU) ·
`categories` · `customers` · `addresses` · `orders` → `order_items` ·
`payments` · `shipping_zones` (CEP inicial/final, preço, prazo) · `pickup_points`.

Pedido: `pending` → `paid` → `preparing` → `ready_for_pickup | out_for_delivery` →
`completed` (ou `cancelled`).

## Fases

| # | Fase | Entrega |
| --- | --- | --- |
| 0 | Fundação | Repo, AGENTS/CLAUDE.md, lint/format/CI, Next.js, Supabase, deploy de preview |
| 1 | Site institucional | Home, sobre, contato, onde comprar/retirar, política de privacidade |
| 2 | Catálogo | Modelagem, seed, listagem, filtros, página de produto, imagens |
| 3 | Carrinho e checkout | Carrinho, cálculo de frete/retirada, pedido, pagamento Pix e cartão, webhook |
| 4 | Conta e admin | Auth, histórico de pedidos, painel de produtos/estoque/pedidos |
| 5 | Operação | E-mails, analytics, SEO, testes E2E, monitoramento, avaliação fiscal |
| 6 | Lançamento | Domínio, revisão LGPD, carga de catálogo real, go-live |

Cada fase fecha com lint, typecheck, testes e deploy de preview funcionando.

## Qualidade

- CI no GitHub Actions: lint, typecheck, testes, build.
- Testes unitários nas regras de negócio (preço, frete, estoque); E2E (Playwright) no
  fluxo de compra.
- Lighthouse ≥ 90 em performance, acessibilidade e SEO nas páginas públicas.

## Organização do case

- `README.md` com visão, stack, como rodar e capturas de tela.
- ADRs curtos em `docs/decisions/` para cada decisão relevante.
- Sem dados reais de clientes; seed com dados fictícios.

## Perguntas em aberto

1. Nome da marca, identidade visual (logo, cores, tipografia) e tom de voz?
2. Gateway de pagamento: Mercado Pago, Pagar.me, Stripe ou outro?
3. Por serem frascos pequenos, enviar para todo o Brasil (Correios/Melhor Envio) além
   da entrega regional e retirada? Se sim, peso e dimensões por frasco; se não, região
   atendida e regra de preço e prazo.
4. Endereço, horário e política da retirada na fábrica?
5. Tipos (acrílica, vitral, tecido, metálica, etc.), tamanhos (ex.: 37 ml, 60 ml,
   250 ml) e quantidade de cores/SKUs? Haverá kits e pedido mínimo?
6. Controle de estoque: sob pedido, estoque real ou ambos?
7. Preço único ou haverá desconto por quantidade/cupom?
8. Nota fiscal: já tem emissor (Bling, Tiny, outro)? Será integrado?
9. Pessoa física e jurídica (CNPJ) no checkout? Pintores e lojistas terão preço próprio?
10. Quem opera o painel (equipe, nível técnico)? Precisa de múltiplos usuários?
11. Domínio já registrado? Orçamento mensal para hospedagem e serviços?
12. Conteúdo pronto: fotos, fichas técnicas, textos? Haverá blog ou guia de cores?
13. Idioma: apenas pt-BR?

## Respostas preliminares (Instagram @ver.tintas, out/2026)

Extraídas do perfil público do Instagram. Falta confirmar com o dono. O anúncio do
Mercado Livre (PVA fosca 100 ml) exigiu login e não pôde ser lido.

| # | Pergunta | O que o Instagram indica |
| --- | --- | --- |
| 1 | Marca e identidade | Marca **VerTintas** ("Tintas artesanais"). Logo: roseta de pontos coloridos com "VerTintas" em verde escuro. Rótulos com a mesma roseta. Tom: direto, "direto da fábrica". |
| 3 | Envio nacional | Bio diz "Enviamos para..." (texto cortado). Confirmar o alcance. |
| 4 | Retirada | Base em **João Pessoa/PB**. Endereço e horário não informados. |
| 5 | Linha | **PVA** (cores sólidas, inclui branca e azul), **Acrílica Metálica** (9 cores: ouro, ouro velho, bronze, prata, branco pérola, cereja, azul, rosé gold, cobre), complementos. Destaque "Super Cobertura" para cerâmica e gesso. Tamanhos PVA: **100 ml (R$ 14), 250 ml (R$ 28), 500 ml (R$ 40)**. **Kit econômico**: 12 frascos de 100 ml em cores variadas. |
| 7 | Preço | Desconto por volume ("quanto mais tinta, menos você paga": preço por ml cai com o tamanho) e promoções por cor (10% off em 12 cores PVA). Pedido pelo WhatsApp. |
| 12 | Conteúdo | Tem fotos de produto, depoimentos de clientes e dicas (ex.: evitar grumos na PVA). Bom ponto de partida para blog/guia. |

Canal de venda atual: **WhatsApp** (+55 83 98227-0860), Instagram e Mercado Livre.

Seguem em aberto: 2 (gateway), 6 (estoque), 8 (nota fiscal), 9 (CNPJ/preço de
lojista), 10 (quem opera o painel), 11 (domínio e orçamento), 13 (idioma, provável pt-BR).

Catálogo completo (47 SKUs em 12 anúncios do Mercado Livre), fotos e identidade visual
observada: [`docs/reference/CATALOG.md`](reference/CATALOG.md).
