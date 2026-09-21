"use client";

import { useEffect, useMemo, useState } from "react";
import { topProducts } from "@/lib/dummy-data";
import {
  parseAmazonInventoryCsv,
  type InventoryRow,
} from "@/lib/inventory-import";

import {
  parseAmazonSalesCsv,
  type SalesRow,
} from "@/lib/sales-import";
import {
  parseAmazonListingsReport,
  type ListingRow,
} from "@/lib/listings-import";
import {
  loadProductCosts,
  saveProductCosts,
  getProductCost,
  setProductCost,
  type ProductCost,
} from "@/lib/product-costs";
import {
  loadSupplierData,
  saveSupplierData,
  type SupplierData,
} from "@/lib/supplier-data";
import { useFeeProfiles } from "@/hooks/useFeeProfiles";
import { calculateProfit } from "@/lib/profit-calculator";

export default function ProductsPage() {
  const {
    profiles: feeProfiles,
    getByMarketplace,
  } = useFeeProfiles();
  const [products, setProducts] = useState(topProducts);
  const [inventoryRows, setInventoryRows] = useState<InventoryRow[]>([]);
  const [inventoryFileName, setInventoryFileName] = useState("");
  const [inventoryError, setInventoryError] = useState("");
  const [shippingZone, setShippingZone] = useState<"LOCAL" | "REGIONAL" | "NATIONAL">("LOCAL");
  const [ppcRows, setPpcRows] = useState<
  {
    sku: string;
    product: string;
    spend: number;
    sales: number;
    units: number;
  }[]
>([]);
useEffect(() => {
  try {
    const savedPPC = localStorage.getItem("seller-dashboard-ppc");

    if (savedPPC) {
      const parsed = JSON.parse(savedPPC);

      if (Array.isArray(parsed)) {
        setPpcRows(parsed);
      }
    }
  } catch (error) {
    console.error("Failed to load saved PPC data:", error);
  }
}, []);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventorySyncedAt, setInventorySyncedAt] = useState<string | null>(
    null
  );
  const [salesRows, setSalesRows] = useState<SalesRow[]>([]);
  const [productCosts, setProductCosts] = useState<ProductCost[]>([]);
  const [supplierData, setSupplierData] = useState<SupplierData[]>([]);
  const [cogsSearch, setCogsSearch] = useState("");
  const [cogsFilter, setCogsFilter] = useState<"all" | "missing" | "saved">("all");
  useEffect(() => {
    setProductCosts(loadProductCosts());
    setSupplierData(loadSupplierData());
  }, []);
  const handleProductCostChange = (sku: string, value: string) => {
    const cost = Number(value);
  
    if (!Number.isFinite(cost) || cost < 0) {
      return;
    }
  
    const updatedCosts = setProductCost(
      productCosts,
      sku,
      cost
    );
  
    setProductCosts(updatedCosts);
    saveProductCosts(updatedCosts);
  };
  const handleSupplierPurchasePriceChange = (
    sku: string,
    purchasePrice: number
  ) => {
    const existing = supplierData.find(
      (item) => item.sku.trim().toLowerCase() === sku.trim().toLowerCase()
    );
  
    const updatedSuppliers = [...supplierData];
  
    if (existing) {
      const index = updatedSuppliers.findIndex(
        (item) => item.sku.trim().toLowerCase() === sku.trim().toLowerCase()
      );
  
      updatedSuppliers[index] = {
        ...existing,
        purchasePrice,
      };
    } else {
      updatedSuppliers.push({
        sku: sku.trim(),
        supplierName: "",
        supplierContact: "",
        purchasePrice,
        moq: 0,
      });
    }
  
    setSupplierData(updatedSuppliers);
    saveSupplierData(updatedSuppliers);
  };
  const handleSupplierChange = (sku: string, supplierName: string) => {
    const existing = supplierData.find(
      (item) => item.sku.trim().toLowerCase() === sku.trim().toLowerCase()
    );
  
    const updatedSuppliers = [...supplierData];
  
    if (existing) {
      const index = updatedSuppliers.findIndex(
        (item) => item.sku.trim().toLowerCase() === sku.trim().toLowerCase()
      );
  
      updatedSuppliers[index] = {
        ...existing,
        supplierName,
      };
    } else {
      updatedSuppliers.push({
        sku: sku.trim(),
        supplierName,
        supplierContact: "",
        purchasePrice: 0,
        moq: 0,
      });
    }
  
    setSupplierData(updatedSuppliers);
    saveSupplierData(updatedSuppliers);
  };
  const [listingRows, setListingRows] = useState<ListingRow[]>([]);
  const [salesFileName, setSalesFileName] = useState("");
  const [salesError, setSalesError] = useState("");
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesSyncedAt, setSalesSyncedAt] = useState<string | null>(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("amazon_inventory_sync");

      if (!saved) return;
      

      const parsed = JSON.parse(saved);

      if (!Array.isArray(parsed.rows)) return;

      setInventoryRows(parsed.rows);
      setInventoryFileName(parsed.fileName ?? "");
      setInventorySyncedAt(parsed.syncedAt ?? null);
    } catch {
      localStorage.removeItem("amazon_inventory_sync");
    }
  }, []);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("amazon_listings_sync");
  
      if (!saved) return;
  
      const parsed = JSON.parse(saved);
  
      if (!Array.isArray(parsed.rows)) return;
  
      setListingRows(parsed.rows);
    } catch {
      localStorage.removeItem("amazon_listings_sync");
    }
  }, []);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("amazon_sales_sync");

      if (!saved) return;

      const parsed = JSON.parse(saved);

      if (!Array.isArray(parsed.rows)) return;

      setSalesRows(parsed.rows);
      setSalesFileName(parsed.fileName ?? "");
      setSalesSyncedAt(parsed.syncedAt ?? null);
    } catch {
      localStorage.removeItem("amazon_sales_sync");
    }
  }, []);
  useEffect(() => {
    if (inventoryRows.length === 0) return;
  
    const inventoryBySku = new Map(
      inventoryRows.map((row) => [
        row.sku.trim().toLowerCase(),
        row.quantity,
      ])
    );
  
    setProducts((currentProducts) =>
      currentProducts.map((product) => {
        const stock = inventoryBySku.get(
          product.sku.trim().toLowerCase()
        );
  
        if (stock === undefined) {
          return product;
        }
  
        return {
          ...product,
          stock,
        };
      })
    );
  }, [inventoryRows]);

  const handleInventoryUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setInventoryError("");
    setInventoryLoading(true);

    try {
      const fileName = file.name.toLowerCase();

if (!fileName.endsWith(".csv") && !fileName.endsWith(".txt")) {
  throw new Error(
    "Please upload an Amazon Inventory Report in CSV or TXT format."
  );
}

      const text = await file.text();

      const rows = parseAmazonInventoryCsv(text);

      setInventoryRows(rows);
      console.log("AMAZON INVENTORY ROWS:", rows);
console.log("FIRST 10 AMAZON SKUS:", rows.slice(0, 10).map((row) => ({
  sku: row.sku,
  quantity: row.quantity,
  productName: row.productName,
})));
      setInventoryFileName(file.name);
      setInventorySyncedAt(new Date().toISOString());

      localStorage.setItem(
        "amazon_inventory_sync",
        JSON.stringify({
          syncedAt: new Date().toISOString(),
          fileName: file.name,
          rows,
        })
      );
    } catch (error) {
      setInventoryRows([]);
      setInventoryFileName("");

      setInventoryError(
        error instanceof Error
          ? error.message
          : "Unable to process the inventory file."
      );
    } finally {
      setInventoryLoading(false);
    }

    event.target.value = "";
  };
  const handleSalesUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setSalesError("");
    setSalesLoading(true);

    try {
      const fileName = file.name.toLowerCase();

      if (!fileName.endsWith(".csv")) {
        throw new Error(
          "Please upload an Amazon Sales and Traffic Report in CSV format."
        );
      }

      const text = await file.text();
      const rows = parseAmazonSalesCsv(text);
      console.log("SALES PARSED DEBUG:", rows.slice(0, 10));

      setSalesRows(rows);
      setSalesFileName(file.name);
      setSalesSyncedAt(new Date().toISOString());

      localStorage.setItem(
        "amazon_sales_sync",
        JSON.stringify({
          syncedAt: new Date().toISOString(),
          fileName: file.name,
          rows,
        })
      );
    } catch (error) {
      setSalesRows([]);
      setSalesFileName("");

      setSalesError(
        error instanceof Error
          ? error.message
          : "Unable to process the sales file."
      );
    } finally {
      setSalesLoading(false);
    }

    event.target.value = "";
  };
  const handleListingsUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
  
    if (!file) return;
  
    try {
      const reportText = await file.text();
      const parsedRows = parseAmazonListingsReport(reportText);
  
      if (parsedRows.length === 0) {
        throw new Error("No valid listing rows were found in the file.");
      }
  
      setListingRows(parsedRows);
  
      localStorage.setItem(
        "amazon_listings_sync",
        JSON.stringify({
          rows: parsedRows,
          fileName: file.name,
          syncedAt: new Date().toISOString(),
        }),
      );
    } catch (error) {
      console.error("Listings upload error:", error);
    }
  
    event.target.value = "";
  };
  
  const [search, setSearch] = useState("");

  const salesByAsin = useMemo(() => {
  const map = new Map<
    string,
    { unitsSold: number; revenue: number }
  >();

  salesRows.forEach((row) => {
    const asin = row.asin.trim().toLowerCase();
  
    if (!asin) return;
  
    const existing = map.get(asin);
  
    if (existing) {
      existing.unitsSold += row.unitsOrdered;
      existing.revenue += row.orderedProductSales;
    } else {
      map.set(asin, {
        unitsSold: row.unitsOrdered,
        revenue: row.orderedProductSales,
      });
    }
  });
  console.log("SALES MAP DEBUG:", Array.from(map.entries()).slice(0, 10));
  return map;
}, [salesRows]);
const listingBySku = useMemo(() => {
  const map = new Map<string, ListingRow>();

  listingRows.forEach((row) => {
    const sku = row.sku.trim().toLowerCase();

    if (!sku) return;

    map.set(sku, row);
  });

  return map;
}, [listingRows]);
const productsWithInventory = useMemo(() => {
  if (listingRows.length === 0) {
    return products;
  }

  const inventoryBySku = new Map<string, InventoryRow>();

  inventoryRows.forEach((row) => {
    const sku = row.sku.trim().toLowerCase();

    if (!sku) return;

    inventoryBySku.set(sku, row);
  });

  return listingRows.map((listing, index) => {
    const sku = listing.sku.trim().toLowerCase();

    const inventory = inventoryBySku.get(sku);

    const existingProduct = products.find(
      (product) =>
        product.sku.trim().toLowerCase() === sku
    );

    const asin = listing.asin?.trim().toLowerCase();

    const sales = asin
      ? salesByAsin.get(asin)
      : undefined;
      console.log("SALES MATCH CHECK:", {
        sku: listing.sku,
        asin,
        unitsSold: sales?.unitsSold,
        revenue: sales?.revenue,
      });
      const unitsSold =
      sales?.unitsSold ?? existingProduct?.unitsSold ?? 0;
    
    const revenue =
      sales?.revenue ?? existingProduct?.revenue ?? 0;
      const sellingPrice =
  listing.sellingPrice ??
  existingProduct?.sellingPrice ??
  0;

      const cogs = getProductCost(
        productCosts,
        listing.sku
      );
      const feeProfiles = getByMarketplace("amazon");
const feeProfile = feeProfiles.find(
  (profile) => profile.name === "General"
) ?? feeProfiles[0];
      
      const hasCogs = productCosts.some(
        (item) =>
          item.sku.trim().toLowerCase() === listing.sku.trim().toLowerCase()
      );
      const ppcSpend = ppcRows
  .filter(
    (row) =>
      row.sku?.trim().toLowerCase() ===
      listing.sku?.trim().toLowerCase()
  )
  .reduce(
    (sum, row) => sum + (Number(row.spend) || 0),
    0
  );

const advertisingCostPerUnit =
  unitsSold > 0 ? ppcSpend / unitsSold : 0;
      const profitCalculation = calculateProfit({
        marketplace: "amazon",
        sellingPrice,
        cogs,
        gstPercent: feeProfile?.gstPercent ?? 0,
        referralFeePercent: feeProfile?.referralFeePercent ?? 0,
        closingFee: feeProfile?.closingFee ?? 0,
        shippingFee: feeProfile?.shippingFee ?? 0,
shippingZone,
        otherMarketplaceFee: feeProfile?.otherMarketplaceFee ?? 0,
        fulfilmentMethod: feeProfile?.fulfilmentMethod,
        shippingRules: feeProfile?.shippingRules,
        packagingCost: 0,
        advertisingCost: advertisingCostPerUnit,
        otherCosts: 0,
      });
      
      const profit = profitCalculation.netProfit * unitsSold;

    return {
      id:
        existingProduct?.id ??
        `listing-${index}`,

      name:
        listing.productName ??
        inventory?.productName ??
        existingProduct?.name ??
        listing.sku,
        

      sku: listing.sku,

      sellingPrice:
        listing.sellingPrice ??
        existingProduct?.sellingPrice ??
        0,

        cogs,
        hasCogs,
        unitsSold,
        revenue,
        profit,

      stock:
        inventory?.quantity ??
        0,

      category:
        existingProduct?.category ??
        "Uncategorized",
    };
  });
}, [
  listingRows,
  inventoryRows,
  products,
  salesByAsin,
  productCosts,
]);
  
