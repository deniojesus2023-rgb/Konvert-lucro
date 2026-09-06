# Konvert

SaaS para donos de delivery descobrirem e acompanharem o lucro real da
operação. Esta é a **Fase 1A**: fundação técnica + motor financeiro do
diagnóstico "Raio-X do Lucro". Não há banco de dados, API, autenticação ou
telas comerciais ainda — apenas o app Next.js mínimo e o domínio de cálculo,
totalmente testado.

## Requisitos

- Node.js 22+
- pnpm 10+

## Rodando localmente

```bash
pnpm install
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000). A aplicação sobe sem
precisar de banco de dados ou de nenhuma credencial externa.

## Scripts

| Comando | O que faz |
|---|---|
| `pnpm dev` | Sobe o servidor de desenvolvimento. |
| `pnpm build` | Gera o build de produção. |
| `pnpm start` | Roda o build de produção. |
| `pnpm lint` | ESLint. |
| `pnpm typecheck` | `tsc --noEmit` em modo strict. |
| `pnpm test` | Roda a suíte de testes (Vitest). |

## Estrutura relevante desta fase

```
src/
├── app/                       # Next.js App Router — só a home mínima por enquanto
├── domain/
│   ├── money/                 # Cents: tipo de dinheiro, parsing, arredondamento, aritmética segura
│   └── diagnostic/            # Motor de cálculo do "Raio-X do Lucro" (puro, sem I/O)
│       └── formulas/          # Ponto de equilíbrio e ranking de custos
```

O domínio (`src/domain/`) não importa nada de React ou do App Router — é
testável isoladamente e é o que vai ser reaproveitado quando a interface do
diagnóstico, o banco e a API forem construídos nas próximas fases.

Veja [`docs/formulas.md`](./docs/formulas.md) para a documentação de cada
cálculo e suas regras de borda.

## Identidade visual

Tokens de cor e a tipografia da marca estão em `src/app/globals.css`
(`@theme` do Tailwind 4). Nenhuma logo foi adicionada — a logo oficial entra
como arquivo em uma fase futura, sem ser redesenhada aqui.

## O que NÃO está nesta entrega

Banco de dados, migrations, APIs, autenticação, sessões, o diagnóstico
visual (wizard), a landing comercial, checkout, assinaturas e qualquer
integração externa. Isso fica para as fases seguintes.
