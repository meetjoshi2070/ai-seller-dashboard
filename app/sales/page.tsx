"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import type { SalesRow } from "@/lib/sales-import";
import { formatCurrency, formatNumber } from "@/lib/utils";

type SortField = "product" | "asin" | "units" | "sales" | "averagePrice";

type SalesSync = {
  rows?: SalesRow[];
  fileName?: string;
  syncedAt?: string;
};

export default function SalesPage() {
  const [salesRows, setSalesRows] = useState<SalesRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("sales");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    try {
      const savedSales = localStorage.getItem("amazon_sales_sync");

      if (!savedSales) return;

      const parsed = JSON.parse(savedSales) as SalesSync;

      if (!Array.isArray(parsed.rows)) return;

      setSalesRows(parsed.rows);
      setFileName(parsed.fileName ?? "");
      setSyncedAt(parsed.syncedAt ?? null);
    } catch (error) {
      console.error("Sales Analysis load error:", error);
    }
  }, []);

  const summary = useMemo(() => {
    const totalSales = salesRows.reduce(
      (sum, row) => sum + (Number(row.orderedProductSales) || 0),
      0,
    );
    const totalUnitsSold = salesRows.reduce(
      (sum, row) => sum + (Number(row.unitsOrdered ?? row.unitsSold) || 0),
      0,
    );

    return {
      totalSales,
      totalUnitsSold,
      averageSellingPrice:
        totalUnitsSold > 0 ? totalSales / totalUnitsSold : 0,
    };
  }, [salesRows]);

  const sortedRows = useMemo(() => {
    return salesRows
      .map((row) => {
        const unitsSold = Number(row.unitsOrdered ?? row.unitsSold) || 0;
        const salesAmount = Number(row.orderedProductSales) || 0;

        return {
          ...row,
          unitsSold,
          salesAmount,
          averagePrice: unitsSold > 0 ? salesAmount / unitsSold : 0,
        };
      })
      .sort((a, b) => {
        let comparison = 0;

        switch (sortField) {
          case "product":
            comparison = (a.title ?? "").localeCompare(b.title ?? "");
            break;
          case "asin":
            comparison = (a.asin ?? "").localeCompare(b.asin ?? "");
            break;
          case "units":
            comparison = a.unitsSold - b.unitsSold;
            break;
          case "sales":
            comparison = a.salesAmount - b.salesAmount;
            break;
          case "averagePrice":
            comparison = a.averagePrice - b.averagePrice;
            break;
        }

        return sortDirection === "asc" ? comparison : -comparison;
      });
  }, [salesRows, sortDirection, sortField]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection(field === "product" || field === "asin" ? "asc" : "desc");
  };

  const sortLabel = (field: SortField) =>
    sortField === field ? (sortDirection === "asc" ? " ↑" : " ↓") : "";

  return (
    <DashboardLayout
      title="Sales Analysis"
      subtitle="Review imported Amazon sales and product performance"
      activeNav="Sales"
      showActions={false}
    >
      <div className="space-y-6">
        {fileName && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm">
            <p className="font-medium text-emerald-700">Amazon sales data loaded.</p>
            <p className="mt-1 text-emerald-600">
              {salesRows.length} ASINs imported
              {syncedAt && ` • ${new Date(syncedAt).toLocaleString("en-IN")}`}
            </p>
            <p className="mt-1 text-xs text-emerald-600">File: {fileName}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total Sales" value={formatCurrency(summary.totalSales)} />
          <SummaryCard label="Total Units Sold" value={formatNumber(summary.totalUnitsSold)} />
          <SummaryCard
            label="Order Count"
            value="Not available"
            subtitle="The imported report provides units, not order count."
          />
          <SummaryCard
            label="Average Selling Price"
            value={formatCurrency(summary.averageSellingPrice)}
            subtitle="Total sales ÷ units sold"
          />
        </div>

        <Card
          title="Product Sales"
          subtitle="Sales and units aggregated by ASIN from the imported Amazon report"
        >
          {sortedRows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">
              <p className="text-sm font-medium text-slate-700">No sales data imported yet.</p>
              <p className="mt-1 text-sm text-slate-500">
                Upload an Amazon Sales and Traffic Report from the Products page to view sales analysis here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5 -mb-5">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs uppercase tracking-wider text-slate-500">
                    <SortableHeader label="Product" field="product" onSort={handleSort} indicator={sortLabel("product")} />
                    <SortableHeader label="ASIN" field="asin" onSort={handleSort} indicator={sortLabel("asin")} />
                    <SortableHeader label="Units Sold" field="units" onSort={handleSort} indicator={sortLabel("units")} align="right" />
                    <SortableHeader label="Sales Amount" field="sales" onSort={handleSort} indicator={sortLabel("sales")} align="right" />
                    <SortableHeader label="Avg. Selling Price" field="averagePrice" onSort={handleSort} indicator={sortLabel("averagePrice")} align="right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedRows.map((row) => (
                    <tr key={row.asin} className="transition-colors hover:bg-slate-50/50">
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-900">
                        {row.title || "Untitled Product"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
                          {row.asin || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm text-slate-700">
                        {formatNumber(row.unitsSold)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm font-medium text-slate-900">
                        {formatCurrency(row.salesAmount)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm text-slate-700">
                        {formatCurrency(row.averagePrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

function SummaryCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}

function SortableHeader({
  label,
  field,
  onSort,
  indicator,
  align = "left",
}: {
  label: string;
  field: SortField;
  onSort: (field: SortField) => void;
  indicator: string;
  align?: "left" | "right";
}) {
  return (
    <th className={`px-5 py-3 ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className="font-semibold hover:text-slate-900"
      >
        {label}{indicator}
      </button>
    </th>
  );
}
