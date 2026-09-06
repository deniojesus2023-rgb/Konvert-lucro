# Konvert — notas para trabalhar neste repositório

## Fase

Atual: **1B** (banco, persistência, segurança e APIs). A Fase 1A (motor
financeiro) está aprovada e congelada. Ainda não existem telas: landing,
wizard, resultado visual, oferta, checkout, assinatura e autenticação de
usuário são Fase 1C+ — não reintroduza nada disso sem que o escopo mude.

## Regras do domínio (Fase 1A — não alterar sem necessidade documentada)

- `src/domain/` é TypeScript puro: nunca importe React, Next.js, banco ou
  rede ali. É o que garante que o motor de cálculo seja testável sem mocks.
- Dinheiro é sempre `Cents` (inteiro), nunca `number` cru nem `float`. Toda
  conversão para/de reais passa por `src/domain/money/cents.ts`.
- Multiplicações que podem passar de `Number.MAX_SAFE_INTEGER` (ex.: custo
  fixo × receita para o ponto de equilíbrio) usam `BigInt` via
  `src/domain/money/arithmetic.ts` (`mulDivRound`/`mulDivCeil`) — não
  reintroduza multiplicação/divisão direta em `number` para esses casos.
- Resposta desconhecida (`unknown`/`unanswered`) nunca vira zero. Só
  `zero_confirmed` é zero de verdade. Veja `response-state.ts`.
- Métrica indisponível é `{status:"unavailable", reason}` — nunca `0`, nunca
  `null` sem motivo. `selfReportedDisclaimer: true` está em todo resultado.
- Fórmulas, arredondamentos e `FORMULA_VERSION` só mudam com necessidade
  real e documentada em `docs/formulas.md` (bump da versão junto).

## Regras da camada de servidor (Fase 1B)

- Camadas separadas: rota (HTTP/cookie/status) → service (regra +
  transação) → repository (Drizzle) → domain (cálculo). **Nenhuma regra
  financeira dentro de Route Handler.**
- Dinheiro no PostgreSQL é `bigint`. Toda leitura passa por
  `src/server/db/money-codec.ts`, que recusa valores fora do intervalo
  seguro em vez de truncar.
- Sessão: o cookie carrega só o segredo; o banco guarda só o SHA-256.
  Comparação sempre por `verifySessionSecret` (tempo constante). Sessão
  inválida ⇒ **404**, nunca 401/403 (evita enumeração).
- Nunca logue: segredo do cookie, token de resultado completo, nome,
  WhatsApp ou payload com dado pessoal. Para correlacionar em log, use
  `tokenFingerprint`.
- Toda escrita revalida no servidor com Zod, mesmo que o navegador já tenha
  validado.
- `getEnv()` e `getDb()` são lazy de propósito: `pnpm build` precisa passar
  sem banco e sem `.env`.
- Resultado concluído é imutável: nunca faça `UPDATE` em
  `diagnostic_results`. Refazer = nova revisão (`POST /revise`).

## Antes de considerar algo pronto

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration   # exige TEST_DATABASE_URL + pnpm db:test:up
pnpm build
```

Todos devem passar sem desabilitar checagens. Testes de integração rodam
contra PostgreSQL real — nunca troque por SQLite, banco em memória ou mock
do driver. Depois de mexer em `src/server/db/schema.ts`, rode
`pnpm db:generate` e confirme que não ficou migration pendente.
