# Konvert — notas para trabalhar neste repositório

- Fase atual: **1A** (fundação + motor financeiro). Sem banco, API, auth ou
  telas comerciais ainda — não reintroduza essas coisas sem que o escopo da
  fase mude.
- `src/domain/` é TypeScript puro: nunca importe React, Next.js, banco ou
  rede ali. É o que garante que o motor de cálculo seja testável sem mocks.
- Dinheiro é sempre `Cents` (inteiro), nunca `number` cru nem `float`. Toda
  conversão para/de reais passa por `src/domain/money/cents.ts`.
- Multiplicações que podem passar de `Number.MAX_SAFE_INTEGER` (ex.:
  custo fixo × receita para o ponto de equilíbrio) usam `BigInt` via
  `src/domain/money/arithmetic.ts` (`mulDivRound`/`mulDivCeil`) — não
  reintroduza multiplicação/divisão direta em `number` para esses casos.
- Resposta desconhecida (`unknown`/`unanswered`) nunca vira zero. Só
  `zero_confirmed` é zero de verdade. Veja `response-state.ts`.
- Antes de considerar algo pronto: `pnpm lint`, `pnpm typecheck`,
  `pnpm test`, `pnpm build` — todos devem passar sem desabilitar checagens.
