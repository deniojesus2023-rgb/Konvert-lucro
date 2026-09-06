# Konvert

SaaS para donos de delivery descobrirem e acompanharem o lucro real da
operação.

Estado atual: **Fase 1B** — motor financeiro (1A) + banco, persistência,
segurança e APIs do diagnóstico "Raio-X do Lucro". Ainda **não** existem
telas: landing, wizard, tela de resultado, oferta, checkout, assinatura e
autenticação de usuário ficam para a Fase 1C em diante.

## Requisitos

- Node.js 22+
- pnpm 10+
- PostgreSQL 16+ (para rodar a API e os testes de integração)

## Instalação

```bash
pnpm install
cp .env.example .env.local   # e preencha as variáveis
```

### Variáveis de ambiente

| Variável | Obrigatória | Para quê |
|---|---|---|
| `DATABASE_URL` | Sim, em runtime | Banco da aplicação. |
| `TEST_DATABASE_URL` | Sim, para `test:integration` | Banco de testes (separado). |
| `APP_ORIGIN` | Não | Origem esperada no header `Origin` das rotas de escrita. Sem ela, usa a origem da própria requisição. |
| `CONSENT_TEXT_VERSION` | Não | Versão do texto de consentimento registrada em cada consentimento. |

As variáveis são validadas com Zod de forma **lazy** (`src/lib/env.ts`), por
requisição — `pnpm build` continua funcionando em máquina sem banco e sem
`.env`. Nunca comite credenciais reais.

## PostgreSQL de teste

```bash
pnpm db:test:up     # sobe o banco de teste
pnpm db:test:down   # derruba
```

O script usa **Docker** (`docker-compose.test.yml`) quando o daemon está
disponível e, quando não está, sobe um **cluster PostgreSQL local**
(`initdb`/`pg_ctl` em `.tmp/pgdata`, porta 55432). Nos dois casos os testes
rodam contra um PostgreSQL real — SQLite, banco em memória e driver mockado
nunca substituem isso.

Ambos expõem a mesma URL:

```
postgres://konvert:konvert@127.0.0.1:55432/konvert_test
```

## Migrations

```bash
pnpm db:generate   # gera SQL a partir de src/server/db/schema.ts
pnpm db:migrate    # aplica no DATABASE_URL
```

As migrations SQL versionadas ficam em `src/server/db/migrations/`. Os
testes de integração aplicam as migrations automaticamente antes de rodar.

## Testes

```bash
pnpm test               # unitários (sem banco, sem rede)
pnpm test:integration   # integração contra PostgreSQL real
pnpm test:all           # os dois
```

`pnpm test:integration` **falha com mensagem clara** se `TEST_DATABASE_URL`
não estiver definida — testes de integração nunca são pulados em silêncio.

```bash
export TEST_DATABASE_URL=postgres://konvert:konvert@127.0.0.1:55432/konvert_test
pnpm test:integration
```

Os testes de integração chamam os Route Handlers reais com `NextRequest`
reais, através de um cliente com cookie jar — cookies, validação, status e
headers são exercitados como um navegador faria.

## Outros scripts

| Comando | O que faz |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento. |
| `pnpm build` | Build de produção (não precisa de banco). |
| `pnpm start` | Roda o build. |
| `pnpm lint` | ESLint. |
| `pnpm typecheck` | `next typegen` + `tsc --noEmit` em modo strict. |

## Arquitetura

```
src/
├── app/api/raio-x/        Route Handlers: HTTP, cookies, status, headers
├── server/
│   ├── db/                schema Drizzle, client lazy, codec de dinheiro
│   ├── repositories/      consultas Drizzle
│   ├── services/          regras de aplicação e transações
│   ├── security/          cookie de sessão, rate limit
│   └── http/              guards de JSON/Origin/tamanho, erros padronizados
├── lib/
│   ├── validation/        schemas Zod + normalização de respostas
│   └── env.ts             validação lazy do ambiente
└── domain/                cálculo puro — sem React, Next, banco ou rede
```

Regra dura: nenhuma regra financeira nas rotas, e `src/domain/` nunca
importa Next.js, banco ou rede. Ver [`docs/formulas.md`](./docs/formulas.md)
para as fórmulas e [`docs/api.md`](./docs/api.md) para as rotas.

