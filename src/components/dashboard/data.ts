/**
 * Static demo data, ported verbatim from the HTML prototype's inline
 * arrays. Values are exactly what the prototype showed — this is a visual
 * conversion, not a re-wire to real data yet.
 */

export interface VendaRow {
  pedido: string;
  dataHora: string;
  cliente: string;
  canal: string;
  itens: string;
  valor: string;
  status: "Entregue" | "Cancelado";
}

export const vendas: VendaRow[] = [
  { pedido: "#1000", dataHora: "30/06 19:42", cliente: "João Silva", canal: "iFood", itens: "2 itens", valor: "R$ 45,00", status: "Entregue" },
  { pedido: "#0999", dataHora: "30/06 18:21", cliente: "Ana Costa", canal: "WhatsApp", itens: "3 itens", valor: "R$ 62,00", status: "Entregue" },
  { pedido: "#0998", dataHora: "30/06 17:50", cliente: "Pedro Santos", canal: "Balcão", itens: "1 item", valor: "R$ 28,00", status: "Entregue" },
  { pedido: "#0997", dataHora: "30/06 16:33", cliente: "Juliana Lima", canal: "iFood", itens: "2 itens", valor: "R$ 54,00", status: "Cancelado" },
  { pedido: "#0996", dataHora: "30/06 15:12", cliente: "Carlos Souza", canal: "Delivery próprio", itens: "4 itens", valor: "R$ 80,00", status: "Entregue" },
  { pedido: "#0995", dataHora: "30/06 14:05", cliente: "Mariana Alves", canal: "WhatsApp", itens: "2 itens", valor: "R$ 36,00", status: "Entregue" },
  { pedido: "#0994", dataHora: "30/06 12:48", cliente: "Rafael Lima", canal: "Balcão", itens: "1 item", valor: "R$ 22,00", status: "Entregue" },
  { pedido: "#0993", dataHora: "30/06 11:20", cliente: "Fernanda Rocha", canal: "iFood", itens: "3 itens", valor: "R$ 66,00", status: "Entregue" },
];

export const vendasPaginas = ["1", "2", "3", "4", "5", "…", "›"];

export interface CustoRow {
  data: string;
  descricao: string;
  categoria: string;
  valor: string;
}

export const custos: CustoRow[] = [
  { data: "28/06/2026", descricao: "Compra de ingredientes", categoria: "Produção e embalagens", valor: "R$ 2.500,00" },
  { data: "27/06/2026", descricao: "Taxa iFood", categoria: "Taxas das vendas", valor: "R$ 1.300,00" },
  { data: "26/06/2026", descricao: "Combustível", categoria: "Entregas", valor: "R$ 300,00" },
  { data: "25/06/2026", descricao: "Salário entregadores", categoria: "Entregas", valor: "R$ 1.800,00" },
  { data: "24/06/2026", descricao: "Aluguel", categoria: "Estrutura e impostos", valor: "R$ 2.000,00" },
  { data: "23/06/2026", descricao: "Conta de energia", categoria: "Estrutura e impostos", valor: "R$ 450,00" },
  { data: "22/06/2026", descricao: "Materiais de limpeza", categoria: "Produção e embalagens", valor: "R$ 220,00" },
  { data: "21/06/2026", descricao: "Internet", categoria: "Estrutura e impostos", valor: "R$ 150,00" },
];

export interface MetaRow {
  nome: string;
  tipo: string;
  valorMeta: string;
  valorAtual: string;
  progresso: number;
}

export const metas: MetaRow[] = [
  { nome: "Receita mensal", tipo: "Financeira", valorMeta: "R$ 60.000,00", valorAtual: "R$ 48.000,00", progresso: 80 },
  { nome: "Quantidade de pedidos", tipo: "Operacional", valorMeta: "1.200", valorAtual: "800", progresso: 67 },
  { nome: "Ticket médio", tipo: "Financeira", valorMeta: "R$ 55,00", valorAtual: "R$ 50,00", progresso: 91 },
  { nome: "Margem de lucro", tipo: "Financeira", valorMeta: "25%", valorAtual: "20%", progresso: 60 },
  { nome: "Reduzir cancelamentos", tipo: "Operacional", valorMeta: "5%", valorAtual: "8%", progresso: 40 },
];

