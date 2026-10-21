# 0001. Checkout com Pix estático no GitHub Pages

Status: aceita (provisória, até haver backend e gateway)

## Contexto

O site vai ao ar no GitHub Pages, que só serve arquivos estáticos. O plano prevê Supabase e
gateway de pagamento com webhook (AGENTS.md: pagamento só confirmado por webhook verificado),
mas a operação hoje roda por WhatsApp e Mercado Livre e precisa de algo simples agora.

## Decisão

- Next.js com `output: "export"`; carrinho em `localStorage`.
- Pix gerado no navegador como BR Code estático com valor (`src/lib/pix.ts`), usando a chave
  definida em variável de build (`NEXT_PUBLIC_PIX_KEY`, fora do repositório).
- O pedido e o comprovante seguem por WhatsApp; **a confirmação é manual**, feita pela loja.
- Frete não é calculado no site: combinado no WhatsApp (pergunta 3 do plano segue em aberto).
- Mercado Livre: link discreto no rodapé e em cada produto.

## Consequências

- Sem conciliação automática, sem estoque e sem painel; aceitável para o volume atual.
- A chave Pix fica pública no bundle (é a natureza do Pix estático).
- Migrar para gateway + webhook (fases 3 e 4 do plano) substitui o checkout; catálogo e UI
  permanecem.
