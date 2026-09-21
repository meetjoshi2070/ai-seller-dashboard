import { lowStockProducts, type Product } from "@/lib/dummy-data";
import type { InventoryStatus } from "@/lib/inventory-analysis";
import { formatNumber } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

type LowStockTableProps = {
  products?: (Product & { inventoryStatus?: InventoryStatus })[];
};

function StockBadge({ stock, status }: { stock: number; status?: InventoryStatus }) {
  if (status) {
    const statusStyles: Record<InventoryStatus, string> = {
      "Out of Stock": "bg-red-50 text-red-700 ring-red-600/20",
      "No Sales": "bg-slate-100 text-slate-700 ring-slate-600/20",
      Critical: "bg-red-50 text-red-700 ring-red-600/20",
      "Low Stock": "bg-amber-50 text-amber-700 ring-amber-600/20",
      Watch: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
      Healthy: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
      Overstock: "bg-blue-50 text-blue-700 ring-blue-600/20",
    };

    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusStyles[status]}`}>
        {status} · {formatNumber(stock)}
      </span>
    );
  }

  const level =
    stock <= 5 ? "critical" : stock <= 10 ? "low" : "warning";

  const styles = {
    critical: "bg-red-50 text-red-700 ring-red-600/20",
    low: "bg-amber-50 text-amber-700 ring-amber-600/20",
    warning: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
  };

  const labels = {
    critical: "Critical",
    low: "Low",
    warning: "Warning",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[level]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${level === "critical" ? "bg-red-500" : level === "low" ? "bg-amber-500" : "bg-yellow-500"}`} />
      {labels[level]} · {formatNumber(stock)}
    </span>
  );
}

export function LowStockTable({ products = lowStockProducts }: LowStockTableProps) {
  return (
    <Card title="Low Stock Alerts" subtitle="Products that need restocking">
      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center text-sm text-slate-500">
          No low-stock items found in the imported inventory data.
        </div>
      ) : (
      <div className="overflow-x-auto -mx-5 -mb-5">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Product
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                SKU
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Category
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Units Sold
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Stock Level
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => (
              <tr key={product.id} className="transition-colors hover:bg-slate-50/50">
                <td className="px-5 py-3.5">
                  <p className="text-sm font-medium text-slate-900">{product.name}</p>
                </td>
                <td className="px-5 py-3.5">
                  <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
                    {product.sku}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-500">{product.category}</td>
                <td className="px-5 py-3.5 text-right text-sm text-slate-700">
                  {formatNumber(product.unitsSold)}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <StockBadge stock={product.stock} status={product.inventoryStatus} />
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
