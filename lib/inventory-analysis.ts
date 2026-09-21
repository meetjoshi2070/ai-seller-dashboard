export type InventoryStatus =
  | "Out of Stock"
  | "No Sales"
  | "Critical"
  | "Low Stock"
  | "Watch"
  | "Healthy"
  | "Overstock";

type InventoryRow = {
  sku: string;
  asin?: string;
  quantity: number;
  productName?: string;
};

type SalesRow = {
  asin?: string;
  unitsOrdered?: number;
  unitsSold?: number;
  orderedProductSales?: number;
};

type ListingRow = {
  sku: string;
  productName?: string;
};

export type InventoryAnalysisItem = InventoryRow & {
  unitsSold: number;
  revenue: number;
  dailySales: number;
  daysOfStock: number;
  targetStock: number;
  reorderQty: number;
  status: InventoryStatus;
};

export function analyzeInventory(
  inventoryRows: InventoryRow[],
  salesRows: SalesRow[],
  listingRows: ListingRow[],
  targetDays: number,
  safetyDays: number,
): InventoryAnalysisItem[] {
  const salesByAsin = new Map<string, { unitsSold: number; revenue: number }>();

  salesRows.forEach((row) => {
    const asin = row.asin?.trim().toLowerCase();

    if (!asin) return;

    const units = Number(row.unitsOrdered ?? row.unitsSold ?? 0);
    const revenue = Number(row.orderedProductSales ?? 0);
    const existing = salesByAsin.get(asin);

    if (existing) {
      existing.unitsSold += Number.isFinite(units) ? units : 0;
      existing.revenue += Number.isFinite(revenue) ? revenue : 0;
    } else {
      salesByAsin.set(asin, {
        unitsSold: Number.isFinite(units) ? units : 0,
        revenue: Number.isFinite(revenue) ? revenue : 0,
      });
    }
  });

  const productNameBySku = new Map<string, string>();

  listingRows.forEach((row) => {
    const sku = row.sku?.trim().toLowerCase();

    if (sku && row.productName?.trim()) {
      productNameBySku.set(sku, row.productName.trim());
    }
  });

  return inventoryRows.map((row) => {
    const asin = row.asin?.trim().toLowerCase();
    const sales = asin ? salesByAsin.get(asin) : undefined;
    const unitsSold = sales?.unitsSold ?? 0;
    const revenue = sales?.revenue ?? 0;
    const dailySales = unitsSold / 32;
    const targetStock = Math.ceil(dailySales * (targetDays + safetyDays));
    const reorderQty = unitsSold > 0 ? Math.max(0, targetStock - row.quantity) : 0;
    const daysOfStock = dailySales > 0 ? row.quantity / dailySales : Infinity;

    let status: InventoryStatus;

    if (row.quantity <= 0) {
      status = "Out of Stock";
    } else if (unitsSold === 0) {
      status = "No Sales";
    } else if (daysOfStock <= 7) {
      status = "Critical";
    } else if (daysOfStock <= 14) {
      status = "Low Stock";
    } else if (daysOfStock <= 30) {
      status = "Watch";
    } else if (daysOfStock <= 60) {
      status = "Healthy";
    } else {
      status = "Overstock";
    }

    return {
      ...row,
      productName: productNameBySku.get(row.sku.trim().toLowerCase()) ?? row.productName,
      unitsSold,
      revenue,
      dailySales,
      daysOfStock,
      targetStock,
      reorderQty,
      status,
    };
  });
}
