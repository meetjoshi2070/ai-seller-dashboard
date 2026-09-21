"use client";

import { useEffect, useMemo, useState } from "react";
import {
    getProductCost,
    loadProductCosts,
    type ProductCost,
  } from "@/lib/product-costs";

export default function AIInsightsPage() {
    const [salesRows, setSalesRows] = useState<Record<string, unknown>[]>([]);
    const [inventoryRows, setInventoryRows] = useState<Record<string, unknown>[]>([]);
    const [ppcRows, setPpcRows] = useState<Record<string, unknown>[]>([]);
    const [listingsRows, setListingsRows] = useState<Record<string, unknown>[]>([]);
    const [productCosts, setProductCosts] =
  useState<ProductCost[]>([]);
    useEffect(() => {
        try {
            const loadedProductCosts = loadProductCosts();
setProductCosts(loadedProductCosts);
          const salesSaved = localStorage.getItem("amazon_sales_sync");
          const inventorySaved = localStorage.getItem("amazon_inventory_sync");
          const listingsSaved = localStorage.getItem("amazon_listings_sync");

if (listingsSaved) {
  const parsed = JSON.parse(listingsSaved);
  setListingsRows(
    Array.isArray(parsed?.rows) ? parsed.rows : []
  );

  console.log("AI LISTINGS FIRST ROW:", parsed?.rows?.[0]);
  console.log(
    "AI LISTINGS COLUMNS:",
    parsed?.rows?.[0] ? Object.keys(parsed.rows[0]) : []
  );
}
          const ppcSaved = localStorage.getItem("seller-dashboard-search-terms");
          
          if (salesSaved) {
            const parsed = JSON.parse(salesSaved);
            setSalesRows(Array.isArray(parsed?.rows) ? parsed.rows : []);
          }
    
          if (inventorySaved) {
            const parsed = JSON.parse(inventorySaved);
            setInventoryRows(Array.isArray(parsed?.rows) ? parsed.rows : []);
          }
    
          if (ppcSaved) {
            const parsed = JSON.parse(ppcSaved);
            setPpcRows(Array.isArray(parsed) ? parsed : []);
          }
          if (listingsSaved) {
            const parsed = JSON.parse(listingsSaved);
            setListingsRows(
              Array.isArray(parsed?.rows) ? parsed.rows : []
            );
          }
        } catch (error) {
          console.error("AI Insights data load error:", error);
        }
      }, []);
      const insights = useMemo(() => {
       
        const getNumber = (value: unknown) => {
          if (typeof value === "number") return value;
          if (typeof value !== "string") return 0;
      
          const cleaned = value.replace(/[^0-9.-]/g, "");
          const parsed = Number(cleaned);
      
          return Number.isFinite(parsed) ? parsed : 0;
        };
      
        const salesProducts = salesRows
          .map((row) => {
            const productName = String(
                row["title"] ?? "Unknown Product"
              );
      
              const unitsSold = getNumber(row["unitsOrdered"]);

              const sales = getNumber(row["orderedProductSales"]);
      
            return {
              productName,
              unitsSold,
              sales,
            };
          })
          .filter((item) => item.unitsSold > 0 || item.sales > 0)
          .sort((a, b) => {
            if (b.unitsSold !== a.unitsSold) {
              return b.unitsSold - a.unitsSold;
            }
      
            return b.sales - a.sales;
          });
      
        const topSeller = salesProducts[0];
        const profitableProducts = listingsRows
  .map((item) => {
    const sellingPrice = getNumber(item.sellingPrice);
    const sku = String(item.sku ?? "");

    const productCost = getProductCost(productCosts, sku);

    const profit = sellingPrice - productCost;
    const margin =
      sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

    return {
      sku,
      productName: String(item.productName ?? "Unknown Product"),
      sellingPrice,
      productCost,
      profit,
      margin,
    };
  })
  .filter(
    (item) =>
      item.sellingPrice > 0 &&
      item.productCost > 0
  )
  .sort((a, b) => b.margin - a.margin);

const topProfitProduct = profitableProducts[0];
const wastedPpcTerms = ppcRows
  .map((item) => {
    const searchTerm = String(
      item.searchTerm ?? item["Search Term"] ?? ""
    );

    const spend = getNumber(
      item.spend ?? item["Total cost"] ?? item["Cost"]
    );

    const sales = getNumber(
      item.sales ?? item["Sales"] ?? item["Sales (promoted)"]
    );

    return {
      searchTerm,
      spend,
      sales,
    };
  })
  .filter(
    (item) =>
      item.searchTerm &&
      item.spend > 0 &&
      item.sales <= 0
  )
  .sort((a, b) => b.spend - a.spend);

const topWastedPpcTerm = wastedPpcTerms[0];

  
  

 
        return [
          {
            title: "Sales Opportunity",
            description: topSeller
  ? `${topSeller.productName} is your strongest seller with ${topSeller.unitsSold} units sold. Consider maintaining healthy stock and protecting its visibility.`
  : "No sales product data is currently available.",
            priority: topSeller ? "High" : "Medium",
          },
          {
            
                title: "Profit Opportunity",
                description: topProfitProduct
                ? `${topProfitProduct.productName} has the highest product margin at ${topProfitProduct.margin.toFixed(1)}%. Selling price is ₹${topProfitProduct.sellingPrice}, product cost is ₹${topProfitProduct.productCost}, giving approximately ₹${topProfitProduct.profit.toFixed(0)} profit per unit. Consider protecting its margin and prioritizing it for profitable growth.`
                : "Identify products with strong product margins and opportunities to improve profitability.",
                priority:
                  topProfitProduct && topProfitProduct.margin >= 70
                    ? "High"
                    : topProfitProduct && topProfitProduct.margin >= 40
                    ? "Medium"
                    : "Low",
              },
          {
            title: "Inventory Risk",
            description:
              inventoryRows.length > 0
                ? (() => {
                    const outOfStock = inventoryRows.filter((row) => {
                      const quantity = getNumber(
                        row["Quantity"] ??
                          row["quantity"] ??
                          row["Available"] ??
                          row["available"]
                      );
          
                      return quantity <= 0;
                    }).length;
          
                    const noSales = inventoryRows.filter((row) => {
                      const quantity = getNumber(
                        row["Quantity"] ??
                          row["quantity"] ??
                          row["Available"] ??
                          row["available"]
                      );
          
                      const unitsSold = getNumber(
                        row["Units Sold"] ??
                          row["Units Ordered"] ??
                          row["unitsSold"]
                      );
          
                      return quantity > 0 && unitsSold === 0;
                    }).length;
          
                    if (outOfStock > 0) {
                        return `${outOfStock} ${
                          outOfStock === 1 ? "product is" : "products are"
                        } currently out of stock and should be prioritized for replenishment.${
                          noSales > 0
                            ? ` ${noSales} ${
                                noSales === 1 ? "product has" : "products have"
                              } stock but no recorded sales, so review demand before placing new orders.`
                            : ""
                        }`;
                      }
          
                    if (noSales > 0) {
                      return `${noSales} product${noSales !== 1 ? "s have" : " has"} stock but no recorded sales. Review these products before purchasing more inventory.`;
                    }
          
                    return "Inventory levels are currently stable. Continue monitoring stock and sales velocity.";
                  })()
                : "No inventory data is currently available.",
                priority:
                topProfitProduct && topProfitProduct.margin >= 70
                  ? "High"
                  : topProfitProduct && topProfitProduct.margin >= 40
                    ? "Medium"
                    : "Low",
          },
          {
            title: "PPC Opportunity",
            description: topWastedPpcTerm
  ? `The search term "${topWastedPpcTerm.searchTerm}" has ₹${topWastedPpcTerm.spend.toFixed(2)} in ad spend with no attributed sales. Review this term for negative targeting, bid reduction, or campaign optimization to reduce wasted spend.`
  : "No wasteful PPC search term data is currently available.",
            priority: ppcRows.length > 0 ? "High" : "Medium",
          },
        ];
      }, [salesRows, inventoryRows, ppcRows]);
      const overallPriority =
      insights.some((insight) => insight.priority === "High")
        ? "High"
        : insights.some((insight) => insight.priority === "Medium")
        ? "Medium"
        : "Low";
        const highPriorityCount = insights.filter(
            (insight) => insight.priority === "High"
          ).length;
    
    return (
  
    
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            AI Insights
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Actionable recommendations based on your sales, profit, PPC and
            inventory data.
          </p>
          <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 p-5">
  <div className="flex items-center justify-between gap-4">
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
        Priority Action Summary
      </p>

      <p className="mt-1 text-sm leading-6 text-orange-900">
  {highPriorityCount > 0
    ? `${highPriorityCount} high-priority actions require attention. Focus on the highest-impact opportunities below.`
    : "No high-priority actions require immediate attention. Continue monitoring your business performance."}
</p>
    </div>
    <div className="mb-6 grid grid-cols-3 gap-3">
  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
      High Priority
    </p>
    <p className="mt-1 text-2xl font-bold text-red-700">
      {insights.filter((item) => item.priority === "High").length}
    </p>
    <p className="mt-1 text-xs text-red-600">
      Needs attention
    </p>
  </div>

  <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-yellow-700">
      Medium Priority
    </p>
    <p className="mt-1 text-2xl font-bold text-yellow-700">
      {insights.filter((item) => item.priority === "Medium").length}
    </p>
    <p className="mt-1 text-xs text-yellow-700">
      Optimization opportunities
    </p>
  </div>

  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
      Total Actions
    </p>
    <p className="mt-1 text-2xl font-bold text-emerald-700">
      {insights.length}
    </p>
    <p className="mt-1 text-xs text-emerald-600">
      AI recommendations
    </p>
  </div>
</div>

    <span className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-bold text-orange-600">
      {overallPriority}
    </span>
  </div>
</div>
         
          <div className="mb-6 grid gap-3 md:grid-cols-3">
  <div className="rounded-lg border border-slate-200 bg-white p-4">
    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
      Sales Data
    </p>
    <p className="mt-1 text-xl font-bold text-slate-900">
      {salesRows.length} rows
    </p>
  </div>

  <div className="rounded-lg border border-slate-200 bg-white p-4">
    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
      Inventory Data
    </p>
    <p className="mt-1 text-xl font-bold text-slate-900">
      {inventoryRows.length} rows
    </p>
  </div>

  <div className="rounded-lg border border-slate-200 bg-white p-4">
    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
      PPC Data
    </p>
    <p className="mt-1 text-xl font-bold text-slate-900">
      {ppcRows.length} rows
    </p>
  </div>
</div>
        </div>
        <div className="mb-4">
  <h2 className="text-lg font-semibold text-slate-900">
    AI Action Queue
  </h2>
  <p className="mt-1 text-sm text-slate-500">
    Prioritized actions generated from your current sales, profit, inventory and PPC data.
  </p>
  <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
  <div className="grid grid-cols-12 gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
    <div className="col-span-2">Priority</div>
    <div className="col-span-3">Opportunity</div>
    <div className="col-span-4">Recommendation</div>
    <div className="col-span-3 text-right">Action</div>
  </div>

  {insights.map((insight) => (
  <div
    key={insight.title}
    className="grid grid-cols-12 items-center gap-3 border-t border-slate-100 px-4 py-4"
  >
    <div className="col-span-2">
      <span
        className={
          insight.priority === "High"
            ? "font-semibold text-red-600"
            : insight.priority === "Medium"
            ? "font-semibold text-yellow-600"
            : "font-semibold text-slate-500"
        }
      >
        {insight.priority}
      </span>
    </div>

    <div className="col-span-3">
      <p className="font-medium text-slate-900">
        {insight.title}
      </p>
    </div>

    <div className="col-span-4 text-sm text-slate-600">
      {insight.description}
    </div>

    <div className="col-span-3 text-right">
      <button
        type="button"
        onClick={() => {
          if (
            insight.title === "Sales Opportunity" ||
            insight.title === "Profit Opportunity"
          ) {
            window.location.href =
              insight.title === "Sales Opportunity"
                ? "/products"
                : "/profit-calculator";
          } else if (insight.title === "Inventory Risk") {
            window.location.href = "/inventory";
          } else if (insight.title === "PPC Opportunity") {
            window.location.href = "/ppc";
          }
        }}
        className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100"
      >
        {insight.title === "Sales Opportunity"
          ? "View Products"
          : insight.title === "Profit Opportunity"
          ? "Optimize Profit"
          : insight.title === "Inventory Risk"
          ? "Restock Inventory"
          : "Optimize PPC"}
      </button>
    </div>
  </div>
))}

    <div className="col-span-3">
      <p className="font-medium text-slate-900">
      {insights[0]?.title ?? "Sales Opportunity"}
      </p>
      <p className="mt-1 text-xs text-slate-500">
      {insights[0]?.description ?? "No sales recommendation available."}
      </p>
    </div>

    <div className="col-span-4 text-sm text-slate-600">
      Protect stock availability and maintain visibility for this strong-selling product.
    </div>

    <div className="col-span-3 text-right">
      <button
        type="button"
        onClick={() => {
          window.location.href = "/inventory";
        }}
        className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600"
      >
        View Inventory
      </button>
    </div>
  </div>
</div>
</div>
<div className="grid gap-4 md:grid-cols-2">
  {insights.map((insight) => (
    <div
      key={insight.title}
      className="grid grid-cols-12 items-center gap-3 border-t border-slate-100 px-4 py-4"
    >
      <div className="col-span-2">
        <span
          className={
            insight.priority === "High"
              ? "font-semibold text-red-600"
              : insight.priority === "Medium"
              ? "font-semibold text-yellow-600"
              : "font-semibold text-slate-500"
          }
        >
          {insight.priority}
        </span>
      </div>

      <div className="col-span-3">
        <p className="font-medium text-slate-900">
          {insight.title}
        </p>
      </div>

      <div className="col-span-4 text-sm text-slate-600">
        {insight.description}
      </div>

      <div className="col-span-3 text-right">
        <button
          type="button"
          onClick={() => {
            if (insight.title === "Sales Opportunity") {
              window.location.href = "/products";
            } else if (insight.title === "Profit Opportunity") {
              window.location.href = "/profit-calculator";
            } else if (insight.title === "Inventory Risk") {
              window.location.href = "/inventory";
            } else if (insight.title === "PPC Opportunity") {
              window.location.href = "/ppc";
            }
          }}
          className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100"
        >
          {insight.title === "Sales Opportunity"
            ? "View Products"
            : insight.title === "Profit Opportunity"
            ? "Optimize Profit"
            : insight.title === "Inventory Risk"
            ? "Restock Inventory"
            : "Optimize PPC"}
        </button>
      </div>
    </div>
  ))}
  </div>
  </main>
  );
  }