export interface ImportacaoRow {
  dataHora: string;
  origem: string;
  periodo: string;
  registros: string;
  status: "Concluída" | "Erro";
  usuario: string;
}

export const importacoes: ImportacaoRow[] = [
  { dataHora: "30/06/2026 18:22", origem: "iFood", periodo: "01/06 – 30/06", registros: "1.000", status: "Concluída", usuario: "Mariana Costa" },
  { dataHora: "28/06/2026 14:10", origem: "WhatsApp", periodo: "25/06 – 28/06", registros: "320", status: "Concluída", usuario: "Mariana Costa" },
  { dataHora: "25/06/2026 09:15", origem: "Arquivo CSV", periodo: "24/06 – 24/06", registros: "150", status: "Concluída", usuario: "Mariana Costa" },
  { dataHora: "20/06/2026 16:40", origem: "Anota Aí", periodo: "18/06 – 20/06", registros: "560", status: "Concluída", usuario: "Mariana Costa" },
  { dataHora: "15/06/2026 11:30", origem: "Arquivo CSV", periodo: "01/06 – 15/06", registros: "780", status: "Erro", usuario: "Mariana Costa" },
];

export interface IntegracaoItem {
  ico: "ico-ifood" | "ico-anota" | "ico-whats" | "";
  letter: string;
  name: string;
  desc: string;
  on: boolean;
  sync?: string;
  file?: boolean;
}

export const integList: IntegracaoItem[] = [
  { ico: "ico-ifood", letter: "if", name: "iFood", desc: "Importe automaticamente seus pedidos, produtos e clientes do iFood.", on: true, sync: "28/06/2026 às 14:20" },
  { ico: "ico-anota", letter: "A", name: "Anota Aí", desc: "Sincronize seus pedidos e cardápio do Anota Aí.", on: false },
  { ico: "ico-whats", letter: "W", name: "WhatsApp", desc: "Integre seu WhatsApp para automação e vendas.", on: true, sync: "28/06/2026 às 13:50" },
  { ico: "", letter: "📄", name: "Arquivo CSV", desc: "Importe suas vendas por planilha (CSV ou Excel).", on: false, file: true },
];

export const faqs: [string, string][] = [
  ["Como conectar o iFood?", "Acesse Integrações, clique em Conectar no card do iFood e siga as instruções de autorização."],
  ["Como importar minhas vendas?", "Vá até Importações, escolha a origem (iFood, WhatsApp, Anota Aí ou arquivo CSV) e siga o passo a passo."],
  ["Como configurar as metas?", "Na aba Metas, clique em Nova meta e defina o tipo, valor e período desejado."],
  ["Como funciona o relatório de resultados?", "A aba Resultados reúne receita, custos, lucro e margem, com gráficos de evolução diária."],
  ["Posso usar mais de um delivery?", "Sim, você pode alternar entre deliveries pelo seletor no topo da barra lateral."],
  ["Como alterar meu plano?", "Acesse Configurações › Plano e cobrança e clique em Gerenciar plano."],
  ["Como falar com o suporte?", "Use o botão Falar com o suporte na aba Ajuda para abrir um chat com nossa equipe."],
];

export interface SessionRow {
  device: string;
  location: string;
  current: boolean;
}

export const sessions: SessionRow[] = [
  { device: "Navegador Chrome - Windows", location: "São Paulo, SP · 28/06/2026 às 14:20", current: true },
  { device: "iPhone - iOS", location: "São Paulo, SP · 27/06/2026 às 10:15", current: false },
  { device: "Navegador Safari - Mac", location: "São Paulo, SP · 25/06/2026 às 08:32", current: false },
];

/** Ported from the prototype's IIFE that builds the profit chart's SVG. */
export const profitChartRevenue: number[] = [
  1.2, 1.6, 1.8, 1.9, 2.1, 3.6, 4.2, 3.0, 2.6, 2.4, 2.8, 3.0, 2.6, 2.4, 2.2, 2.0,
  2.4, 2.6, 2.8, 3.0, 3.4, 3.8, 3.6, 3.4, 3.2, 3.6, 3.8, 4.0, 4.2, 4.4,
];
