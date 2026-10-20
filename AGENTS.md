# AGENTS.md

Guia para agentes de código (e pessoas) neste repositório. Fonte única de regras;
`CLAUDE.md` apenas a importa.

## Projeto

Site institucional e e-commerce de uma fabricante de **tintas para artesanato** de
pequeno porte (frascos de pequenos volumes), que vende **somente produtos da própria
marca**. Repositório público (case): mantenha
tudo limpo, documentado e sem dados sensíveis.

- Plano e decisões: [`docs/PLAN.md`](docs/PLAN.md)
- Decisões de arquitetura: [`docs/decisions/`](docs/decisions/)

## Stack

Next.js (App Router) · TypeScript estrito · Tailwind CSS · Supabase (Postgres, Auth,
Storage) · gateway de pagamento (Pix e cartão) · Vercel.

## Estrutura

```
src/
  app/          rotas (páginas, layouts, route handlers)
  components/   UI reutilizável, sem regra de negócio
  features/     um diretório por domínio: catalog, cart, checkout, orders, shipping
  lib/          clientes e utilitários (supabase, payments, format)
supabase/       migrations SQL e seed
docs/           plano, decisões (ADRs)
```

Regra de dependência: `app` → `features` → `lib`. `lib` nunca importa de `features`.

## Comandos

```
pnpm dev          # servidor local
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm test         # testes unitários
pnpm build        # build de produção
```

Antes de concluir qualquer tarefa: `pnpm lint && pnpm typecheck && pnpm test`.

## Convenções de código

- Código enxuto: só o necessário para o requisito atual. Sem abstração especulativa,
  sem código morto, sem dependência nova sem justificativa.
- Identificadores em inglês; textos de interface e documentação em português (pt-BR).
- Componentes de servidor por padrão; `"use client"` só quando houver interatividade.
- Validação de entrada com Zod nas bordas (formulários, route handlers, webhooks).
- Valores monetários em **centavos (inteiro)**; formatação só na camada de exibição.
- Comentários explicam o *porquê*, não o *quê*. Nada de comentários óbvios.
- Formatação automática (Prettier); não discuta estilo em review.

## Segurança e dados

- Nunca commitar segredos. Use `.env.local`; mantenha `.env.example` atualizado.
- RLS ativo em todas as tabelas do Supabase; escrita sensível apenas no servidor.
- Confirmação de pagamento somente via webhook verificado, nunca pelo cliente.
- Dados pessoais (LGPD): colete o mínimo, documente o uso na política de privacidade.

## Git

- Commits pequenos, no imperativo, em português ou inglês de forma consistente
  (Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`).
- Uma mudança lógica por commit. Não abrir PR sem pedido explícito.
- Decisões relevantes viram um ADR curto em `docs/decisions/`.
