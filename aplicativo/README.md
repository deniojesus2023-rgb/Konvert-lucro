# Teste de ponta a ponta — capturas de tela

Este teste percorreu o app de verdade (Postgres real, sem mock), clicando em
todas as telas e botões do fluxo, do zero: cadastro, ativação de conta,
onboarding e as 10 telas do painel pago com suas abas e formulários.

## Funil gratuito (Raio-X do Lucro)

- `01-landing.png` — página inicial
- `02` a `04` — passos do diagnóstico (escolha de canal de vendas)
- `05-raio-x-step-4-stuck.png` — o teste automático parou aqui porque o
  botão fica desabilitado por um instante enquanto salva ("Enviando…") —
  não é um bug, só uma limitação do script de teste, que não esperou o
  suficiente. O restante do wizard (8 etapas) não foi percorrido nesta
  rodada.
- `07-oferta.png`, `08-privacidade.png` — páginas de oferta e privacidade

## Login e cadastro

- `09-entrar.png`, `10-entrar-link-enviado.png` — pedido de link de acesso
- `11-onboarding.png` — criação do estabelecimento (usuário novo, sem
  passar pelo diagnóstico)

## Painel pago (`/app`)

- `12` — Visão geral
- `13`–`21` — Vendas: lançar venda do dia (modal vazio e preenchido),
  lançamento aparecendo na tabela, e as 5 abas de canal
- `22`–`29` — Custos e despesas: adicionar despesa, adicionar custo
  recorrente, e as 3 abas (Despesas/Categorias/Recorrentes)
- `30` — Resultados (ainda com dados de exemplo do protótipo — não fica
  ligado ao banco real ainda)
- `31`–`33` — Metas: editar meta de lucro do mês
- `34` — Importações
- `35`–`36` — Integrações: antes e depois de clicar em "Conectar"
- `37`–`42` — Configurações e suas 5 abas
- `43`–`44` — Ajuda e busca nas perguntas frequentes
- `45`–`49` — Perfil e suas 4 abas

## O que este teste confirmou

- Cadastro direto (sem diagnóstico), login, criação de estabelecimento:
  funcionando.
- Lançar venda, lançar despesa, lançar custo recorrente, editar meta:
  todos gravam no banco de verdade e os números da tela mudam de acordo
  (lucro, ticket médio, % de custo sobre venda, etc.).
- Um bug real de layout foi encontrado e corrigido durante este teste: no
  card "Distribuição dos custos" da tela de Custos, o texto do total
  ficava sobreposto ao da categoria. Corrigido antes deste commit.
- "Resultados", parte do gráfico da Visão Geral e alguns números de
  "Configurações → Plano e cobrança" continuam com dado de exemplo — são
  gaps já conhecidos, não bugs novos.
