"use client";

import { formatCurrency } from "@/lib/utils";

const PADDING = { top: 20, right: 20, bottom: 40, left: 60 };
const WIDTH = 600;
const HEIGHT = 260;

type ProfitBarChartProps = {
  data: { label: string; profit: number }[];
};

export function ProfitBarChart({ data }: ProfitBarChartProps) {
  if (data.length === 0) {
    return <div className="flex h-[260px] items-center justify-center text-sm text-slate-500">Net profit requires sales, listings, COGS, and an Amazon fee profile.</div>;
  }

  const maxValue = Math.max(...data.map((d) => Math.abs(d.profit)), 1) * 1.15;
  const chartWidth = WIDTH - PADDING.left - PADDING.right;
  const chartHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const barWidth = (chartWidth / data.length) * 0.6;
  const barGap = (chartWidth / data.length) * 0.4;

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
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
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
                {formatCurrency(val)}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const barHeight = (Math.max(d.profit, 0) / maxValue) * chartHeight;
          const x = PADDING.left + i * (barWidth + barGap) + barGap / 2;
          const y = PADDING.top + chartHeight - barHeight;

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill="url(#barGradient)"
                className="transition-opacity hover:opacity-80"
              />
              <text
                x={x + barWidth / 2}
                y={HEIGHT - 10}
                textAnchor="middle"
                className="fill-slate-500 text-[10px]"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
