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
- Em `handleRoute` (`src/server/http/errors.ts`), um erro inesperado
  **nunca** loga `error.message`/`stack`/`cause` — driver do Postgres pode
  embutir SQL, parâmetros ou dado pessoal na própria mensagem. Loga só a
  string fixa `"[api] erro interno não tratado"` + um `correlationId`
  aleatório (`randomUUID()`), devolvido também na resposta para o cliente
  poder referenciar o log. Não reintroduza `error.message` no log nem na
  resposta desse branch.
- Toda escrita revalida no servidor com Zod, mesmo que o navegador já tenha
  validado.
- `getEnv()` e `getDb()` são lazy de propósito: `pnpm build` precisa passar
  sem banco e sem `.env`.
- Resultado concluído é imutável: nunca faça `UPDATE` em
  `diagnostic_results`. Refazer = nova revisão (`POST /revise`).
- `finalizeDiagnostic`: se o diagnóstico já está `completed` e a sessão é
  válida, devolva o `resultToken` existente **independente** da
  `idempotencyKey` recebida — é o que recupera o dono depois de uma
  resposta perdida (reload gera chave nova). Nunca crie lead/consent/result
  de novo nesse caminho; uma sessão diferente continua batendo em 404 antes
  de chegar aqui.
- `diagnostics.source_diagnostic_id` é uma foreign key real
  (`ON DELETE RESTRICT`) para `diagnostics.id` — não volte a deixá-la como
  UUID solto.

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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
