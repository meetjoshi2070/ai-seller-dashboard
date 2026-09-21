"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card } from "@/components/ui/Card";
import { SalesLineChart } from "@/components/charts/SalesLineChart";
import { ProfitBarChart } from "@/components/charts/ProfitBarChart";
import { TopProductsTable } from "@/components/tables/TopProductsTable";
import { LowStockTable } from "@/components/tables/LowStockTable";
import type { Product } from "@/lib/dummy-data";
import type { InventoryRow } from "@/lib/inventory-import";
import type { ListingRow } from "@/lib/listings-import";
import { getProductCost, loadProductCosts, type ProductCost } from "@/lib/product-costs";
import { loadSupplierData, type SupplierData } from "@/lib/supplier-data";
import { calculateProfit } from "@/lib/profit-calculator";
import type { SalesRow } from "@/lib/sales-import";
import { loadFeeProfiles, type FeeProfile } from "@/lib/fee-profiles";
import { analyzeInventory } from "@/lib/inventory-analysis";
import { formatCurrency, formatNumber, formatPercent, formatRatio } from "@/lib/utils";

type PPCRow = { sku: string; spend: number; sales: number; units: number };
type DashboardData = {
  salesRows: SalesRow[];
  inventoryRows: InventoryRow[];
  listingRows: ListingRow[];
  ppcRows: PPCRow[];
  productCosts: ProductCost[];
  supplierData: SupplierData[];
  feeProfiles: FeeProfile[];
};

const EMPTY_DATA: DashboardData = {
  salesRows: [],
  inventoryRows: [],
  listingRows: [],
  ppcRows: [],
  productCosts: [],
  supplierData: [],
  feeProfiles: [],
};

function loadSyncedRows<T>(key: string): T[] {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return [];
    const parsed = JSON.parse(saved) as { rows?: T[] };
    return Array.isArray(parsed.rows) ? parsed.rows : [];
  } catch {
    return [];
  }
}
function loadPpcRows<T>(key: string): T[] {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return [];

    const parsed = JSON.parse(saved);

    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.rows)) return parsed.rows;

    return [];
  } catch {
    return [];
  }
}

