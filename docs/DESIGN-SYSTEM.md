# Design system VerTintas (proposta v0)

Base: perfil do Instagram [@ver.tintas](https://www.instagram.com/ver.tintas/) (posts de
jul a out/2026) e a loja do Mercado Livre. Cores medidas por amostragem de pixels nas
imagens; tipografia identificada visualmente. **Tudo a validar com o dono**; o ideal é
substituir pela identidade oficial (logo vetorial, fontes, códigos) quando existir.
Tokens em [`reference/design-tokens.css`](reference/design-tokens.css). Contexto de produto em
[`reference/CATALOG.md`](reference/CATALOG.md).

## 1. Princípios (o que a marca já faz)

1. **Artesanal e quente**: fundos creme/madeira, pincéis e peças pintadas, nunca frio ou
   "corporativo".
2. **Direto da fábrica**: preço e tamanho em destaque ("100 ml R$ 14 · 250 ml R$ 28 ·
   500 ml R$ 40"), promoção explícita, pedido em poucos passos.
3. **O produto é a cor**: as cores das tintas são o único ponto de saturação; a interface
   fica quente e neutra para não competir.
4. **Prova social e ensino**: depoimentos com estrelas e dicas de uso fazem parte do
   conteúdo, não são extras.
5. **Regional com orgulho**: João Pessoa/PB, datas e cultura nordestina (ex.: "Feliz Dia do
   Nordestino") entram como tema sazonal.

## 2. Cor

| Papel | Token | Hex | Observação |
| --- | --- | --- | --- |
| Tinta de marca | `--vt-forest` | `#2C372E` | verde-escuro do logotipo; títulos, rodapé, botão primário |
| Ação secundária | `--vt-olive` | `#5D693B` | botões do tipo "Peça pelo WhatsApp", "Salvar" |
| Realce | `--vt-terracotta` / `-ink` | `#B2734C` / `#8F4A2B` | usar o `-ink` para texto e botão |
| Metal/cobre | `--vt-copper` | `#D58D4B` | títulos grandes, pinceladas |
| Ouro | `--vt-gold` | `#E6A828` | estrelas, filetes, selos |
| Texto | `--vt-ink` | `#462812` | marrom-café, no lugar de preto |
| Fundo página | `--vt-paper` | `#FBF5EC` | |
| Fundo cartão | `--vt-cream` | `#F5E6D4` | |
| Promoção | `--vt-promo` | `#8F0503` | selos "10% OFF" |
| Institucional | `--vt-teal` | `#507577` | peças de fundo liso (ex.: Tracunhaém) |

Roseta do logo (`--vt-dot-1..6`, valores estimados a olho; só o rosa-vermelho foi medido): vermelho-rosado, laranja, amarelo, verde, azul, roxo; só
decoração (separadores, loaders, favicon), nunca como único sinal de estado.

**Contraste (WCAG, calculado):** texto `forest` sobre `paper` 11,4:1; `ink` sobre `paper`
12,3:1; branco sobre `olive` 5,9:1; branco sobre `terracotta-ink` 6,6:1; branco sobre
`promo` 9,6:1; `olive` sobre `paper` 5,5:1. **Evitar:** `gold` sobre claro (1,9:1, só em
fundo escuro ou como ícone com rótulo) e `terracotta` puro como texto pequeno (3,6:1).
Branco sobre `terracotta` 3,9:1 serve só para texto grande.

### Swatches de produto

Cada cor de tinta precisa de um hex de referência para a grade de cores (28 PVA + 9
metálicas). Ainda não coletado: extrair da foto da tampa/amostra de cada SKU e validar com
o dono. Metálicos usam gradiente (base + brilho) em vez de cor chapada.

## 3. Tipografia

- **Títulos:** serifa de alto contraste, estilo Playfair Display (visto em "As cores mais
  pedidas", "Acrílica Metálica", "Quem usa, recomenda"). Cores: terracota/cobre, verde-oliva
  ou marrom; sempre grande, com 1 palavra em destaque.
- **Apoio e rótulos:** sans-serif arredondada, estilo Nunito, para subtítulos ("O brilho que
  transforma qualquer peça"), chips, preços e UI.
- **Escala:** 13 / 15 / 17 / 20 / 26 / 36 / 48 px; títulos em `font-display`, 700.
- **Preço:** `font-display`, 700, tamanho `xl`, com unidade pequena ("R$ 14" e "100 ml" em
  `sm`). Preço por litro em `xs`.
- Licença: ambas livres (Google Fonts). Trocar se o dono tiver fontes oficiais.

## 4. Forma, espaço e elevação

- Cantos generosos: cartões 24 px, botões e chips em pílula, imagens 16 px.
- Cartões creme com **filete dourado fino** e sombra marrom suave (`--vt-shadow-card`).
- Espaço em múltiplos de 4; seções com 48 px de respiro.
- Pinceladas de tinta em canto (SVG) como ornamento de cabeçalhos de seção; poucas, nunca
  sobre texto.

## 5. Componentes

| Componente | Regras (observadas) |
| --- | --- |
| **Botão primário** | pílula `forest`, texto creme, 48 px de altura; ícone quando for ação externa |
| **Botão WhatsApp** | pílula `olive`, ícone do WhatsApp à esquerda, texto "Peça agora pelo WhatsApp" |
| **Botão secundário** | pílula com borda `forest`, fundo transparente |
| **Cartão de produto** | foto do frasco sobre `vt-photo-bg`, nome, tamanho, preço, botão; frasco sempre em pé, centralizado |
| **Seletor de cor (swatch)** | círculo 40 px com borda 2 px, nome da cor no foco/hover, estado selecionado com anel `forest` |
| **Seletor de tamanho** | chips 100 / 250 / 500 ml com preço e preço por litro |
| **Tabela de preços** | cartão creme com 3 colunas (tamanho, frasco, preço) como no post de preços |
| **Kit** | cartão com faixa "Kit econômico", lista de checks (✔ 12 unidades, cores variadas, mais economia) |
| **Selo promocional** | quadrado/pílula `promo`, branco, ex.: "10% OFF", com data limite ("até quarta") |
| **Depoimento** | cartão creme, aspas em ouro, 5 estrelas ouro, nome e cidade ("João do Nascimento, Recife/PE") |
| **Dica de uso** | passos numerados em círculo + ícone, 3 passos no máximo |
| **Faixa de fábrica** | "Direto da fábrica · João Pessoa/PB · Enviamos para todo o Brasil" (confirmar envio) |

Acessibilidade: foco visível (`--vt-focus`, 3 px), alvos de toque ≥ 44 px, nome da cor em
texto junto de cada swatch (nunca só a cor), contraste AA nos pares acima.

## 6. Imagem e tom

- **Foto de produto:** frasco recortado, fundo branco ou creme, uma foto por cor e uma
  de rótulo; cena (madeira, pincéis, peça pintada) como segunda imagem. As fotos do ML em
  `reference/catalog-images/` mostram o padrão.
- **Fotos de uso:** peças pintadas (cerâmica, gesso, imagens sacras, MDF) em luz quente, com
  a tinta usada identificada.
- **Texto:** frases curtas, benefício primeiro ("Super cobertura", "Seca rápido",
  "Não tóxica", "Pronta para uso"), preço sem rodeio, CTA direto ("Peça agora").
- **Datas sazonais** (Natal, Dia do Nordestino, Páscoa) pedem variação do cabeçalho com
  ilustração, mantendo logo, `forest` e creme.

## 7. Aplicação no site

- Home: faixa de fábrica, grade de linhas (PVA, Metálica, Base, Verniz, Goma laca, Kits),
  tabela de preços, depoimentos, dicas.
- Catálogo: cartões por linha; página de produto com swatches, tamanhos, descrição "onde
  usar / como aplicar" e garantia de 90 dias.
- Checkout: botão WhatsApp como alternativa ao Pix/cartão enquanto a operação migra.
- Tailwind: mapear os tokens em `theme.extend` (cores `vt-*`, `fontFamily.display/body`,
  `borderRadius`) ao iniciar a fase 0.

## 8. Pendências

1. Logo vetorial (SVG), versão monocromática e área de proteção.
2. Fontes e cores oficiais, se houver manual da marca.
3. Hex de cada swatch de produto.
4. Confirmar tom de voz e hashtags/slogans oficiais.
5. Definir regra para peças sazonais e uso de ilustração.
