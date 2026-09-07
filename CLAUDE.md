# Konvert — notas para trabalhar neste repositório

## Fase

Atual: **Fase 5 completa** — diagnóstico gratuito ("Raio-X do Lucro", Fases
1A-1C) + produto pago de acompanhamento contínuo ("Inteligência de lucro
para delivery", Fases 0-5: contas, lançamento diário, custos
recorrentes/metas/comparação de período, assinatura via Stripe). Fase 1A
(motor financeiro do diagnóstico) segue congelada — não altere sem
necessidade documentada. Fase 6 (análises avançadas, alertas, simulador,
histórico, importação CSV, integrações iFood/PDV) está **fora de escopo**
por decisão explícita do plano técnico — não implemente nada disso sem que
o escopo mude.

### Duas famílias de motor, deliberadamente separadas

- `src/domain/diagnostic/` — o motor do diagnóstico gratuito (Fase 1A),
  opera sobre um `DiagnosticInput` único (uma resposta por pergunta, com
  `ResponseState` de 6 estados). **Congelado.**
- `src/domain/tracking/` — o motor de acompanhamento contínuo (Fase 3+),
  opera sobre um `PeriodInput` agregado de lançamentos reais (`daily_entries`
  + `variable_costs` + `recurring_costs` prorateados). Não tem estados
  "unknown"/"estimated" — uma linha existe ou não existe. Tem seu próprio
  `Metric<T>` e `TRACKING_FORMULA_VERSION`, **não** importa nada de
  `domain/diagnostic/`. Não funda os dois motores nem reintroduza o
  `ResponseState` do diagnóstico aqui.

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

## Regras da camada de servidor (Fase 1B, diagnóstico gratuito)

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

## Regras do produto pago (Fases 0-5)

- **Sessão de app é separada da sessão do diagnóstico**: cookie
  `konvert_app_session` (login por magic-link) nunca se mistura com
  `konvert_raiox_session` (edição de um rascunho anônimo). Mesma disciplina
  de segredo-no-cookie/hash-no-banco/comparação em tempo constante.
- **Autorização por membership, nunca por dono implícito**: qualquer rota
  sob `/api/app/establishments/[establishmentId]/...` chama
  `assertMembership` antes de tocar dado nenhum. Um usuário que não é
  membro recebe **404**, nunca 403 — mesma lógica anti-enumeração da sessão
  do diagnóstico, agora sobre `establishmentId` em vez de `diagnosticId`.
- **`daily_entries` usa bloqueio otimista** (`entriesVersion`), mesmo padrão
  de `answers_version`: a checagem vive no `WHERE` do `UPDATE`, uma edição
  sem `expectedVersion` contra uma linha existente é rejeitada (409), nunca
  sobrescrita silenciosa.
- **Nunca armazene o que pode ser derivado**: a distribuição de um custo
  recorrente por período (`prorateRecurringCost`) é sempre calculada sob
  demanda a partir de `recurring_costs`, nunca persistida como valor
  pronto — mesma filosofia de `diagnostic_results` guardar só o resultado
  final, não passos intermediários.
- **`subscriptions` é append-only**: uma transição de status do Stripe
  nunca faz `UPDATE`, sempre `INSERT` de uma nova linha
  (`insertSubscriptionEvent`). O status atual é sempre "a linha mais
  recente por `provider_event_at`", nunca uma coluna mutável.
- **Guarda de monotonicidade em `provider_event_at`**: antes de gravar um
  evento de assinatura, `recordSubscriptionEvent` compara o timestamp do
  evento (não "agora") com o da última linha gravada — um evento mais
  antigo que já chegou fora de ordem é descartado, nunca regride o status.
- **Webhook do Stripe é idempotente por construção**: `tryClaimWebhookEvent`
  faz `INSERT ... ON CONFLICT DO NOTHING` em `billing_webhook_events` antes
  de interpretar o payload — uma redelivery do mesmo `event.id` nunca
  reaplica nada, mesmo sob concorrência. Não mova essa checagem para depois
  de decidir o tipo do evento.
- **A rota do webhook nunca usa `readJsonBody`**: o Stripe assina os bytes
  crus da requisição; ela lê `request.text()` e passa a string exata para
  `stripe.webhooks.constructEvent`. Re-serializar via `JSON.parse`/
  `JSON.stringify` antes invalida a assinatura. Também não há checagem de
  `Origin` nessa rota — quem chama é o Stripe, não um navegador; a
  assinatura é toda a fronteira de confiança.
- **`getStripeEnv()`/`getStripeClient()` são lazy** como `getEnv()`/`getDb()`:
  `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`/`STRIPE_PRICE_ID` são
  opcionais no schema de ambiente para que `pnpm build` e toda rota que não
  seja de cobrança continuem funcionando sem nenhuma conta Stripe
  configurada. O erro de "Stripe não configurado" só acontece na hora de
  efetivamente iniciar um checkout/portal — nunca no import do módulo.

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
