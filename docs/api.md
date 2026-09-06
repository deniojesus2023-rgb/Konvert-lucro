# API do Raio-X do Lucro (Fase 1B)

Todas as rotas são same-origin, respondem JSON e mandam
`Cache-Control: no-store`. Não há CORS aberto e não existe autenticação de
usuário nesta fase — o que autoriza cada operação está descrito em
[Autorização](#autorização).

## Autorização

Existem **dois** tipos de credencial, com poderes diferentes e sem
nenhuma relação matemática entre si:

| Credencial | Onde vive | O que autoriza |
|---|---|---|
| Segredo de sessão | Cookie `konvert_raiox_session` (httpOnly, SameSite=Lax, Path=/, Secure em produção, 30 dias) | **Escrever** e ler o próprio rascunho. O banco guarda só o SHA-256. |
| Token de resultado | URL pública (`/resultado/{token}`) | **Ler** um resultado concluído. 256 bits, não deriva do segredo. |

Conhecer o UUID de um diagnóstico não autoriza nada. Sempre que a sessão
não confere, a resposta é **404** (nunca 401/403), para não permitir
enumerar diagnósticos existentes.

O WhatsApp **não** é credencial: não existe (e não vai existir nesta fase)
nenhuma forma de recuperar diagnósticos digitando o número de novo.

## Erros

```json
{ "error": { "code": "version_conflict", "message": "…", "details": { "currentVersion": 3 } } }
```

| `code` | HTTP | Quando |
|---|---|---|
| `not_found` | 404 | Não existe, ou a sessão não é dona dele. |
| `unsupported_media_type` | 415 | `Content-Type` não é `application/json`. |
| `invalid_json` | 400 | Corpo não é JSON válido. |
| `payload_too_large` | 413 | Corpo acima de 64 KB. |
| `invalid_origin` | 403 | `Origin` presente e diferente de `APP_ORIGIN`. |
| `validation_failed` | 422 | Zod rejeitou o payload (só caminhos e mensagens, nunca os valores enviados). |
| `version_conflict` | 409 | `expectedVersion` desatualizado; `details.currentVersion` traz a versão real. |
| `already_completed` | 409 | Tentou alterar um diagnóstico concluído (PATCH), ou finalizá-lo de novo sem que exista um `resultToken` para recuperar — um caso de inconsistência de dados, não o retry normal (que recebe 200, ver `finalize`). |
| `not_completed` | 409 | Tentou revisar um diagnóstico ainda em rascunho. |
| `incomplete_diagnostic` | 422 | Falta alguma etapa; `details.missingFields` lista quais. |
| `rate_limited` | 429 | Limitador em memória (só desenvolvimento — ver README). |
| `internal_error` | 500 | Erro inesperado. A resposta e o log só carregam uma mensagem fixa e um `details.correlationId` aleatório para correlacionar os dois — nunca a mensagem original, stack, causa, SQL ou dado do usuário (que podem estar embutidos no erro de um driver). |

## Rotas

### `POST /api/raio-x`

Cria um rascunho anônimo e emite o cookie de sessão.

**201**
```json
{ "id": "uuid", "status": "draft", "answersVersion": 0 }
```

Nunca devolve `resultToken` (ele só existe após a finalização) nem o
segredo da sessão.

---

### `GET /api/raio-x/[id]`

Lê o próprio rascunho — é o que permite retomar de onde parou. Exige a
sessão.

**200**
```json
{
  "id": "uuid",
  "status": "draft",
  "answersVersion": 3,
  "deliveryType": "hamburgueria",
  "mainChannel": "ifood",
  "taxClassification": "variable",
  "sourceDiagnosticId": null,
  "completedAt": null,
  "answers": {
    "revenue": { "kind": "informed", "value": 5000000 },
    "cost_fees": { "kind": "range", "min": 500000, "max": null },
    "cost_delivery": { "kind": "unknown" }
  }
}
```

Nunca inclui hash de sessão nem qualquer segredo. Quando o diagnóstico já
está `completed` (e a sessão é a mesma que o concluiu), a resposta também
traz `resultPath` (ex.: `/raio-x/resultado/…`) — permite que o navegador
que só guardou o `id` localmente (a resposta do `finalize` foi perdida, ou
o usuário só reabriu `/raio-x` depois) va direto para o resultado sem
pedir nome/WhatsApp de novo. `resultPath` nunca aparece para uma sessão
inválida, e o payload continua sem `leadId`, nome, WhatsApp ou
consentimento.

---

### `PATCH /api/raio-x/[id]/answers`

Salva uma etapa, sob versionamento otimista.

```json
{
  "expectedVersion": 2,
  "answers": {
    "revenue": { "kind": "informed", "value": 5000000 },
    "cost_production": { "kind": "estimated", "origin": "range", "value": 1500,
                          "range": { "min": 1000, "max": 2000 } },
    "cost_fees": { "kind": "range", "min": 500000, "max": null },
    "orders": { "kind": "informed", "value": 1000 }
  },
  "taxClassification": "variable",
  "profile": { "deliveryType": "hamburgueria", "mainChannel": "ifood" }
}
```

Chaves válidas: `revenue`, `cost_production`, `cost_fees`, `cost_delivery`,
`cost_fixed_structure`, `taxes`, `orders`, `goal`.

Estados aceitos: `informed`, `range` (com `max: null` = faixa aberta),
`estimated` (`origin: "typed"` ou `origin: "range"` com ponto médio
coerente — o servidor recalcula), `unknown`, `zero_confirmed`,
`unanswered`.

**200** `{ "answersVersion": 3 }` — a versão sobe **uma vez** por
requisição aceita, independente de quantos campos vieram.

**409** quando a versão está velha, com `details.currentVersion`. É o que
impede uma requisição atrasada de sobrescrever uma resposta mais nova.

---

### `POST /api/raio-x/[id]/finalize`

Fecha o diagnóstico e emite o token público. Tudo em uma transação.

```json
{
  "expectedVersion": 3,
  "idempotencyKey": "uuid-gerado-uma-vez-no-cliente",
  "contact": {
    "name": "Maria da Silva",
    "whatsapp": "(11) 98888-7777",
    "contactConsent": true,
    "marketingOptIn": false,
    "consentTextVersion": "2026-09-06.v1"
  }
}
```

`contactConsent` precisa ser `true` (é a base legal para guardar o
contato). `marketingOptIn` é independente e recusá-lo **não** bloqueia o
resultado.

**200**
```json
{ "resultToken": "…43 chars…", "resultPath": "/raio-x/resultado/…", "alreadyFinalized": false }
```

Repetir a chamada devolve o mesmo token com `alreadyFinalized: true`, sem
criar um segundo lead, consentimento ou resultado — **mesmo que a
`idempotencyKey` seja diferente da original**. Isso é proposital: se a
transação foi confirmada no servidor mas a resposta não chegou ao
navegador (conexão caiu, página recarregou), o cliente só tem, na
tentativa seguinte, uma `idempotencyKey` nova que acabou de gerar. Como o
cookie de sessão já prova que quem está chamando é o dono do diagnóstico,
isso basta para devolver o `resultToken` existente — a alternativa seria
travar o próprio dono do lado de fora do resultado dele. Uma sessão
diferente da que criou o diagnóstico continua recebendo 404, chave igual
ou não.

---

### `GET /api/raio-x/resultado/[token]`

Consulta pública, somente leitura. Não usa cookie.

**200**
```json
{
  "formulaVersion": "1.1.0",
  "calculatedAt": "2026-09-06T12:00:00.000Z",
  "deliveryType": "hamburgueria",
  "mainChannel": "ifood",
  "result": { "…ProfitResult completo…": "…" }
}
```

O payload não contém `lead_id`, nome, WhatsApp, consentimento — nem o UUID
do diagnóstico. Token inexistente, malformado, revogado ou expirado:
**404**, todos indistinguíveis entre si.

---

### `POST /api/raio-x/[id]/revise`

Abre uma revisão de um diagnóstico concluído. Exige a sessão dele.

**201**
```json
{ "id": "novo-uuid", "status": "draft", "answersVersion": 0, "sourceDiagnosticId": "uuid-anterior" }
```

Cria um rascunho novo com as respostas copiadas, aponta
`source_diagnostic_id` para o anterior (foreign key real para
`diagnostics.id`, `ON DELETE RESTRICT` — o PostgreSQL rejeita tanto um
UUID que não existe quanto apagar um diagnóstico que ainda tem revisão) e
**troca o cookie** pelo segredo do novo rascunho. O resultado anterior e o
link dele continuam válidos e inalterados para sempre; ao finalizar a
revisão nasce um segundo resultado,
com token próprio.

---

### `POST /api/raio-x/events`

Registra um evento do funil. Payload fechado por schema — só os nomes de
evento documentados e quatro chaves de `metadata` são aceitos; qualquer
outra coisa (incluindo uma tentativa de mandar `resultToken`, `name` ou
`whatsapp` dentro de `metadata`) é rejeitada com 422, antes de tocar o
banco.

```json
{
  "eventName": "diagnostic_step_completed",
  "diagnosticId": "uuid-opcional",
  "metadata": { "step": 2, "durationMs": 4500, "source": "wizard" }
}
```

Eventos aceitos: `landing_viewed`, `diagnostic_started`,
`diagnostic_step_viewed`, `diagnostic_step_completed`,
`diagnostic_completed`, `result_viewed`, `offer_viewed`,
`checkout_clicked`. Chaves de `metadata` aceitas: `step`, `durationMs`,
`resultMode`, `source`.

Usa um cookie **anônimo e separado** (`konvert_funnel_sid`) do cookie de
sessão do diagnóstico — não concede nenhum acesso de leitura/escrita, só
agrupa eventos do mesmo navegador. **204** sem corpo em caso de sucesso.
