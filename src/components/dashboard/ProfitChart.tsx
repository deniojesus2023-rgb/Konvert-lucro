import { profitChartRevenue } from "./data";

/** Ported verbatim from the prototype's inline IIFE that builds `#profit-chart`. */
export function ProfitChart() {
  const revenue = profitChartRevenue;
  const costs = revenue.map((v) => v * 0.68);
  const profit = revenue.map((v, i) => v - costs[i]);
  const w = 900;
  const h = 220;
  const pad = 30;
  const n = revenue.length;
  const maxV = Math.max(...revenue);
  const x = (i: number) => pad + (i * (w - 2 * pad)) / (n - 1);
  const yFor = (v: number) => h - pad - (v / maxV) * (h - 2 * pad);
  const bw = ((w - 2 * pad) / n) * 0.55;

  const bars = revenue.flatMap((v, i) => {
    const cx = x(i);
    return [
      <rect key={`rev-${i}`} x={cx - bw / 2} y={yFor(v)} width={bw} height={h - pad - yFor(v)} fill="#AFC7FA" rx={2} />,
      <rect key={`cost-${i}`} x={cx - bw / 2} y={yFor(costs[i])} width={bw} height={h - pad - yFor(costs[i])} fill="#C7CEDC" rx={2} opacity={0.9} />,
    ];
  });

  const pts = profit.map((v, i) => `${x(i)},${yFor(v)}`).join(" ");

  return (
    <div style={{ marginTop: 10 }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 220 }}>
        {bars}
        <polyline points={pts} fill="none" stroke="#1BA24E" strokeWidth={2.5} />
        {profit.map((v, i) => (
          <circle key={`pt-${i}`} cx={x(i)} cy={yFor(v)} r={3} fill="#1BA24E" />
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
        <span>01/06</span>
        <span>05/06</span>
        <span>10/06</span>
        <span>15/06</span>
        <span>20/06</span>
        <span>25/06</span>
        <span>30/06</span>
      </div>
    </div>
  );
}