const filteredCogsProducts = useMemo(() => {
  const query = cogsSearch.toLowerCase().trim();

  return listingRows.filter((product) => {
    const matchesSearch =
      !query ||
      (product.productName ?? "").toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query);

    const hasCost = productCosts.some(
      (item) =>
        item.sku.trim().toLowerCase() === product.sku.trim().toLowerCase()
    );

    const matchesFilter =
      cogsFilter === "all" ||
      (cogsFilter === "missing" && !hasCost) ||
      (cogsFilter === "saved" && hasCost);

    return matchesSearch && matchesFilter;
  });
}, [listingRows, productCosts, cogsSearch, cogsFilter]);
  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase().trim();
  
   if (!query) return productsWithInventory;
  
   return productsWithInventory.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
    );
  }, [productsWithInventory, search]);

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Products
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your Amazon products and profitability
            </p>
          </div>

          <button
            type="button"
            className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
          >
            + Add Product
          </button>
        </div>

        {/* Amazon Inventory Sync */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Amazon Inventory Sync
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Upload your latest Amazon Inventory Report to automatically update stock.
              </p>
            </div>

            <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600">
              {inventoryLoading ? "Processing..." : "Upload Inventory Report"}

              <input
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleInventoryUpload}
                disabled={inventoryLoading}
              />
            </label>
          </div>

          {inventoryFileName && !inventoryError && (
            <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm">
              <p className="font-medium text-emerald-700">
                Inventory synced successfully.
              </p>

              <p className="mt-1 text-emerald-600">
                {inventoryRows.length} inventory rows imported
                {inventorySyncedAt &&
                  ` • ${new Date(inventorySyncedAt).toLocaleString("en-IN")}`}
              </p>

              <p className="mt-1 text-xs text-emerald-600">
                File: {inventoryFileName}
              </p>
            </div>
          )}

          {inventoryError && (
            <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {inventoryError}
            </div>
          )}
        </div>
        {/* Amazon Sales Sync */}
