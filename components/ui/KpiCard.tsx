type KpiCardProps = {
  label: string;
  value: string;
  change?: number;
  trend?: "up" | "down";
  invertTrend?: boolean;
  subtitle?: string;
};

export function KpiCard({ label, value, change, trend = "up", invertTrend = false, subtitle }: KpiCardProps) {
  const isPositive = invertTrend ? trend === "down" : trend === "up";

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        {value}
      </p>
      {change !== undefined ? (
      <div className="mt-3 flex items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
            isPositive
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {trend === "up" ? (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          ) : (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          )}
          {Math.abs(change)}%
        </span>
        <span className="text-xs text-slate-400">vs last month</span>
      </div>
      ) : subtitle ? (
        <p className="mt-3 text-xs text-slate-400">{subtitle}</p>
      ) : null}
    </div>
  );
}
