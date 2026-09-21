"use client";

import { useEffect, useMemo, useState } from "react";

export default function AlertsPage() {
    const [salesRows, setSalesRows] = useState<Record<string, unknown>[]>([]);
    const [inventoryRows, setInventoryRows] = useState<Record<string, unknown>[]>([]);
    const [ppcRows, setPpcRows] = useState<Record<string, unknown>[]>([]);
    const [listingsRows, setListingsRows] = useState<Record<string, unknown>[]>([]);
    useEffect(() => {
        try {
          const savedSales = localStorage.getItem("amazon_sales_sync");
          if (savedSales) {
            const parsed = JSON.parse(savedSales);
            setSalesRows(Array.isArray(parsed) ? parsed : parsed.rows ?? []);
          }
    
          const savedInventory = localStorage.getItem("amazon_inventory_sync");
          if (savedInventory) {
            const parsed = JSON.parse(savedInventory);
            setInventoryRows(Array.isArray(parsed) ? parsed : parsed.rows ?? []);
          }
    
          const savedPpc = localStorage.getItem("seller-dashboard-search-terms");
          if (savedPpc) {
            const parsed = JSON.parse(savedPpc);
            setPpcRows(Array.isArray(parsed) ? parsed : []);
          }
          const savedListings = localStorage.getItem("amazon_listings_sync");
if (savedListings) {
  const parsed = JSON.parse(savedListings);
  setListingsRows(
    Array.isArray(parsed) ? parsed : parsed.rows ?? []
  );
}
        } catch {
          setSalesRows([]);
          setInventoryRows([]);
          setPpcRows([]);
        }
      }, []);
      const alertSummary = useMemo(() => {
        const outOfStock = inventoryRows.filter((row) => {
          const quantity = Number(
            row["Quantity"] ?? row["quantity"] ?? row["Available"] ?? row["available"] ?? 0
          );
          return quantity <= 0;
        }).length;
    
        const noSales = inventoryRows.filter((row) => {
          const quantity = Number(
            row["Quantity"] ?? row["quantity"] ?? row["Available"] ?? row["available"] ?? 0
          );
          const unitsSold = Number(
            row["Units Sold"] ?? row["unitsSold"] ?? row["Units Ordered"] ?? row["unitsOrdered"] ?? 0
          );
          return quantity > 0 && unitsSold <= 0;
        }).length;
    
        const wastedPpc = ppcRows.filter((row) => {
          const spend = Number(
            row["spend"] ?? row["Total cost"] ?? row["Cost"] ?? 0
          );
          const sales = Number(
            row["sales"] ?? row["Sales"] ?? row["Sales (promoted)"] ?? 0
          );
          return spend > 0 && sales <= 0;
        }).length;
        const lowMargin = listingsRows.filter((row) => {
            const sellingPrice = Number(
              row["sellingPrice"] ?? row["Selling Price"] ?? 0
            );
          
            const productCost = Number(
              row["productCost"] ?? row["Product Cost"] ?? 0
            );
          
            if (sellingPrice <= 0 || productCost <= 0) {
              return false;
            }
          
            const margin =
              ((sellingPrice - productCost) / sellingPrice) * 100;
          
            return margin < 20;
          }).length;
    
        return {
          outOfStock,
          noSales,
          wastedPpc,
          lowMargin,
          total: outOfStock + noSales + wastedPpc + lowMargin,
          salesRows: salesRows.length,
        };
    }, [salesRows, inventoryRows, ppcRows, listingsRows]);
      const alertItems = useMemo(
        () => [
          {
            type: "Inventory",
            severity: alertSummary.outOfStock > 0 ? "Critical" : "Normal",
            title: "Out of Stock",
            description:
              alertSummary.outOfStock > 0
                ? `${alertSummary.outOfStock} product${
                    alertSummary.outOfStock === 1 ? "" : "s"
                  } currently have no available stock.`
                : "No products are currently out of stock.",
            count: alertSummary.outOfStock,
            action: "View Inventory",
            href: "/inventory",
          },
          {
            type: "Inventory",
            severity: alertSummary.noSales > 0 ? "Warning" : "Normal",
            title: "Stock With No Sales",
            description:
              alertSummary.noSales > 0
                ? `${alertSummary.noSales} product${
                    alertSummary.noSales === 1 ? "" : "s"
                  } have stock but no recorded sales.`
                : "No stocked products are currently without sales.",
            count: alertSummary.noSales,
            action: "Review Inventory",
            href: "/inventory",
          },
          {
            type: "PPC",
            severity: alertSummary.wastedPpc > 0 ? "Warning" : "Normal",
            title: "PPC Waste",
            description:
              alertSummary.wastedPpc > 0
                ? `${alertSummary.wastedPpc} search term${
                    alertSummary.wastedPpc === 1 ? "" : "s"
                  } have ad spend without attributed sales.`
                : "No PPC waste alerts are currently detected.",
                count: alertSummary.wastedPpc,
                action: "Review PPC",
                href: "/ppc",
              },
              {
                type: "Profit",
                severity: alertSummary.lowMargin > 0 ? "Warning" : "Normal",
                title: "Low Margin Products",
                description:
                  alertSummary.lowMargin > 0
                    ? `${alertSummary.lowMargin} product${
                        alertSummary.lowMargin === 1 ? "" : "s"
                      } have a product margin below 20%.`
                    : "No low-margin products are currently detected.",
                count: alertSummary.lowMargin,
                action: "Review Products",
                href: "/profit-calculator",
              },
            ],
            [alertSummary]
          );
      return (
        <main className="min-h-screen bg-slate-50 p-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">
                Alerts
              </h1>
      
              <p className="mt-1 text-sm text-slate-500">
                Important sales, inventory, profit and PPC alerts requiring attention.
              </p>
            </div>
      
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Total Alerts
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {alertSummary.total}
                </p>
                <p className="mt-1 text-xs text-slate-500">
  Issues requiring attention
</p>
              </div>
      
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Out of Stock
                </p>
                <p className="mt-2 text-2xl font-bold text-red-600">
                  {alertSummary.outOfStock}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Products requiring replenishment
                </p>
              </div>
      
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  No Sales
                </p>
                <p className="mt-2 text-2xl font-bold text-yellow-600">
                  {alertSummary.noSales}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Products with stock but no sales
                </p>
              </div>
      
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  PPC Waste
                </p>
                <p className="mt-2 text-2xl font-bold text-orange-600">
                  {alertSummary.wastedPpc}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Search terms spending without sales
                </p>
              </div>
              <div className="rounded-xl bg-white p-5 shadow-sm">
  <p className="text-sm font-medium text-slate-500">
    Low Margin
  </p>
  <p className="mt-2 text-2xl font-bold text-red-600">
    {alertSummary.lowMargin}
  </p>
  <p className="mt-1 text-xs text-slate-500">
    Products below 20% margin
  </p>
</div>
            </div>
      
            <div className="space-y-4">
              {alertItems.map((alert) => (
                <div
                  key={alert.title}
                  className="rounded-xl bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-500">
                          {alert.type}
                        </span>
      
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            alert.severity === "Critical"
                              ? "bg-red-100 text-red-700"
                              : alert.severity === "Warning"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>
      
                      <h2 className="mt-2 text-lg font-semibold text-slate-900">
                        {alert.title}
                      </h2>
      
                      <p className="mt-1 text-sm text-slate-500">
                        {alert.description}
                      </p>
                    </div>
      
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">
                        {alert.count}
                      </p>
                      <p className="text-xs text-slate-500">
                        Alerts
                      </p>
                    </div>
                  </div>
      
                  <div className="mt-4">
                    <a
                      href={alert.href}
                      className="inline-flex rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-100"
                    >
                      {alert.action}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      );
}