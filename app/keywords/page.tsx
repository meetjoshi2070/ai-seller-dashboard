"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { formatCurrency, formatNumber, formatPercent, formatRatio } from "@/lib/utils";

type SearchTermRow = {
  searchTerm: string;
  campaign: string;
  adGroup: string;
  matchType: string;
  impressions: number;
  clicks: number;
  spend: number;
  sales: number;
  orders: number;
};

type SortField = "searchTerm" | "spend" | "sales" | "clicks" | "acos" | "roas";

export default function KeywordsPage() {
  const [searchTerms, setSearchTerms] = useState<SearchTermRow[]>([]);
  const [sortField, setSortField] = useState<SortField>("spend");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    try {
      const savedSearchTerms = localStorage.getItem("seller-dashboard-search-terms");

      if (!savedSearchTerms) return;

      const parsed = JSON.parse(savedSearchTerms);

      if (Array.isArray(parsed)) {
        setSearchTerms(parsed);
      }
    } catch (error) {
      console.error("Keywords Analysis load error:", error);
    }
  }, []);

  const keywordRows = useMemo(
    () =>
      searchTerms
        .filter((term) => term.searchTerm?.trim())
        .map((term) => {
          const spend = Number(term.spend) || 0;
          const sales = Number(term.sales) || 0;
          const clicks = Number(term.clicks) || 0;

          return {
            ...term,
            spend,
            sales,
            clicks,
            acos: sales > 0 ? (spend / sales) * 100 : 0,
            roas: spend > 0 ? sales / spend : 0,
            hasWastedSpend: spend > 0 && sales === 0,
          };
        }),
    [searchTerms],
  );

  const summary = useMemo(() => {
    const totalSpend = keywordRows.reduce((sum, term) => sum + term.spend, 0);
    const totalSales = keywordRows.reduce((sum, term) => sum + term.sales, 0);
    const totalClicks = keywordRows.reduce((sum, term) => sum + term.clicks, 0);

    return {
      totalSpend,
      totalSales,
      totalClicks,
      acos: totalSales > 0 ? (totalSpend / totalSales) * 100 : 0,
      roas: totalSpend > 0 ? totalSales / totalSpend : 0,
    };
  }, [keywordRows]);

  const sortedRows = useMemo(() => {
    return [...keywordRows].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "searchTerm":
          comparison = a.searchTerm.localeCompare(b.searchTerm);
          break;
        case "spend":
          comparison = a.spend - b.spend;
          break;
        case "sales":
          comparison = a.sales - b.sales;
          break;
        case "clicks":
          comparison = a.clicks - b.clicks;
          break;
        case "acos":
          comparison = a.acos - b.acos;
          break;
        case "roas":
          comparison = a.roas - b.roas;
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [keywordRows, sortDirection, sortField]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection(field === "searchTerm" ? "asc" : "desc");
  };

  const sortLabel = (field: SortField) =>
    sortField === field ? (sortDirection === "asc" ? " ↑" : " ↓") : "";

  return (
    <DashboardLayout
      title="Keywords Analysis"
      subtitle="Review performance from imported Amazon PPC search terms"
      activeNav="Keywords"
      showActions={false}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard label="Search Terms" value={formatNumber(keywordRows.length)} />
          <SummaryCard label="Total Spend" value={formatCurrency(summary.totalSpend)} />
          <SummaryCard label="Total Sales" value={formatCurrency(summary.totalSales)} />
          <SummaryCard label="Total Clicks" value={formatNumber(summary.totalClicks)} />
          <SummaryCard
            label="ACOS"
            value={summary.totalSales > 0 ? formatPercent(summary.acos) : "—"}
            subtitle="Total spend ÷ total sales"
          />
          <SummaryCard
            label="ROAS"
            value={summary.totalSpend > 0 ? formatRatio(summary.roas) : "—"}
            subtitle="Total sales ÷ total spend"
          />
        </div>

        <Card
          title="Search Term Performance"
          subtitle="Search terms with spend but no sales are flagged for review"
        >
          {sortedRows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">
              <p className="text-sm font-medium text-slate-700">No PPC search-term data imported yet.</p>
              <p className="mt-1 text-sm text-slate-500">
                Import an Amazon Search Term Report on the PPC page to view keyword analysis here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5 -mb-5">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs uppercase tracking-wider text-slate-500">
                    <SortableHeader label="Search Term" field="searchTerm" onSort={handleSort} indicator={sortLabel("searchTerm")} />
                    <SortableHeader label="Clicks" field="clicks" onSort={handleSort} indicator={sortLabel("clicks")} align="right" />
                    <SortableHeader label="Spend" field="spend" onSort={handleSort} indicator={sortLabel("spend")} align="right" />
                    <SortableHeader label="Sales" field="sales" onSort={handleSort} indicator={sortLabel("sales")} align="right" />
                    <SortableHeader label="ACOS" field="acos" onSort={handleSort} indicator={sortLabel("acos")} align="right" />
                    <SortableHeader label="ROAS" field="roas" onSort={handleSort} indicator={sortLabel("roas")} align="right" />
                    <th className="px-5 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedRows.map((term) => (
                    <tr key={`${term.searchTerm}-${term.campaign}-${term.adGroup}`} className="transition-colors hover:bg-slate-50/50">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-slate-900">{term.searchTerm}</p>
                        {(term.campaign || term.adGroup) && (
                          <p className="mt-0.5 text-xs text-slate-400">
                            {[term.campaign, term.adGroup].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm text-slate-700">{formatNumber(term.clicks)}</td>
                      <td className="px-5 py-3.5 text-right text-sm text-slate-700">{formatCurrency(term.spend)}</td>
                      <td className="px-5 py-3.5 text-right text-sm font-medium text-slate-900">{formatCurrency(term.sales)}</td>
                      <td className="px-5 py-3.5 text-right text-sm text-slate-700">
                        {term.sales > 0 ? formatPercent(term.acos) : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm text-slate-700">
                        {term.spend > 0 ? formatRatio(term.roas) : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {term.hasWastedSpend ? (
                          <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                            Spend, no sales
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            Monitor
                          </span>
                        )}
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
