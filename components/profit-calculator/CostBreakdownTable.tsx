import { Card } from "@/components/ui/Card";
import { type CostBreakdownRow } from "@/lib/profit-calculator";
import { formatCurrency } from "@/lib/utils";

type CostBreakdownTableProps = {
  rows: CostBreakdownRow[];
};

const typeStyles: Record<CostBreakdownRow["type"], string> = {
  income: "text-slate-900 font-semibold",
  fee: "text-amber-700",
  cost: "text-slate-700",
  tax: "text-purple-700",
  total: "text-slate-900 font-semibold bg-slate-50/80",
  result: "text-emerald-700 font-bold bg-emerald-50/50",
};

export function CostBreakdownTable({ rows }: CostBreakdownTableProps) {
  return (
    <Card title="Cost Breakdown" subtitle="Detailed view of all charges and costs">
      <div className="overflow-x-auto -mx-5 -mb-5">
        <table className="w-full min-w-[480px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Item
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Details
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr
                key={row.label}
                className={`transition-colors hover:bg-slate-50/50 ${
                  row.type === "result" && row.value < 0
                    ? "bg-red-50/50"
                    : row.type === "total" || row.type === "result"
                      ? typeStyles[row.type]
                      : ""
                }`}
              >
                <td className="px-5 py-3.5">
                  <span
                    className={`text-sm ${row.type === "result" || row.type === "total" ? "font-semibold" : "font-medium text-slate-900"}`}
                  >
                    {row.label}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs text-slate-400">{row.note ?? "—"}</td>
                <td
                  className={`px-5 py-3.5 text-right text-sm ${
                    row.type === "result" && row.value < 0
                      ? "font-bold text-red-600 bg-red-50/50"
                      : typeStyles[row.type]
                  }`}
                >
                  {row.type === "income" || row.type === "result"
                    ? formatCurrency(row.value)
                    : row.value === 0
                      ? "—"
                      : `− ${formatCurrency(row.value)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
