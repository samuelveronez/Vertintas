# Design system VerTintas (v1)

**v1 substitui a v0** (fundo creme e serifa Playfair). Motivo: as fotos de produto do
Mercado Livre têm fundo branco puro, que no creme viravam quadrados soltos, e o creme com
serifa lembrava loja de decoração, não fábrica de tintas.

Base: perfil do Instagram [@ver.tintas](https://www.instagram.com/ver.tintas/) e loja do
Mercado Livre (identidade da marca) + padrões observados em sites de tintas brasileiros
(out/2026): Suvinil, Coral, Lukscolor, Sherwin-Williams, Eucatex, Corfix, Leroy Merlin e
marketplaces. **A empresa é familiar e não tem cores nem fontes oficiais**, então esta
paleta passa a ser a referência do projeto até haver identidade formal. Tokens em
[`reference/design-tokens.css`](reference/design-tokens.css); contexto de produto em
[`reference/CATALOG.md`](reference/CATALOG.md).

## 1. Princípios

1. **Branco como base.** Fundo de página, cartões e fotos de produto são brancos; seções
   alternadas usam um cinza-esverdeado quase imperceptível. Nada de fundo colorido.
2. **Uma cor de marca.** O verde-escuro do logotipo aparece só em header, rodapé e botão
   primário. A cor viva vem do produto (as tintas) e do filete da roseta.
3. **O produto é a cor.** Foto grande, frasco em pé, preço em destaque.
4. **Direto da fábrica.** Preço, tamanho e Pix à vista; pedido em poucos passos; faixa de
   confiança (fábrica, garantia de 90 dias, Pix) logo abaixo do hero.
5. **Sans-serif geométrica e pesada**, como o segmento inteiro; sem serifa decorativa.

## 2. Cor

| Papel | Token | Hex | Observação |
| --- | --- | --- | --- |
| Marca | `--vt-forest` | `#2C372E` | header, rodapé, botão primário, títulos |
| WhatsApp | `--vt-whatsapp` | `#187A41` | verde reconhecível; branco sobre ele 5,5:1 |
| Destaque | `--vt-gold` | `#F5C518` | selos, filetes, número do passo; texto escuro por cima |
| Promoção | `--vt-promo` | `#D81E3C` | selos "10% OFF"; branco sobre ele 4,9:1 |
| Texto | `--vt-ink` | `#17201A` | |
| Texto secundário | `--vt-ink-soft` | `#59645B` | 6,0:1 sobre branco |
| Fundo e cartão | `--vt-white` | `#FFFFFF` | página, cartões, fotos |
| Seção alternada | `--vt-surface` | `#F4F6F2` | |
| Borda | `--vt-line` | `#E3E7E0` | |
| Foco | `--vt-focus` | `#1D4ED8` | anel de 3 px |

**Roseta** (`--vt-dot-1..6`): valores estimados a olho; viram o **filete multicolor** de
4 px sob o header (`--vt-rosette-stripe`) e separadores. Só decoração, nunca único sinal de
estado. **Evitar:** `gold` como cor de texto sobre branco (1,6:1); use-o como fundo com texto
`ink`.

**Swatches de produto:** o site mostra a foto de cada frasco como seletor de cor (nome em
texto ao lado). Hex por cor continua pendente.

## 3. Tipografia

- **Títulos:** Poppins 600/700 (Google Fonts), tracking levemente fechado em títulos grandes.
- **Texto e UI:** Nunito 400/700.
- **Escala:** 13 / 15 / 17 / 20 / 26 / 36 / 48 px.
- **Preço:** Poppins 700 em `xl`, com unidade em `sm`.
- Trocar se o dono tiver fontes oficiais.

## 4. Forma, espaço e elevação

- Cartões brancos com borda `--vt-line`, raio 12 px, sombra mínima (`--vt-shadow-card`).
- Botões e chips em pílula; foto de produto de ponta a ponta no cartão, sem moldura própria.
- Espaço em múltiplos de 4; seções com 48 a 56 px de respiro.

## 5. Componentes

| Componente | Regras |
| --- | --- |
| **Botão primário** | pílula `forest`, texto branco, 48 px de altura |
| **Botão WhatsApp** | pílula `whatsapp`, ícone à esquerda, "Peça pelo WhatsApp" |
| **Botão secundário** | pílula com borda `forest`, fundo transparente |
| **Cartão de produto** | fundo branco, foto em cima (frasco em pé), nome, "a partir de" + preço, nº de cores |
| **Seletor de cor** | miniatura da foto do frasco com o nome embaixo; selecionado com borda `forest` |
| **Seletor de tamanho** | chips com tamanho e preço |
| **Faixa de confiança** | barra `forest` com 4 a 5 diferenciais, logo abaixo do hero |
| **Selo** | pílula `gold` com texto `ink` (destaque) ou `promo` com texto branco (desconto) |
| **Filete da roseta** | 4 px sob o header |
| **Barra de carrinho (mobile)** | fixa no rodapé da tela com total e botão, só com itens no carrinho |

Acessibilidade: foco visível, alvos de toque ≥ 44 px, nome da cor sempre em texto, contraste
AA nos pares acima.

## 6. Imagem e tom

- **Produto:** frasco recortado em fundo branco (padrão do ML); cartões sem fundo próprio.
- **Hero e seções:** foto de ambiente (pincéis, bancada, peça pintada) em vez de colagem de
  frascos.
- **Texto:** frases curtas, benefício primeiro ("super cobertura", "seca rápido", "não
  tóxica"), preço sem rodeio, CTA direto ("Peça agora").

## 7. Pendências

1. Logo vetorial (SVG); o site usa uma roseta desenhada provisória.
2. Hex de cada swatch de produto.
3. Conferir as cores da roseta contra o logo.
4. Registrar fontes e paleta em ADR se o dono não tiver manual de marca.
5. Fotos de ambiente próprias para hero e seções (as do ML são material de referência).