<div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 className="text-base font-semibold text-slate-900">
        Amazon Sales Sync
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Upload your latest Amazon Sales and Traffic Report to automatically update units sold and revenue.
      </p>
    </div>

    <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white">
      {salesLoading ? "Processing..." : "Upload Sales Report"}

      <input
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleSalesUpload}
        disabled={salesLoading}
      />
    </label>
  </div>

  {salesFileName && !salesError && (
    <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm">
      <p className="font-medium text-emerald-700">
        Sales synced successfully.
      </p>

      <p className="mt-1 text-emerald-600">
        {salesRows.length} sales rows imported
        {salesSyncedAt &&
          ` • ${new Date(salesSyncedAt).toLocaleString("en-IN")}`}
      </p>

      <p className="mt-1 text-xs text-emerald-600">
        File: {salesFileName}
      </p>
    </div>
  )}

  {salesError && (
    <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
      {salesError}
    </div>
  )}
</div>
<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  <div className="flex items-center justify-between gap-4">
    <div>
      <h2 className="text-lg font-semibold text-slate-900">
        Amazon Listings Sync
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Upload your latest Amazon Listings Report to connect SKUs with ASINs and product names.
      </p>
    </div>

    <label className="cursor-pointer rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600">
      Upload Listings Report
      <input
        type="file"
        accept=".csv,.txt"
        className="hidden"
        onChange={handleListingsUpload}
      />
    </label>
  </div>

  {listingRows.length > 0 && (
    <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
      <p className="font-medium text-green-700">
        Listings synced successfully.
      </p>
      <p className="mt-1 text-sm text-green-600">
        {listingRows.length} listing rows imported.
      </p>
    </div>
  )}
