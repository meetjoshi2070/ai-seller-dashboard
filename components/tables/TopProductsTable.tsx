import { topProducts, type Product } from "@/lib/dummy-data";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

type TopProductsTableProps = {
  products?: Product[];
  profitAvailable?: boolean;
};

export function TopProductsTable({ products = topProducts, profitAvailable = true }: TopProductsTableProps) {
  return (
    <Card title="Top Selling Products" subtitle="Best performers this month">
      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center text-sm text-slate-500">
          No imported sales data available.
        </div>
      ) : (
      <div className="overflow-x-auto -mx-5 -mb-5">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Product
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                SKU
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Units Sold
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Revenue
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Profit
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Stock
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product, index) => (
              <tr key={product.id} className="transition-colors hover:bg-slate-50/50">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-orange-50 text-xs font-bold text-orange-600">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-400">{product.category}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
                    {product.sku}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right text-sm text-slate-700">
                  {formatNumber(product.unitsSold)}
                </td>
                <td className="px-5 py-3.5 text-right text-sm font-medium text-slate-900">
                  {formatCurrency(product.revenue)}
                </td>
                <td className="px-5 py-3.5 text-right text-sm font-medium text-emerald-600">
                  {profitAvailable ? formatCurrency(product.profit) : "—"}
                </td>
                <td className="px-5 py-3.5 text-right text-sm text-slate-700">
                  {formatNumber(product.stock)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </Card>
  );
}
