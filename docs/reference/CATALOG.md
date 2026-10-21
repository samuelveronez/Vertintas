# Catálogo e identidade visual (referência)

Fonte: loja **VERTINTAS** no Mercado Livre (vendedor 3542972289, +25 produtos, +50 vendas,
capturado em 21/10/2026) e Instagram [@ver.tintas](https://www.instagram.com/ver.tintas/).
Dados completos em [`catalog.json`](catalog.json); fotos em [`catalog-images/`](catalog-images/)
(97 arquivos, nome `<id ML>-<n>.webp`). Material de referência: fotos e textos são da marca,
reutilizar no site só com autorização do dono.

## Linhas de produto

12 anúncios, 47 SKUs (cada cor é um anúncio de produto próprio no ML).

| Linha | Tamanho | Preço | Cores / variações |
| --- | --- | --- | --- |
| **Tinta PVA fosca** | 100 ml | R$ 14 | 28 cores (lista abaixo) |
| **PVA cor especial Tracunhaém** | 100 ml | R$ 14 | 1 (mesma cor da cerâmica de Tracunhaém/PE) |
| **Acrílica metálica** | 100 ml | R$ 18 | 9: Ouro, Ouro velho, Bronze, Prata, Branco pérola, Cereja, Azul, Rose gold, Cobre |
| **Base acrílica** (preparação) | 100 / 250 / 500 ml | R$ 12 / 18 / 32 | Branco, fosco |
| **Verniz acrílico brilhante** | 100 / 250 ml | R$ 18 / 35 | Transparente |
| **Goma laca indiana** (seladora) | 100 ml | R$ 20 | Marrom |
| **Kit metálicas 04 cores** | 4 × 100 ml | R$ 67 | Cliente escolhe por mensagem; sem resposta em 2 h, vão cores sortidas |
| **Kit metálicas 08 cores** | 8 × 100 ml | R$ 135 | Idem |
| **Kit metálicas 09 cores** | 9 × 100 ml | R$ 150 | Todas as 9 |

**PVA, 28 cores:** Amarelo canário, Amarelo ouro, Amarelo bebê, Areia, Azul bebê, Azul claro,
Azul country, Azul pavão, Azul da prússia, Azul marinho, Branco, Burgundy, Capuccino, Castanho
claro, Laranja, Marrom, Marrom-escuro, Marsala, Pele, Preto, Pérola, Rosa bebê, Turquesa, Verde
colonial, Verde natal, Verde oliva, Verde água, Vermelho.

**Preços no Instagram (PVA):** 100 ml R$ 14, 250 ml R$ 28, 500 ml R$ 40, ou seja: 250/500 ml
existem fora do ML (não vi esses tamanhos de PVA no ML). Kit econômico: 12 frascos de 100 ml.

### Padrão dos textos de produto

- Atributos fixos: **base água, não tóxica, pronta para uso, secagem rápida, excelente
  cobertura** (PVA); **garantia de fábrica 90 dias**.
- Onde usar: MDF, madeira, gesso, cerâmica, cortiça, isopor, tela, papel/papelão.
- Aplicação: rolo de espuma, pincel ou esponja.
- Embalagem: frasco/pote plástico branco com tampa branca e rótulo único. Preço por litro
  é exibido no ML (R$ 140/L na PVA 100 ml).
- Condições ML: frete grátis acima de R$ 19, devolução grátis em 30 dias.

### Implicações para o modelo de dados

- `products` por linha; `product_variants` por cor × tamanho (hoje cor ⇒ 1 tamanho, exceto
  base e verniz, que variam só em tamanho).
- Kits com **escolha de cores** (4 e 8 de 9): item composto com seleção do cliente no
  carrinho, em vez da mensagem pós-compra usada hoje.
- Cor com hex de referência para a grade de swatches (ainda não coletado).
- Preço por litro calculado, para comparar tamanhos.

## Identidade visual (observada)

- **Logo:** roseta de pontos coloridos em espiral (vermelho, laranja, amarelo, verde, azul,
  roxo) acima do nome **"VerTintas"**, com o "T" estilizado como pincel; assinatura
  "Tintas artesanais". Nome em verde-escuro. Usado no rótulo e no avatar do Instagram.
- **Rótulo:** etiqueta branca no frasco com lote, tipo, cor e "Conteúdo 100 ml".
- **Fotografia:** frascos recortados em fundo branco (ML) e cenas em madeira/bege com
  pincéis e peças (Instagram). Kits mostrados lado a lado, em fila.
- **Peças gráficas:** fundo creme/bege, títulos em serifa grande ("Acrílica Metálica",
  "Kit 08") em marrom-terracota, faixa/botão de destaque terracota ou verde-escuro,
  pinceladas de tinta nos cantos, selo "10% OFF" vermelho para promoções.
- **Paleta aproximada (a validar no manual da marca):** verde-escuro do logotipo,
  terracota, creme, mais as cores vivas da roseta como acento.
- **Tom de voz:** direto e prático ("direto da fábrica", "quanto mais tinta, menos você paga",
  "super cobertura"), com prova social (depoimentos) e dicas de uso.
- **Slogans em uso:** "Tintas para artesanato direto da fábrica", "Super Cobertura".

Pendente: arquivo vetorial do logo, tipografias oficiais e códigos de cor exatos; pedir ao
dono.
