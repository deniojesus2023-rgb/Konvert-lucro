# Konvert — sequência das referências visuais

Este pacote contém 18 telas, cada uma nas versões `desktop` e `mobile`.

As imagens servem como referência visual para a implementação. A interface deve ser reconstruída com componentes reais; não use os PNGs como fundo das páginas.

## Fluxo principal

| Ordem | Tela | Quando aparece |
| --- | --- | --- |
| 01 | Landing page | Entrada do funil |
| 02 | Tipo de delivery | Início do diagnóstico |
| 03 | Canais de pedidos | Depois do tipo de delivery |
| 04 | Faturamento | Início dos dados financeiros |
| 05 | Quantidade de pedidos | Depois do faturamento |
| 06 | Custo de produção | Ingredientes e embalagens |
| 07 | Taxas das vendas | Aplicativos, cartões, cupons e comissões |
| 08 | Custos de entrega | Motoboys e logística |
| 09 | Custos de estrutura | Custos fixos e operacionais |
| 10 | Valor dos impostos | Valor pago em impostos |
| 11 | Classificação dos impostos | Fixo ou variável; pode ser condicional |
| 12 | Meta de lucro | Meta desejada pelo dono do delivery |
| 13 | Dados de contato | Nome, WhatsApp e consentimentos |
| 14 | Processamento | Cálculo e preparação do resultado |
| 15 | Resultado completo | Quando os dados permitem calcular as métricas |
| 17 | Oferta e assinatura | Depois da apresentação do resultado |

## Ramificações

- `16_resultado_parcial`: substitui a tela 15 quando faltam dados essenciais. Não aparece depois do resultado completo.
- `18_politica_privacidade`: página auxiliar aberta pelos links de privacidade da landing ou do formulário de contato. Não é uma etapa obrigatória do fluxo linear.
- A classificação de impostos da tela 11 pode ser exibida somente quando houver valor de impostos informado e a classificação for necessária.

## Ordem resumida

```text
01 Landing
→ 02 Tipo de delivery
→ 03 Canais de pedidos
→ 04 Faturamento
→ 05 Quantidade de pedidos
→ 06 Produção
→ 07 Taxas das vendas
→ 08 Entrega
→ 09 Estrutura
→ 10 Impostos
→ 11 Classificação dos impostos
→ 12 Meta
→ 13 Contato e consentimento
→ 14 Processamento
→ 15 Resultado completo OU 16 Resultado parcial
→ 17 Oferta
```

A tela 18 de privacidade é acessada por link e pode retornar ao ponto anterior.

## Arquivos

Cada número possui dois arquivos:

- `_desktop.png`: referência para telas grandes.
- `_mobile.png`: referência para celulares.

Nos tamanhos intermediários, preserve a mesma hierarquia e adapte o layout de forma fluida. Não crie uma terceira identidade visual para tablet.
