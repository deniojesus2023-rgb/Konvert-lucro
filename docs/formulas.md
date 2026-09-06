# Fórmulas do motor financeiro (`src/domain/diagnostic/`)

Todo valor monetário é um inteiro de centavos (`Cents`, ver
`src/domain/money/cents.ts`). Nenhuma operação usa ponto flutuante para
dinheiro; multiplicações que podem exceder `Number.MAX_SAFE_INTEGER` passam
por `BigInt` (`src/domain/money/arithmetic.ts`).

## Os seis estados de resposta

Cada entrada do diagnóstico (`ResponseState<T>`, em `response-state.ts`) é
um dos seis estados abaixo. Só os três primeiros são "resolvidos" (geram um
valor usável nos cálculos):

| Estado | Valor usável? | Observação |
|---|---|---|
| `informed` | Sim | Valor exato digitado pelo usuário. |
| `estimated` | Sim | Ponto médio de uma faixa **fechada**, guardado junto com a faixa original. |
| `zero_confirmed` | Sim (= 0) | "Não tenho esse custo" — o único zero legítimo. |
| `range` (com `max: null`) | Não | Faixa **aberta** ("mais de X") — não tem ponto médio calculável. |
| `unknown` | Não | "Não sei". |
| `unanswered` | Não | Pergunta ainda não respondida. |

`unknown` e `unanswered` nunca são tratados como zero em nenhuma soma —
eles geram uma entrada em `blindSpots`, não um número.

## Entradas (`DiagnosticInput`)

- `revenue`: faturamento bruto de vendas (valor cobrado do cliente, antes
  de qualquer desconto do aplicativo — nunca o repasse líquido).
- `costs.production`: ingredientes + embalagens.
- `costs.fees`: comissões, taxas de pagamento, cupons subsidiados e
  estornos/cancelamentos — descontados **uma única vez**, só aqui.
- `costs.delivery`: motoboys e taxas de entrega pagas pelo estabelecimento.
- `costs.fixedStructure`: custos fixos, incluindo pró-labore quando pago
  (tratado como parte da folha, nunca como distribuição de lucro).
- `taxes`: `{ classification: "fixed" | "variable" | "unclassified", state }`
  — valor informado pelo usuário, nunca uma alíquota presumida. A
  classificação decide se o imposto entra no custo fixo ou variável para o
  ponto de equilíbrio; `"unclassified"` significa "só sei o total".
- `orders`: quantidade de pedidos no período.
- `goal`: quanto o dono gostaria que sobrasse no mês.

`revenue` e os quatro grupos de `costs` são os **grupos obrigatórios**
(`REQUIRED_COST_GROUPS`, em `constants.ts`) para um lucro confirmado.

## Saídas (`ProfitResult`)

### Custos conhecidos e saldo antes dos custos não informados

`knownCostsTotalCents` soma **o que estiver resolvido**, mesmo que
parcial (nem todos os grupos precisam estar resolvidos). A partir disso:

```
balanceBeforeUnknownCosts = revenue - knownCostsTotalCents
```

Calculado sempre que a receita for conhecida, **independente** de faltar
algum custo. Nunca é chamado de lucro — é literalmente "o que sobra dos
custos que você já contou", com os pontos cegos (`blindSpots`) explícitos ao
lado.

### Lucro antes de impostos

Só confirmado se `revenue` **e os quatro grupos obrigatórios** estiverem
resolvidos:

```
variableCosts = production + fees + delivery
totalCosts    = variableCosts + fixedStructure
profitBeforeTaxes = revenue - totalCosts
```

Caso contrário: `unavailable`, motivo `missing_revenue` ou
`missing_required_costs`.

### Lucro (depois de impostos) — a cifra principal

Requer `profitBeforeTaxes` confirmado **e** os impostos resolvidos:

```
profit = profitBeforeTaxes - taxes
```

Impostos desconhecidos bloqueiam só esta cifra (motivo `missing_taxes`),
mesmo que o lucro antes de impostos já esteja disponível. Prejuízo (`profit`
negativo) é um resultado **válido**, não um erro — e todo resultado carrega
`selfReportedDisclaimer: true`: é sempre uma estimativa autodeclarada, nunca
lucro auditado, mesmo com tudo preenchido.