</section>



{/* COGS Manager */}
<section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  <div className="flex items-center justify-between gap-4">
    <div>
      <h2 className="text-lg font-semibold text-slate-900">
        Product COGS
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Enter the cost price for each product. This is used to calculate gross profit.
      </p>
    </div>

    <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
      {productCosts.length} costs saved
    </div>
  </div>
  <div className="mt-5"><div className="mt-5 flex flex-col gap-3 sm:flex-row">
  <input
    type="text"
    value={cogsSearch}
    onChange={(e) => setCogsSearch(e.target.value)}
    placeholder="Search COGS by product name or SKU..."
    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
  />

  <div className="flex shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-1">
    <button
      type="button"
      onClick={() => setCogsFilter("all")}
      className={`rounded-md px-3 py-2 text-sm font-medium transition ${
        cogsFilter === "all"
          ? "bg-orange-500 text-white"
          : "text-slate-600 hover:bg-white"
      }`}
    >
      All
    </button>

    <button
      type="button"
      onClick={() => setCogsFilter("missing")}
      className={`rounded-md px-3 py-2 text-sm font-medium transition ${
        cogsFilter === "missing"
          ? "bg-orange-500 text-white"
          : "text-slate-600 hover:bg-white"
      }`}
    >
      Missing
    </button>

    <button
      type="button"
      onClick={() => setCogsFilter("saved")}
      className={`rounded-md px-3 py-2 text-sm font-medium transition ${
        cogsFilter === "saved"
          ? "bg-orange-500 text-white"
          : "text-slate-600 hover:bg-white"
      }`}
    >
      Saved
    </button>
  </div>
