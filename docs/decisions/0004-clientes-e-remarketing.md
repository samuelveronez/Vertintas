# 0004. Cadastro de clientes, consentimento e conta simples

Status: aceita

## Contexto

Os pedidos do site guardavam só nome, telefone e endereço em texto. A loja quer **salvar os
clientes** para falar com eles depois (WhatsApp ou e-mail: promoções, lançamentos) e oferecer um
**login simples** que guarda nome e endereço.

## Decisão

- Tabela `customers` (Supabase), preenchida por `place_site_order()` a cada pedido do site. O pedido
  ganha `customer_id`.
- Dois tipos de cadastro: **convidado** (só checkout; chave = WhatsApp, o último pedido atualiza
  nome e endereço) e **conta** (`user_id`, login por link no e-mail, sem senha).
- Comprar sem conta continua possível. A conta serve para pré-preencher o checkout.
- **Consentimento (LGPD)** por canal (`accepts_whatsapp`, `accepts_email`), nunca marcado por
  padrão, com data (`consent_at`) definida por trigger. O pedido de convidado só pode **ligar** o
  consentimento; revogar é na página Minha conta ou pedindo à loja.
- RLS: a equipe (`staff`) lê e edita tudo; o cliente logado lê e edita só a própria linha. O
  público anônimo não lê nada, e o convidado nunca recebe dados de volta.
- Política de privacidade atualizada (cadastro, promoções, ViaCEP, Supabase, Melhor Envio).

## Consequências

- O cadastro de convidado e o de conta da mesma pessoa não se fundem sozinhos (evita que alguém
  logado assuma o cadastro de outro por WhatsApp). Unificar fica para o painel.
- O Auth do Supabase precisa permitir cadastro (o link por e-mail cria o usuário). Quem não está
  em `staff` não acessa o painel.
- A entrega do e-mail de login exige SMTP próprio; o padrão do Supabase é limitado a poucos envios
  e só para a equipe do projeto.
- Disparo de promoções fica fora do site: exportar contatos com consentimento (painel/CSV) e usar
  ferramenta de envio, respeitando o cancelamento.