### Margem e sobra por R$100

Só confirmadas se `profit` estiver confirmado e `revenue > 0`:

```
marginBps            = round(profit * 10_000 / revenue)   // 2000 = 20,00%
takeHomePer100Cents  = round(profit * 10_000 / revenue)   // 2000 = R$20,00 (em centavos!)
```

As duas fórmulas são numericamente idênticas (ambas escalam por 10.000) —
mantidas como campos separados por clareza semântica na UI, não por
diferença de cálculo. `takeHomePer100Cents` é sempre expresso **em
centavos**: R$20 de sobra por R$100 vendidos é `2000`, nunca `20`.
`revenue === 0` → `unavailable` (`zero_revenue`), nunca `Infinity`/`NaN`.

### Lucro médio por pedido

Requer `profit` confirmado e `orders` resolvido e diferente de zero:

```
profitPerOrder = round(profit / orders)
```

Pedidos desconhecidos bloqueiam **só** esta métrica (e o ponto de
equilíbrio em pedidos) — nunca as métricas baseadas em receita.

### Ponto de equilíbrio (`formulas/break-even.ts`)

Pré-condições (calculadas em `calculate-profit.ts` antes de chamar
`computeBreakEven`): `revenue` e os 4 grupos obrigatórios resolvidos,
impostos resolvidos e, se o valor do imposto for maior que zero,
**classificados** como fixo ou variável (`unclassified` com imposto > 0 →
`unavailable`, motivo `unclassified_taxes` — o lucro continua calculável,
só o equilíbrio fica indisponível).

```
variableCosts = production + fees + delivery + (taxes, se variável)
fixedCosts    = fixedStructure + (taxes, se fixo)
contribution  = revenue - variableCosts
```

Se `contribution <= 0` → `unavailable` (`non_positive_contribution_margin`)
para as duas métricas abaixo. Caso contrário:

```
breakEvenRevenue = round(fixedCosts * revenue / contribution)
breakEvenOrders  = ceil(fixedCosts * orders / contribution)     // só se orders > 0 conhecido
```

`breakEvenOrders` é sempre arredondado **para cima** (não existe pedido
parcial). As duas fórmulas assumem que a composição de vendas e de custos do
período se mantém — uma hipótese de simulação, não uma previsão.

Ambas as multiplicações (`fixedCosts * revenue`, `fixedCosts * orders`)
passam por `BigInt` (`mulDivRound`/`mulDivCeil`) porque podem superar
`Number.MAX_SAFE_INTEGER` quando os valores de entrada se aproximam do
teto de R$10.000.000,00 por campo.

### Diferença para a meta

Requer `profit` confirmado e `goal` resolvido:

```
gapToGoal = goal - profit
```

Negativo = meta já superada (nunca chamado de "lucro perdido" ou erro).
Meta desconhecida bloqueia só esta comparação.

### Maiores grupos de custo

`topCostBuckets` (`formulas/cost-buckets.ts`) ordena, do maior para o menor,
só os grupos **resolvidos** (incluindo impostos, se resolvidos) e retorna os
3 maiores. Grupos desconhecidos nunca entram no ranking nem contam como
zero — aparecem só em `blindSpots`.

## Caso de teste obrigatório

Receita R$50.000, custos variáveis R$30.000 (produção+taxas+entrega),
custos fixos R$10.000, impostos explicitamente zero, 1.000 pedidos:

| Métrica | Esperado |
|---|---|
| Lucro | R$10.000 |
| Margem | 20% (`marginBps = 2000`) |
| Lucro por pedido | R$10 |
| Sobra por R$100 | R$20 → `takeHomePer100Cents = 2000` |
| Equilíbrio em receita | R$25.000 |
| Equilíbrio em pedidos | 500 |

Variações obrigatórias adicionais (ver
`src/domain/diagnostic/calculate-profit.test.ts`): +R$4.000 de imposto
variável (lucro R$6.000, equilíbrio R$31.250 / 625 pedidos); +R$4.000 de
imposto fixo (lucro R$6.000, equilíbrio R$35.000 / 700 pedidos); custos e
impostos desconhecidos; receita e pedidos iguais a zero; prejuízo; meta já
superada; faixas abertas e fechadas.