</div>
</div>
  <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Product
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              SKU
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Selling Price
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              COGS
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
  Supplier
</th>
<th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
  Purchase Price
</th>
<th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
  Profit
</th>

            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Action
            </th>
          </tr>
        </thead>

        <tbody>
        {filteredCogsProducts.map((product) => {
            const savedCost = productCosts.find(
              (item) =>
                item.sku.trim().toLowerCase() ===
                product.sku.trim().toLowerCase()
            );

            const currentCost = savedCost?.cost ?? 0;
            const supplier = supplierData.find(
              (item) => item.sku.trim().toLowerCase() === product.sku.trim().toLowerCase()
            );

            return (
              <tr
                key={`cogs-${product.sku}`}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="px-4 py-3">
                  <div className="max-w-[450px]">
                    <p className="font-medium text-slate-900">
                      {product.productName || product.sku}
                    </p>
                  </div>
                </td>

                <td className="px-4 py-3 text-sm text-slate-600">
                  {product.sku}
                </td>

                <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                  ₹{Number(product.sellingPrice ?? 0).toLocaleString("en-IN")}
                </td>

                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={currentCost || ""}
                    id={`cogs-${product.sku}`}
                    placeholder="Enter cost"
                    className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-right text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                  {!savedCost && (
  <p className="mt-1 text-xs font-medium text-orange-600">
    ⚠ COGS missing
  </p>
)}
                </td>
                <td className="px-4 py-3">
                <input
  type="text"
  defaultValue={supplier?.supplierName || ""}
  placeholder="Enter supplier"
  onBlur={(e) => handleSupplierChange(product.sku, e.target.value)}
  className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
/>
</td>
<td className="px-4 py-3">
  <input
    type="number"
    min="0"
    step="0.01"
    defaultValue={supplier?.purchasePrice || ""}
    placeholder="₹0"
    onBlur={(e) =>
      handleSupplierPurchasePriceChange(
        product.sku,
        Number(e.target.value)
      )
    }
    className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
  />
</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById(
                        `cogs-${product.sku}`
                      ) as HTMLInputElement | null;

                      const cost = Number(input?.value ?? 0);

                      if (!Number.isFinite(cost) || cost < 0) {
                        return;
                      }

                      const updatedCosts = [
                        ...productCosts.filter(
                          (item) =>
                            item.sku.trim().toLowerCase() !==
                            product.sku.trim().toLowerCase()
                        ),
                        {
                          sku: product.sku,
                          cost,
                        },
                      ];

                      setProductCosts(updatedCosts);
                      saveProductCosts(updatedCosts);
                    }}
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
                  >
                    Save
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
</section>

{/* Search */}
<div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"></div>
        {/* Search */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product, SKU or category..."
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Product
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    SKU
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Category
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Selling Price
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    COGS
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Units Sold
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Revenue
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  GROSS PROFIT
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
  Profit Margin
</th>
                  <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Stock
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
              {filteredProducts.map((product) => {
  const inventoryMatch = inventoryRows.find(
    (row) =>
      row.sku.trim().toLowerCase() === product.sku.trim().toLowerCase()
  );

  const stock = inventoryMatch?.quantity ?? product.stock;
  const listing = listingBySku.get(product.sku.trim().toLowerCase());
  const sellingPrice =
  listing?.sellingPrice ??
  product.sellingPrice ??
  (product.unitsSold > 0
    ? product.revenue / product.unitsSold
    : 0);

    const cogs = getProductCost(productCosts, product.sku);

                      const status =
                      stock <= 5
                        ? "Critical"
                        : stock <= 10
                          ? "Low Stock"
                          : "Active";

                  return (
                    <tr
                      key={product.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-5 py-5">
                        <div>
                          <p className="font-semibold text-slate-900">
                          {listing?.productName ?? product.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Product ID: {product.id}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                          {product.sku}
                        </span>
                      </td>

                      <td className="px-5 py-5 text-sm text-slate-600">
                        {product.category}
                      </td>

                      <td className="px-5 py-5 text-right text-sm font-medium text-slate-900">
                        ₹{sellingPrice.toLocaleString("en-IN")}
                      </td>

                      <td className="px-5 py-5 text-right text-sm text-slate-600">
                      <input
  type="number"
  min="0"
  value={cogs}
  onChange={(event) => {
    const value = Number(event.target.value);

    setProductCosts(
      setProductCost(
        productCosts,
        product.sku,
        Number.isFinite(value) && value >= 0 ? value : 0
      )
    );
  }}
  className="w-20 rounded-md border border-slate-200 px-2 py-1 text-right text-sm text-slate-700 focus:border-orange-500 focus:outline-none"
/>
</td>

                      <td className="px-5 py-5 text-right text-sm text-slate-700">
                        {product.unitsSold.toLocaleString("en-IN")}
                      </td>

                      <td className="px-5 py-5 text-right text-sm font-medium text-slate-900">
                        ₹{product.revenue.toLocaleString("en-IN")}
                      </td>

                      <td className="px-5 py-5 text-right text-sm font-semibold text-emerald-600">
                        ₹{product.profit.toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-5 text-right text-sm font-medium text-slate-700">
  {(product.sellingPrice ?? 0) > 0
    ? `${((product.profit / ((product.sellingPrice ?? 0) * product.unitsSold)) * 100).toFixed(1)}%`
    : "0.0%"}
</td>
                      
                      <td className="px-5 py-5 text-center text-sm font-medium text-slate-700">
                      {stock}
                      </td>

                      <td className="px-5 py-5 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            status === "Critical"
                              ? "bg-red-50 text-red-600"
                              : status === "Low Stock"
                                ? "bg-orange-50 text-orange-600"
                                : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-sm text-slate-500">
          Showing{" "}
          <span className="font-medium text-slate-700">
            {filteredProducts.length}
          </span>{" "}
          of{" "}
          <span className="font-medium text-slate-700">
          {products.length}
          </span>{" "}
          products
        </div>
      </main>
    </div>
  );
}