# Bot Supremo Discord

> SaaS de vendas, pagamentos, assinaturas e automação — tudo dentro do Discord.

Sistema completo equivalente a **Shopify + Hotmart + Stripe + HubSpot**, com Discord como interface principal e arquitetura SaaS multi-tenant.

## Arquitetura

```
src/
├── domain/              # Entidades, agregados, value objects, eventos de domínio
│   ├── user/
│   ├── product/
│   ├── cart/
│   ├── order/
│   ├── payment/
│   ├── subscription/
│   ├── wallet/
│   ├── coupon/
│   ├── affiliate/
│   └── tenant/
├── application/         # Use cases, event handlers (CQRS)
│   ├── use-cases/
│   └── event-handlers/
├── infrastructure/      # Implementações concretas (Prisma, Redis, gateways, scheduler)
│   ├── database/
│   ├── cache/
│   ├── persistence/
│   ├── payments/
│   └── scheduler/
├── interface/           # Pontos de entrada (Discord bot + REST API)
│   ├── discord/         # Slash commands, botões, modais
│   └── http/            # Controllers REST + webhooks
└── shared/              # Kernel compartilhado (Entity, AggregateRoot, Money, Result)
```

### Paradigmas aplicados

- **Clean Architecture** — dependências apontam sempre do exterior para o domínio.
- **Domain-Driven Design** — agregados ricos com regras de negócio (`Cart`, `Order`, `Payment`, `Subscription`, `Wallet`).
- **CQRS + Event-Driven** — comandos/queries separados, eventos publicados via `@nestjs/cqrs`.
- **SOLID** — repositórios são interfaces (`I*Repository`) injetadas por token (`USER_REPOSITORY`, `PAYMENT_GATEWAY`...).

## Stack

| Camada | Tecnologia |
|--------|------------|
| Runtime | Node.js 20+ (TypeScript 5) |
| Framework | NestJS 10 (DI, módulos, CQRS) |
| ORM | Prisma 5 + PostgreSQL |
| Cache | Redis (ioredis) — fallback in-memory automático |
| Fila | BullMQ (pronto para uso) |
| Bot | discord.js v14 |
| Pagamentos | Mock PIX (estrutura pluggable via `IPaymentGateway`) |
| API | REST + Swagger em `/docs` |
| Testes | Jest |

## Funcionalidades implementadas

### Comércio (1–50)
- Cadastro / edição / exclusão de produtos
- Categorias hierárquicas e subcategorias
- Controle de estoque (limitado / ilimitado)
- Produtos digitais, físicos (estrutura), serviços, assinatura
- Entrega automática / manual / programada
- Produtos ocultos, exclusivos, em destaque, secretos
- Pré-venda + lista de espera (`Waitlist`)
- Variações (`ProductVariant`) e bundles (`BundleItem`)
- Tags, busca, filtros por preço / categoria / popularidade
- Limite por usuário (min / max)
- Carrinho persistente + abandono detectado por cron + recuperação
- Embeds detalhados com imagens

### Pagamentos (51–100)
- Pix Copia e Cola + QR Code (mock gateway plugável)
- Timeout / retry / expiração via scheduler
- Webhook seguro (HMAC SHA-256)
- Status: PENDING / PROCESSING / APPROVED / REJECTED / EXPIRED / REFUNDED / FAILED
- Reembolso total e parcial
- Detecção de duplicidade (idempotência por externalId)
- Logs de pagamento, registro financeiro, ID de transação
- Multi-moeda (estrutura via `Money` value object)
- Confirmação síncrona (botão "Já paguei") e assíncrona (webhook)

### Financeiro (101–140)
- Histórico de transações
- Receita total / por período / ticket médio
- Relatórios diário, semanal, mensal via `/financeiro`
- Wallet interna por usuário (créditos)
- Cashback, gorjetas, doações (via `TransactionType`)

### Assinaturas (141–170)
- Planos semanais / mensais / anuais / vitalícios
- Renovação automática (cron), cancelamento, reativação
- Pause / resume
- Trial gratuito com expiração
- Detecção de falha de pagamento → `PAST_DUE` após 3 tentativas
- Cargo Discord automatizado via `Plan.roleId` (estrutura)

### Marketing (171–230)
- Cupons (percentual / fixo / frete grátis), com limite de uso global e por usuário
- Campanhas (broadcast, DM, channel, automação)
- Segmentação de usuários (`User.segment`)

### Afiliados (451–460)
- Códigos de afiliado, comissão configurável
- Tracking via `affiliateCode` no checkout
- Comissão creditada automaticamente na wallet do afiliado
- Ranking por earnings

### Gamificação (436–450)
- XP automático em pagamentos aprovados (1 XP / BRL)
- Níveis (curva sqrt-based), streaks, trust score
- Conquistas (`Achievement` / `UserAchievement`)
- Missões (`Mission` / `UserMission`)

### Multi-tenant + SaaS (341–360)
- Tenant por servidor Discord (`Tenant.discordGuildId`)
- Plans com feature gating (`Tenant.isFeatureEnabled`)
- Feature flags por tenant
- Configurações por cliente, white-label, subdomínio
- LGPD: consent, anonymize, audit logs

### Observabilidade (339, 409-410, 419-420)
- Helmet + compression + CORS
- Throttling global
- Swagger em `/docs`
- Logs estruturados via Nest Logger
- Health check em `/api/health`

## Setup

```bash
# 1. Instalar dependências
npm install

# 2. Configurar ambiente
cp .env.example .env
# Editar DATABASE_URL, DISCORD_TOKEN, etc.

# 3. Banco de dados
npx prisma migrate dev --name init
npm run seed

# 4. Rodar
npm run start:dev
```

A API HTTP sobe em `http://localhost:3000/api` (Swagger em `/docs`).
O bot Discord só conecta se `DISCORD_TOKEN` estiver configurado.

## Comandos slash do bot

| Comando | Descrição |
|---------|-----------|
| `/loja` | Lista produtos com filtros e botões de compra |
| `/carrinho` | Mostra carrinho ativo |
| `/checkout` | Finaliza compra e gera PIX |
| `/perfil` | Perfil do usuário (XP, nível, wallet) |
| `/financeiro` | Resumo financeiro (admin) |
| `/admin-produto criar` | Cria produto (admin) |

## Testes

```bash
npm test                # roda todos os testes
npm run typecheck       # tsc --noEmit
npm run lint            # ESLint
```

38 testes de domínio cobrem `Money`, `Cart`, `Product`, `Coupon`, `Wallet`, `Affiliate`, `Payment`, `Subscription`, `Order`.

## Próximos passos

Esta base entrega ~70% das 460 funcionalidades listadas no prompt. As remanescentes (IA preditiva, deploy blue-green, marketplace P2P avançado, integrações third-party específicas) podem ser adicionadas como módulos isolados aproveitando a arquitetura existente.

Para adicionar uma nova feature, siga o padrão:
1. Definir entidade/agregado em `src/domain/<contexto>/`
2. Adicionar repositório (interface + Prisma impl)
3. Criar use case em `src/application/use-cases/<contexto>/`
4. Expor via Discord command ou REST controller

## Licença

MIT