export default function Home() {
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);

  useEffect(() => {
    setData({
      salesRows: loadSyncedRows<SalesRow>("amazon_sales_sync"),
      inventoryRows: loadSyncedRows<InventoryRow>("amazon_inventory_sync"),
      listingRows: loadSyncedRows<ListingRow>("amazon_listings_sync"),
      ppcRows: loadPpcRows<PPCRow>("seller-dashboard-ppc-data"),
      productCosts: loadProductCosts(),
      supplierData: loadSupplierData(),
      feeProfiles: loadFeeProfiles(),
    });
  }, []);

  const dashboard = useMemo(() => {
    const totalSales = data.salesRows.reduce((sum, row) => sum + (Number(row.orderedProductSales) || 0), 0);
    const totalUnitsSold = data.salesRows.reduce(
      (sum, row) => sum + (Number(row.unitsOrdered ?? row.unitsSold) || 0), 0,
    );
    const totalOrders = data.salesRows.reduce(
      (sum, row) => sum + (Number(row.orders) || 0),
      0,
    );
    const ppcSpend = data.ppcRows.reduce((sum, row) => sum + (Number(row.spend) || 0), 0);
    const ppcSales = data.ppcRows.reduce((sum, row) => sum + (Number(row.sales) || 0), 0);
    const listingByAsin = new Map(
      data.listingRows.filter((listing) => listing.asin).map((listing) => [listing.asin!.trim().toLowerCase(), listing]),
    );
    const inventoryBySku = new Map(data.inventoryRows.map((row) => [row.sku.trim().toLowerCase(), row]));
    const amazonProfiles = data.feeProfiles.filter((profile) => profile.marketplace === "amazon");
    const feeProfile = amazonProfiles.find((profile) => profile.name === "General") ?? amazonProfiles[0];
    const hasFeeProfile = Boolean(feeProfile);

    const products = data.salesRows.map((salesRow) => {
      const asin = salesRow.asin?.trim().toLowerCase();
      const listing = asin ? listingByAsin.get(asin) : undefined;
      const unitsSold = Number(salesRow.unitsOrdered ?? salesRow.unitsSold) || 0;
      const revenue = Number(salesRow.orderedProductSales) || 0;
      const sku = listing?.sku ?? salesRow.asin;
      const stock = listing ? inventoryBySku.get(listing.sku.trim().toLowerCase())?.quantity ?? 0 : 0;
      const productCost = listing
  ? getProductCost(data.productCosts, listing.sku)
  : 0;

const supplierCost = listing
  ? data.supplierData.find(
      (supplier) =>
        supplier.sku.trim().toLowerCase() === listing.sku.trim().toLowerCase(),
    )?.purchasePrice ?? 0
  : 0;

const cogs = productCost > 0 ? productCost : supplierCost;

const hasCogs = cogs > 0;
      const sellingPrice = listing?.sellingPrice ?? 0;
      const productPpcSpend = listing
        ? data.ppcRows.filter((row) => row.sku?.trim().toLowerCase() === listing.sku.trim().toLowerCase())
          .reduce((sum, row) => sum + (Number(row.spend) || 0), 0)
        : 0;
        const canCalculateProfit = Boolean(
          hasFeeProfile && listing && hasCogs && sellingPrice > 0
        );
      const profit = canCalculateProfit
        ? calculateProfit({
          marketplace: "amazon", sellingPrice, cogs,
          gstPercent: feeProfile!.gstPercent, referralFeePercent: feeProfile!.referralFeePercent,
          closingFee: feeProfile!.closingFee, shippingFee: feeProfile!.shippingFee,
          fulfilmentMethod: feeProfile!.fulfilmentMethod, shippingZone: "LOCAL", shippingRules: feeProfile!.shippingRules,
          otherMarketplaceFee: feeProfile!.otherMarketplaceFee, packagingCost: 0,
          advertisingCost: unitsSold > 0 ? productPpcSpend / unitsSold : 0, otherCosts: 0,
        }).netProfit * unitsSold
        : 0;

      return {
        id: `asin-${salesRow.asin}`, name: listing?.productName ?? salesRow.title ?? salesRow.asin, sku,
        unitsSold, revenue, profit, stock, category: "Amazon", canCalculateProfit,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    const profitAvailable = products.some((product) => product.canCalculateProfit);
    const inventoryItems = analyzeInventory(data.inventoryRows, data.salesRows, data.listingRows, 30, 7);

    return {
      totalSales,
      totalOrders,
      totalUnitsSold,
      hasPpcData: data.ppcRows.length > 0,
      roas: ppcSpend > 0 ? ppcSales / ppcSpend : 0,
      acos: ppcSales > 0 ? (ppcSpend / ppcSales) * 100 : 0,
      products,
      profitAvailable,
      netProfit: profitAvailable ? products.reduce((sum, product) => sum + product.profit, 0) : 0,
      lowStockProducts: inventoryItems
        .filter((item) => ["Out of Stock", "Critical", "Low Stock"].includes(item.status))
        .map((item) => ({
          id: `inventory-${item.sku}`, name: item.productName ?? item.sku, sku: item.sku,
          unitsSold: item.unitsSold, revenue: item.revenue, profit: 0, stock: item.quantity,
          category: "Amazon", inventoryStatus: item.status,
        })),
    };
  }, [data]);

  const topProducts = dashboard.products.slice(0, 5) as Product[];
  const salesChartData = dashboard.products.slice(0, 8).map((product) => ({ label: product.sku, sales: product.revenue }));
  const profitChartData = dashboard.profitAvailable
    ? dashboard.products.slice(0, 8).map((product) => ({ label: product.sku, profit: product.profit }))
    : [];

  return (
    <DashboardLayout title="Dashboard" subtitle="Overview of your Amazon seller performance" activeNav="Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <KpiCard label="Total Sales" value={formatCurrency(dashboard.totalSales)} subtitle="Imported Amazon sales" />
          <KpiCard
            label="Net Profit" value={dashboard.profitAvailable ? formatCurrency(dashboard.netProfit) : "—"}
            subtitle={dashboard.profitAvailable ? "Configured product profitability" : "Requires listings, COGS, and Amazon fee profile"}
          />
          <KpiCard
  label="Orders"
  value={formatNumber(dashboard.totalOrders)}
  subtitle="Imported Amazon order items"
/>
          <KpiCard label="Units Sold" value={formatNumber(dashboard.totalUnitsSold)} subtitle="Imported Amazon sales" />
          <KpiCard label="ROAS" value={dashboard.hasPpcData && dashboard.roas > 0 ? formatRatio(dashboard.roas) : "—"} subtitle="PPC attributed sales ÷ spend" />
          <KpiCard label="ACOS" value={dashboard.hasPpcData && dashboard.acos > 0 ? formatPercent(dashboard.acos) : "—"} subtitle="PPC spend ÷ attributed sales" invertTrend />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card title="Sales Overview" subtitle="Revenue by top imported products"><SalesLineChart data={salesChartData} /></Card>
          <Card title="Profit Analysis" subtitle="Net profit by top configured products"><ProfitBarChart data={profitChartData} /></Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <TopProductsTable products={topProducts} profitAvailable={dashboard.profitAvailable} />
          <LowStockTable products={dashboard.lowStockProducts} />
        </div>
      </div>
    </DashboardLayout>
  );
}
