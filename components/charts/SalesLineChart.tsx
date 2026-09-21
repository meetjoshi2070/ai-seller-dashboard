"use client";

import { formatCurrency } from "@/lib/utils";

const PADDING = { top: 20, right: 20, bottom: 40, left: 60 };
const WIDTH = 600;
const HEIGHT = 260;

type SalesLineChartProps = {
  data: { label: string; sales: number }[];
};

export function SalesLineChart({ data }: SalesLineChartProps) {
  if (data.length === 0) {
    return <div className="flex h-[260px] items-center justify-center text-sm text-slate-500">No imported sales data available.</div>;
  }

  const maxValue = Math.max(...data.map((d) => d.sales), 1) * 1.1;
  const chartWidth = WIDTH - PADDING.left - PADDING.right;
  const chartHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const points = data.map((d, i) => {
    const x = data.length === 1
      ? PADDING.left + chartWidth / 2
      : PADDING.left + (i / (data.length - 1)) * chartWidth;
    const y = PADDING.top + chartHeight - (d.sales / maxValue) * chartHeight;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${PADDING.top + chartHeight} L ${points[0].x} ${PADDING.top + chartHeight} Z`;

  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => (maxValue / yTicks) * i);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full min-w-[400px]"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTickValues.map((val, i) => {
          const y = PADDING.top + chartHeight - (val / maxValue) * chartHeight;
          return (
            <g key={i}>
              <line
                x1={PADDING.left}
                y1={y}
                x2={WIDTH - PADDING.right}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
              <text
                x={PADDING.left - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-400 text-[10px]"
              >
                {formatCurrency(val).replace("₹", "₹")}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill="url(#salesGradient)" />
        <path
          d={linePath}
          fill="none"
          stroke="#f97316"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill="#fff" stroke="#f97316" strokeWidth={2} />
            <text
              x={p.x}
              y={HEIGHT - 10}
              textAnchor="middle"
              className="fill-slate-500 text-[10px]"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
