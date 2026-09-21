type ResultCardProps = {
  label: string;
  value: string;
  variant?: "default" | "positive" | "negative" | "neutral";
  subtitle?: string;
};

const variantStyles = {
  default: "text-slate-900",
  positive: "text-emerald-600",
  negative: "text-red-600",
  neutral: "text-slate-900",
};

export function ResultCard({
  label,
  value,
  variant = "default",
  subtitle,
}: ResultCardProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold tracking-tight sm:text-3xl ${variantStyles[variant]}`}>
        {value}
      </p>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}