### Modelo de sessão

Duas credenciais, sem relação matemática entre si:

- **Segredo de sessão** — autoriza escrever no próprio rascunho. Vive só no
  cookie `konvert_raiox_session` (httpOnly, SameSite=Lax, Path=/, Secure em
  produção, **30 dias**). O banco guarda apenas o SHA-256; um dump do banco
  não dá acesso de escrita a nada.
- **Token de resultado** — 256 bits, autoriza apenas ler um resultado
  concluído. Não deriva do segredo, e o segredo não deriva dele.

Conhecer o UUID de um diagnóstico não autoriza nada. Sessão inválida
responde **404**, nunca 401/403, para não permitir enumeração. O WhatsApp
não é prova de identidade e não recupera diagnósticos.

### Versionamento otimista

Cada rascunho tem `answers_version`. O `PATCH` manda o `expectedVersion`
que o cliente viu; a checagem vive no `WHERE` do `UPDATE`, então é o
PostgreSQL que decide o vencedor de uma corrida. Uma requisição atrasada
casa com zero linhas e recebe 409 com a versão atual — nunca sobrescreve
uma resposta mais nova. A versão sobe exatamente uma vez por requisição
aceita.

### Idempotência da finalização

A finalização roda numa transação única com `SELECT … FOR UPDATE` (serializa
chamadas simultâneas) e uma `finalize_idempotency_key` com índice único. Um
duplo clique ou um retry de rede devolve **o mesmo token**, sem criar um
segundo lead, consentimento ou resultado. Qualquer falha no meio faz
rollback completo: ou existe tudo, ou não existe nada.

Repetir a chamada devolve o mesmo token **mesmo com uma `idempotencyKey`
diferente da original**, desde que a sessão seja a mesma — isso cobre o
caso em que o servidor concluiu a transação mas a resposta nunca chegou ao
navegador (a página recarrega e gera uma chave nova antes de tentar de
novo). O cookie de sessão já prova a propriedade, então é o que basta:
travar o dono do lado de fora do próprio resultado seria pior do que
recuperar. Uma sessão diferente da que criou o diagnóstico continua
recebendo 404, chave igual ou não.

### Revisão imutável

Um diagnóstico concluído nunca é reescrito. `POST /revise` cria um rascunho
**novo**, com as respostas copiadas, `source_diagnostic_id` apontando para o
anterior — uma foreign key real para `diagnostics.id` com `ON DELETE
RESTRICT`, então o PostgreSQL rejeita tanto um UUID de origem inexistente
quanto a exclusão de um diagnóstico que ainda tem uma revisão apontando
para ele — e um segredo de sessão novo (o cookie é trocado). Ao finalizar a
revisão nasce um segundo resultado com token próprio, e o link antigo
continua resolvendo exatamente para os números antigos — para sempre.

### Consentimento

O consentimento de contato é obrigatório (base legal para guardar
nome/WhatsApp) e é sempre carimbado. O opt-in de marketing é **separado**,
começa desmarcado e recusá-lo nunca bloqueia o resultado.

## Limitações conhecidas

- **Rate limiter em memória**: `src/server/security/rate-limit.ts` é um
  paliativo de desenvolvimento. Os contadores vivem na memória de um único
  processo, então ele **não protege produção**: cada instância/invocação
  serverless tem o próprio mapa, o limite efetivo se multiplica pelo número
  de instâncias e zera a cada cold start. Ele também confia em
  `x-forwarded-for`, que é falsificável sem um proxy confiável na frente.
  Proteção real exige store compartilhado (Redis/Upstash) ou regra de
  edge/WAF — fora do escopo desta fase.
- **Expiração/revogação de token** existem no schema e são respeitadas na
  leitura, mas nenhuma rota as define ainda (não há painel para isso).
- **`funnel_events`**: a tabela e o guard de metadata existem e são
  testados, mas nenhuma rota emite eventos — isso entra com a interface, na
  Fase 1C.
- **Sem telas e sem autenticação de usuário**: tudo nesta fase é API.
