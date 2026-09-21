"use client";

import { useEffect, useMemo, useState } from "react";
import { getProductCost, loadProductCosts, type ProductCost } from "@/lib/product-costs";
import { loadSupplierData, saveSupplierData } from "@/lib/supplier-data";
import { analyzeInventory } from "@/lib/inventory-analysis";
type InventoryRow = {
  sku: string;
  asin?: string;
  quantity: number;
  productName?: string;
};
type InventoryAction = {
  id: string;
  sku: string;
  productName?: string;
  action: "Restock Now" | "Prioritize" | "Plan Reorder" | "Reduce Purchase" | "Do Not Reorder";
  timestamp: string;
};

type SalesRow = {
  asin?: string;
  unitsOrdered?: number;
  unitsSold?: number;
  orderedProductSales?: number;
};

type InventoryItem = InventoryRow & {
  unitsSold: number;
  revenue: number;
  dailySales: number;
  daysOfStock: number;
  targetStock: number;
  reorderQty: number;
  status:
  | "Out of Stock"
  | "No Sales"
  | "Critical"
  | "Low Stock"
  | "Watch"
  | "Healthy"
  | "Overstock";
};

export default function InventoryPage() {
  const [inventoryRows, setInventoryRows] = useState<InventoryRow[]>([]);
  const [salesRows, setSalesRows] = useState<SalesRow[]>([]);
  const [sortField, setSortField] = useState<
    "product" | "sku" | "stock" | "unitsSold" | "dailySales" | "daysOfStock"
  >("product");
  const [statusFilter, setStatusFilter] = useState<"All" | InventoryItem["status"]>("All");
  const [reorderOnly, setReorderOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [inventoryActions, setInventoryActions] = useState<InventoryAction[]>([]);
  const [purchaseOrderStatus, setPurchaseOrderStatus] = useState<
    Record<string, "Pending" | "Ordered">
  >({});
  useEffect(() => {
    const savedPurchaseOrderStatus = localStorage.getItem(
      "purchase_order_status"
    );

    if (savedPurchaseOrderStatus) {
      try {
        setPurchaseOrderStatus(JSON.parse(savedPurchaseOrderStatus));
      } catch {
        setPurchaseOrderStatus({});
      }
    }
  }, []);
  const [productCosts, setProductCosts] = useState<ProductCost[]>([]);
  const [supplierData, setSupplierData] = useState(loadSupplierData());
  const getSupplierPurchasePrice = (sku: string) => {
    const supplier = supplierData.find((item) => item.sku === sku);
    return supplier?.purchasePrice ?? 0;
  };
  const [supplierForm, setSupplierForm] = useState({
    sku: "",
    supplierName: "",
    supplierContact: "",
    purchasePrice: "",
    moq: "",
  });
  const [targetDays, setTargetDays] = useState(30);
  const [safetyDays, setSafetyDays] = useState(7);


  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [listingRows, setListingRows] = useState<
    {
      sku: string;
      productName?: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const inventorySaved = localStorage.getItem("amazon_inventory_sync");
      const listingsSaved = localStorage.getItem("amazon_listings_sync");

      if (listingsSaved) {
        const parsed = JSON.parse(listingsSaved);

        if (Array.isArray(parsed.rows)) {
          setListingRows(parsed.rows);
        }
      }

      if (inventorySaved) {
        const parsed = JSON.parse(inventorySaved);

        if (Array.isArray(parsed.rows)) {
          setInventoryRows(parsed.rows);
        }
      }
      const loadedProductCosts = loadProductCosts();
      setProductCosts(loadedProductCosts);
      const salesSaved = localStorage.getItem("amazon_sales_sync");

      if (salesSaved) {
        const parsed = JSON.parse(salesSaved);

        if (Array.isArray(parsed.rows)) {
          setSalesRows(parsed.rows);
        }
      }
    } catch (error) {
      console.error("Inventory Analysis load error:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const savedActions = localStorage.getItem("inventory_action_history");

    if (savedActions) {
      try {
        const parsed = JSON.parse(savedActions);

        if (Array.isArray(parsed)) {
          setInventoryActions(parsed);
        }
      } catch (error) {
        console.error("Inventory action history load error:", error);
      }
    }
  }, []);

  const inventoryAnalysis = useMemo<InventoryItem[]>(() => {
    return analyzeInventory(
      inventoryRows,
      salesRows,
      listingRows,
      targetDays,
      safetyDays,
    );
  }, [inventoryRows, salesRows, listingRows, targetDays, safetyDays]);
  const sortedInventoryAnalysis = useMemo(() => {
    return [...inventoryAnalysis].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "product":
          comparison = (a.productName ?? "").localeCompare(b.productName ?? "");
          break;

        case "sku":
          comparison = (a.sku ?? "").localeCompare(b.sku ?? "");
          break;

        case "stock":
          comparison = a.quantity - b.quantity;
          break;

        case "unitsSold":
          comparison = a.unitsSold - b.unitsSold;
          break;

        case "dailySales":
          comparison = a.dailySales - b.dailySales;
          break;

        case "daysOfStock":
          comparison = a.daysOfStock - b.daysOfStock;
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [inventoryAnalysis, sortField, sortDirection]);
  const filteredInventoryAnalysis = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return sortedInventoryAnalysis.filter((item) => {
      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      const matchesSearch =
        !search ||
        (item.productName ?? "").toLowerCase().includes(search) ||
        item.sku.toLowerCase().includes(search);
      const matchesReorder =
        !reorderOnly || item.reorderQty > 0;
      return matchesStatus && matchesSearch && matchesReorder;
    });
  }, [sortedInventoryAnalysis, statusFilter, searchTerm, reorderOnly]);
  const reorderSummary = useMemo(() => {
    const reorderItems = inventoryAnalysis.filter(
      (item) => item.reorderQty > 0
    );

    return {
      skuCount: reorderItems.length,
      totalUnits: reorderItems.reduce(
        (sum, item) => sum + item.reorderQty,
        0
      ),
    };
  }, [inventoryAnalysis]);
  const purchaseOrderDraft = useMemo(() => {
    return inventoryAnalysis
      .filter(
        (item) =>
          item.reorderQty > 0 &&
          item.unitsSold > 0
      )
      .map((item) => {
        const supplier = supplierData.find(
          (s) => s.sku.trim().toLowerCase() === item.sku.trim().toLowerCase()
        );

        const moq = supplier?.moq ?? 0;

        const adjustedQty =
          moq > 0
            ? Math.ceil(item.reorderQty / moq) * moq
            : item.reorderQty;

        const supplierPrice = supplier?.purchasePrice ?? 0;
        const productCost = getProductCost(productCosts, item.sku);
        const unitCost =
          supplierPrice > 0 ? supplierPrice : productCost;

        const priority =
          item.status === "Out of Stock" ||
            item.status === "Critical"
            ? "Critical"
            : item.daysOfStock <= 7
              ? "High"
              : "Medium";

        return {
          sku: item.sku,
          productName: item.productName,
          supplierName: supplier?.supplierName || "Supplier Not Set",
          quantity: adjustedQty,
          unitCost,
          totalCost: adjustedQty * unitCost,
          priority,
        };
      })
      .sort((a, b) => {
        const priorityOrder = {
          Critical: 1,
          High: 2,
          Medium: 3,
        };

        return (
          priorityOrder[a.priority as keyof typeof priorityOrder] -
          priorityOrder[b.priority as keyof typeof priorityOrder] ||
          b.totalCost - a.totalCost
        );
      });
  }, [inventoryAnalysis, supplierData, productCosts]);
  const reorderRecommendations = useMemo(
    () =>
      inventoryAnalysis
        .filter((item) => item.reorderQty > 0 && item.unitsSold > 0)
        .map((item) => {
          const supplier = supplierData.find((s) => s.sku === item.sku);
          const moq = supplier?.moq ?? 0;

          const adjustedReorderQty =
            moq > 0
              ? Math.ceil(item.reorderQty / moq) * moq
              : item.reorderQty;

          return {
            ...item,
            reorderQty: adjustedReorderQty,
          };
        })
        .sort((a, b) => b.reorderQty - a.reorderQty),
    [inventoryAnalysis, supplierData]
  );
  const inventoryAlerts = useMemo(
    () =>
      inventoryAnalysis
        .filter(
          (item) =>
            item.status === "Out of Stock" ||
            item.status === "Critical" ||
            item.status === "Low Stock" ||
            item.status === "Overstock"
        )
        .sort((a, b) => {
          const priority: Record<string, number> = {
            "Out of Stock": 1,
            Critical: 2,
            "Low Stock": 3,
            Overstock: 4,
          };

          return (priority[a.status] ?? 99) - (priority[b.status] ?? 99);
        }),
    [inventoryAnalysis]
  );
  const purchasePlanning = useMemo(() => {
    const products = inventoryAnalysis.filter(
      (item) => item.reorderQty > 0 && item.unitsSold > 0
    );
    const productsMissingCost = products.filter((item) => {
      const supplier = supplierData.find((s) => s.sku === item.sku);
      const supplierPrice = supplier?.purchasePrice ?? 0;
      const productCost = getProductCost(productCosts, item.sku);

      return supplierPrice <= 0 && productCost <= 0;
    });
    const productsMissingSupplier = products.filter(
      (item) => getSupplierPurchasePrice(item.sku) <= 0
    );

    const totalUnitsToReorder = products.reduce(
      (sum, item) => {
        const supplier = supplierData.find((s) => s.sku === item.sku);
        const moq = supplier?.moq ?? 0;

        const adjustedQty =
          moq > 0
            ? Math.ceil(item.reorderQty / moq) * moq
            : item.reorderQty;

        return sum + adjustedQty;
      },
      0
    );

    const estimatedPurchaseCost = products.reduce(
      (sum, item) => {
        const supplier = supplierData.find((s) => s.sku === item.sku);
        const moq = supplier?.moq ?? 0;

        const adjustedQty =
          moq > 0
            ? Math.ceil(item.reorderQty / moq) * moq
            : item.reorderQty;

        const supplierPrice = supplier?.purchasePrice ?? 0;
        const productCost = getProductCost(productCosts, item.sku);
        const purchasePrice = supplierPrice > 0 ? supplierPrice : productCost;

        return sum + adjustedQty * purchasePrice;
      },
      0
    );

    const criticalUnitsToReorder = products
      .filter(
        (item) =>
          item.status === "Out of Stock" || item.status === "Critical"
      )
      .reduce((sum, item) => sum + item.reorderQty, 0);

    const criticalPurchaseCost = products
      .filter(
        (item) =>
          item.status === "Out of Stock" || item.status === "Critical"
      )
      .reduce((sum, item) => {
        const supplier = supplierData.find((s) => s.sku === item.sku);
        const moq = supplier?.moq ?? 0;

        const adjustedQty =
          moq > 0
            ? Math.ceil(item.reorderQty / moq) * moq
            : item.reorderQty;

        const supplierPrice = supplier?.purchasePrice ?? 0;
        const productCost = getProductCost(productCosts, item.sku);
        const purchasePrice = supplierPrice > 0 ? supplierPrice : productCost;

        return sum + adjustedQty * purchasePrice;
      }, 0);

    return {
      products,
      productsMissingCost,
      productsMissingSupplier,
      totalUnitsToReorder,
      estimatedPurchaseCost,
      criticalUnitsToReorder,
      criticalPurchaseCost,
    };
  }, [inventoryAnalysis, productCosts, supplierData]);

  const handleSort = (
    field: "product" | "sku" | "stock" | "unitsSold" | "dailySales" | "daysOfStock"
  ) => {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  const handleInventoryAction = (
    item: InventoryItem,
    action: InventoryAction["action"]
  ) => {
    const newAction: InventoryAction = {
      id: `${Date.now()}-${item.sku}`,
      sku: item.sku,
      productName: item.productName,
      action,
      timestamp: new Date().toISOString(),
    };

    setInventoryActions((prev) => {
      const updated = [newAction, ...prev];
      localStorage.setItem(
        "inventory_action_history",
        JSON.stringify(updated)
      );
      return updated;
    });
  };

  const summary = useMemo(() => {
    return {
      totalSKUs: inventoryAnalysis.length,

      totalUnits: inventoryAnalysis.reduce(
        (sum, item) => sum + item.quantity,
        0
      ),

      outOfStock: inventoryAnalysis.filter(
        (item) => item.status === "Out of Stock"
      ).length,

      critical: inventoryAnalysis.filter(
        (item) => item.status === "Critical"
      ).length,

      lowStock: inventoryAnalysis.filter(
        (item) => item.status === "Low Stock"
      ).length,
      noSales: inventoryAnalysis.filter(
        (item) => item.status === "No Sales"
      ).length,
      watch: inventoryAnalysis.filter(
        (item) => item.status === "Watch"
      ).length,

      healthy: inventoryAnalysis.filter(
        (item) => item.status === "Healthy"
      ).length,

      overstock: inventoryAnalysis.filter(
        (item) => item.status === "Overstock"
      ).length,
    };
  }, [inventoryAnalysis]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="text-slate-600">
          Loading Inventory Analysis...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Inventory Analysis
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Monitor stock levels, sales velocity and inventory health.
          </p>
          <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
            <p className="text-sm font-semibold text-orange-700">
              Reorder Recommendations
            </p>
            <p className="mt-1 text-sm text-orange-600">
              Review products that may need replenishment based on current sales velocity.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-9">

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              TOTAL SKUs
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {summary.totalSKUs}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              TOTAL UNITS
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {summary.totalUnits}
            </p>
          </div>


          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6"> */}
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-slate-500">
                SKUs to Reorder
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-9000">
                {reorderSummary.skuCount}
              </p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-slate-500">
                Total Units to Order
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {reorderSummary.totalUnits}
              </p>
            </div>
          {/* </div> */}


          <button
            type="button"
            onClick={() => setStatusFilter("Out of Stock")}
            className="rounded-xl bg-white p-5 shadow-sm text-left hover:bg-red-50 transition cursor-pointer"
          >
            <p className="text-xs font-medium text-slate-500">
              OUT OF STOCK
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {summary.outOfStock}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("Critical")}
            className="rounded-xl bg-white p-5 shadow-sm text-left hover:bg-red-50 transition cursor-pointer"
          >
            <p className="text-xs font-medium text-slate-500">
              CRITICAL
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {summary.critical}
            </p>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("Low Stock")}
            className="rounded-xl bg-white p-5 shadow-sm text-left hover:bg-orange-50 transition cursor-pointer"
          >
            <p className="text-xs font-medium text-slate-500">
              LOW STOCK
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {summary.lowStock}
            </p>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("No Sales")}
            className="rounded-xl bg-white p-5 shadow-sm text-left hover:bg-slate-50 transition cursor-pointer"
          >
            <p className="text-xs font-medium text-slate-500">
              NO SALES
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {summary.noSales}
            </p>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("Watch")}
            className="rounded-xl bg-white p-5 shadow-sm text-left hover:bg-yellow-50 transition cursor-pointer"
          >
            <p className="text-xs font-medium text-slate-500">
              WATCH
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {summary.watch}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("Healthy")}
            className="rounded-xl bg-white p-5 shadow-sm text-left hover:bg-green-50 transition cursor-pointer"
          >
            <p className="text-xs font-medium text-slate-500">
              HEALTHY
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {summary.healthy}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("Overstock")}
            className="rounded-xl bg-white p-5 shadow-sm text-left hover:bg-blue-50 transition cursor-pointer"
          >
            <p className="text-xs font-medium text-slate-500">
              OVERSTOCK
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {summary.overstock}
            </p>
          </button>

        </div>

        {/* Inventory Table */}
        {/* Reorder Recommendations */}
        <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Reorder Recommendations
            </h2>
            <div className="mt-3 flex flex-wrap gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                Target Days
                <input
                  type="number"
                  min="1"
                  value={targetDays}
                  onChange={(e) => setTargetDays(Number(e.target.value))}
                  className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-slate-500"
                />
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-600">
                Safety Days
                <input
                  type="number"
                  min="0"
                  value={safetyDays}
                  onChange={(e) => setSafetyDays(Number(e.target.value))}
                  className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-slate-500"
                />
              </label>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Products needing replenishment based on sales velocity, with 30 days target coverage + 7 days safety stock.
            </p>
          </div>

          {reorderRecommendations.length === 0 ? (
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
              No reorder recommendations right now.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th className="px-3 py-3">Product</th>
                    <th className="px-3 py-3">SKU</th>
                    <th className="px-3 py-3 text-right">Stock</th>
                    <th className="px-3 py-3 text-right">Daily Sales</th>
                    <th className="px-3 py-3 text-right">Target Stock</th>
                    <th className="px-3 py-3 text-right">Reorder Qty</th>
                    <th className="px-3 py-3 text-right">Coverage</th>
                    <th className="px-3 py-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {reorderRecommendations.slice(0, 10).map((item) => (
                    <tr key={item.sku} className="border-b border-slate-100">
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {item.productName ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {item.sku}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-700">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-700">
                        {item.dailySales.toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-700">
                        {item.targetStock}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-amber-600">
                        {item.reorderQty}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-700">
                        {Number.isFinite(item.daysOfStock)
                          ? `${Math.round(item.daysOfStock)} days`
                          : "No sales"}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {item.status === "Out of Stock" && (
                          <button
                            type="button"
                            onClick={() => handleInventoryAction(item, "Restock Now")}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Restock Now
                          </button>
                        )}

                        {item.status === "Critical" && (
                          <button
                            type="button"
                            onClick={() => handleInventoryAction(item, "Prioritize")}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Prioritize
                          </button>
                        )}

                        {item.status === "Low Stock" && (
                          <button
                            type="button"
                            onClick={() => handleInventoryAction(item, "Plan Reorder")}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Plan Reorder
                          </button>
                        )}

                        {item.status === "Overstock" && (
                          <button
                            type="button"
                            onClick={() => handleInventoryAction(item, "Reduce Purchase")}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Reduce Purchase
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* Purchase Planning */}
        <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Purchase Planning
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Estimated inventory purchase requirements based on current reorder recommendations.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">
                Products to Reorder
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {purchasePlanning.products.length}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">
                Units to Reorder
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {purchasePlanning.totalUnitsToReorder}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">
                Estimated Purchase Cost
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                ₹{purchasePlanning.estimatedPurchaseCost.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">
                Critical Purchase Cost
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                ₹{purchasePlanning.criticalPurchaseCost.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>
        {purchasePlanning.productsMissingCost.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="font-semibold text-amber-900">
              ⚠️ Missing Purchase Cost
            </p>
            <p className="mt-1 text-sm text-amber-800">
              {purchasePlanning.productsMissingCost.length} SKU
              {purchasePlanning.productsMissingCost.length !== 1 ? "s" : ""} need purchase cost data before the purchase cost estimate can be considered accurate.
            </p>
          </div>
        )}
        {purchasePlanning.productsMissingSupplier.length > 0 && (
          <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
            <p className="font-semibold text-orange-900">
              ⚠️ Missing Supplier Price
            </p>
            <p className="mt-1 text-sm text-orange-800">
              {purchasePlanning.productsMissingSupplier.length} SKU
              {purchasePlanning.productsMissingSupplier.length !== 1 ? "s" : ""} need supplier purchase price data before the reorder cost estimate can be fully accurate.
            </p>
          </div>
        )}
        {/* Purchase Order Draft */}
        <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Purchase Order Draft
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Supplier-wise reorder quantities and estimated purchase costs.
            </p>
          </div>

          {purchaseOrderDraft.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              No purchase orders are currently required.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3">Priority</th>
                    <th className="px-3 py-3">Supplier</th>
                    <th className="px-3 py-3">Product</th>
                    <th className="px-3 py-3">SKU</th>
                    <th className="px-3 py-3 text-right">Qty</th>
                    <th className="px-3 py-3 text-right">Unit Cost</th>
                    <th className="px-3 py-3 text-right">Total Cost</th>
                    <th className="px-3 py-3 text-center">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {purchaseOrderDraft.map((item) => (
                    <tr
                      key={item.sku}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-3 py-3">
                        {item.priority === "Critical" ? (
                          <span className="font-semibold text-red-600">
                            Critical
                          </span>
                        ) : item.priority === "High" ? (
                          <span className="font-semibold text-orange-600">
                            High
                          </span>
                        ) : (
                          <span className="font-semibold text-yellow-600">
                            Medium
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3 font-medium text-slate-800">
                        {item.supplierName}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {supplierData.find(
                          (supplier) =>
                            supplier.sku.trim().toLowerCase() ===
                            item.sku.trim().toLowerCase()
                        )?.supplierContact || "—"}
                      </td>

                      <td className="px-3 py-3 text-slate-700">
                        {item.productName ?? "—"}
                      </td>

                      <td className="px-3 py-3 text-slate-500">
                        {item.sku}
                      </td>

                      <td className="px-3 py-3 text-right font-semibold text-orange-600">
                        {item.quantity}
                      </td>

                      <td className="px-3 py-3 text-right text-slate-700">
                        ₹{item.unitCost.toLocaleString("en-IN")}
                      </td>

                      <td className="px-3 py-3 text-right font-semibold text-slate-900">
                        ₹{item.totalCost.toLocaleString("en-IN")}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const currentStatus =
                              purchaseOrderStatus[item.sku] ?? "Pending";

                            const nextStatus: "Pending" | "Ordered" =
                              currentStatus === "Pending" ? "Ordered" : "Pending";

                            const updatedStatus = {
                              ...purchaseOrderStatus,
                              [item.sku]: nextStatus,
                            };

                            setPurchaseOrderStatus(updatedStatus);
                            localStorage.setItem(
                              "purchase_order_status",
                              JSON.stringify(updatedStatus)
                            );
                          }}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${purchaseOrderStatus[item.sku] === "Ordered"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                          {purchaseOrderStatus[item.sku] ?? "Pending"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* Supplier Management */}
        <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Supplier Management
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Add supplier purchase prices for accurate reorder cost estimates.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <input
              value={supplierForm.sku}
              onChange={(e) =>
                setSupplierForm((prev) => ({ ...prev, sku: e.target.value }))
              }
              placeholder="SKU"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none"
            />

            <input
              value={supplierForm.supplierName}
              onChange={(e) =>
                setSupplierForm((prev) => ({
                  ...prev,
                  supplierName: e.target.value,
                }))
              }
              placeholder="Supplier Name"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none"
            />

            <input
              value={supplierForm.supplierContact}
              onChange={(e) =>
                setSupplierForm((prev) => ({
                  ...prev,
                  supplierContact: e.target.value,
                }))
              }
              placeholder="Contact"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none"
            />

            <input
              type="number"
              min="0"
              value={supplierForm.purchasePrice}
              onChange={(e) =>
                setSupplierForm((prev) => ({
                  ...prev,
                  purchasePrice: e.target.value,
                }))
              }
              placeholder="Purchase Price"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none"
            />

            <input
              type="number"
              min="0"
              value={supplierForm.moq}
              onChange={(e) =>
                setSupplierForm((prev) => ({ ...prev, moq: e.target.value }))
              }
              placeholder="MOQ"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              if (!supplierForm.sku.trim() || Number(supplierForm.purchasePrice) <= 0) {
                return;
              }

              const updated = [
                ...supplierData.filter((item) => item.sku !== supplierForm.sku.trim()),
                {
                  sku: supplierForm.sku.trim(),
                  supplierName: supplierForm.supplierName.trim(),
                  supplierContact: supplierForm.supplierContact.trim(),
                  purchasePrice: Number(supplierForm.purchasePrice),
                  moq: Number(supplierForm.moq) || 0,
                },
              ];

              setSupplierData(updated);
              saveSupplierData(updated);

              setSupplierForm({
                sku: "",
                supplierName: "",
                supplierContact: "",
                purchasePrice: "",
                moq: "",
              });
            }}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Save Supplier
          </button>

          {supplierData.length > 0 && (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th className="px-3 py-3">SKU</th>
                    <th className="px-3 py-3">Supplier</th>
                    <th className="px-3 py-3">Contact</th>
                    <th className="px-3 py-3">Contact</th>
                    <th className="px-3 py-3 text-right">Purchase Price</th>
                    <th className="px-3 py-3 text-right">MOQ</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierData.map((supplier) => (
                    <tr key={supplier.sku} className="border-b border-slate-100">
                      <td className="px-3 py-3 font-medium text-slate-700">
                        {supplier.sku}
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {supplier.supplierName || "—"}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {supplier.supplierContact || "—"}
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-slate-700">
                        ₹{supplier.purchasePrice.toLocaleString("en-IN")}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-700">
                        {supplier.moq || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* Inventory Action Center */}
        <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Inventory Action Center
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Prioritized actions based on stock levels, sales velocity and reorder requirements.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-red-600">
                Urgent
              </p>
              <p className="mt-1 text-2xl font-bold text-red-700">
                {
                  inventoryAnalysis.filter(
                    (item) =>
                      item.status === "Out of Stock" ||
                      item.status === "Critical"
                  ).length
                }
              </p>
              <p className="mt-1 text-xs text-red-600">
                Immediate attention
              </p>
            </div>

            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-orange-600">
                Restock Now
              </p>
              <p className="mt-1 text-2xl font-bold text-orange-700">
                {reorderRecommendations.length}
              </p>
              <p className="mt-1 text-xs text-orange-600">
                Products to replenish
              </p>
            </div>

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-yellow-700">
                Watch
              </p>
              <p className="mt-1 text-2xl font-bold text-yellow-700">
                {
                  inventoryAnalysis.filter(
                    (item) => item.status === "Watch"
                  ).length
                }
              </p>
              <p className="mt-1 text-xs text-yellow-700">
                Monitor closely
              </p>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                Overstock
              </p>
              <p className="mt-1 text-2xl font-bold text-blue-700">
                {
                  inventoryAnalysis.filter(
                    (item) => item.status === "Overstock"
                  ).length
                }
              </p>
              <p className="mt-1 text-xs text-blue-600">
                Excess inventory
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">Priority</th>
                  <th className="px-3 py-3">Product</th>
                  <th className="px-3 py-3">SKU</th>
                  <th className="px-3 py-3 text-right">Stock</th>
                  <th className="px-3 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {inventoryAlerts.slice(0, 10).map((item) => (
                  <tr
                    key={item.sku}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-3 py-3">
                      {item.status === "Out of Stock" ||
                        item.status === "Critical" ? (
                        <span className="font-semibold text-red-600">
                          Urgent
                        </span>
                      ) : item.status === "Low Stock" ||
                        item.status === "Watch" ? (
                        <span className="font-semibold text-orange-600">
                          Attention
                        </span>
                      ) : (
                        <span className="font-semibold text-blue-600">
                          Review
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-3 font-medium text-slate-800">
                      {item.productName ?? "—"}
                    </td>

                    <td className="px-3 py-3 text-slate-600">
                      {item.sku}
                    </td>

                    <td className="px-3 py-3 text-right font-semibold text-slate-800">
                      {item.quantity}
                    </td>

                    <td className="px-3 py-3 text-right">
                      {item.reorderQty > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleInventoryAction(item, "Restock Now")}
                          className="font-semibold text-orange-600 hover:text-orange-700"
                        >
                          Order {item.reorderQty}
                        </button>
                      ) : item.status === "Overstock" ? (
                        <button
                          type="button"
                          onClick={() => handleInventoryAction(item, "Prioritize")}
                          className="font-medium text-blue-600 hover:text-blue-700"
                        >
                          Review Stock
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleInventoryAction(item, "Do Not Reorder")}
                          className="font-medium text-slate-400 hover:text-slate-600"
                        >
                          Monitor
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inventory Alerts */}
        {/* Inventory Action History */}
        <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Inventory Action History
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Recent inventory actions recorded from this dashboard.
            </p>
          </div>

          {inventoryActions.length === 0 ? (
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
              No inventory actions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th className="px-3 py-3">Product</th>
                    <th className="px-3 py-3">SKU</th>
                    <th className="px-3 py-3">Action</th>
                    <th className="px-3 py-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryActions.slice(0, 10).map((action) => (
                    <tr key={action.id} className="border-b border-slate-100">
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {action.productName ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {action.sku}
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-700">
                        {action.action}
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        <div className="flex items-center justify-between gap-3">
                          <span>{new Date(action.timestamp).toLocaleString()}</span>

                          <button
                            type="button"
                            onClick={() => {
                              const updatedActions = inventoryActions.filter(
                                (item) => item.id !== action.id
                              );
                              setInventoryActions(updatedActions);
                              localStorage.setItem(
                                "inventory_action_history",
                                JSON.stringify(updatedActions)
                              );
                            }}
                            className="text-slate-400 hover:text-red-600 font-bold"
                            title="Delete action"
                          >
                            ×
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Inventory Alerts
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Quick view of inventory items that need attention.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <button
              type="button"
              onClick={() => setStatusFilter("Out of Stock")}
              className="rounded-lg border border-slate-200 p-4 text-left hover:bg-slate-50"
            >
              <p className="text-xs font-medium uppercase text-slate-500">
                Out of Stock
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {summary.outOfStock}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("Critical")}
              className="rounded-lg border border-slate-200 p-4 text-left hover:bg-slate-50"
            >
              <p className="text-xs font-medium uppercase text-slate-500">
                Critical
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {summary.critical}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("Low Stock")}
              className="rounded-lg border border-slate-200 p-4 text-left hover:bg-slate-50"
            >
              <p className="text-xs font-medium uppercase text-slate-500">
                Low Stock
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {summary.lowStock}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("Overstock")}
              className="rounded-lg border border-slate-200 p-4 text-left hover:bg-slate-50"
            >
              <p className="text-xs font-medium uppercase text-slate-500">
                Overstock
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {summary.overstock}
              </p>
            </button>
          </div>
          {/* No Sales Action */}
          <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                No Sales Products
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Products with no recorded sales velocity. Review before placing new inventory orders.
              </p>
            </div>

            {inventoryAnalysis.filter((item) => item.status === "No Sales").length === 0 ? (
              <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                No no-sales products found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                      <th className="px-3 py-3">Product</th>
                      <th className="px-3 py-3">SKU</th>
                      <th className="px-3 py-3 text-right">Stock</th>
                      <th className="px-3 py-3 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {inventoryAnalysis
                      .filter((item) => item.status === "No Sales")
                      .slice(0, 10)
                      .map((item) => (
                        <tr key={item.sku} className="border-b border-slate-100">
                          <td className="px-3 py-3 font-medium text-slate-900">
                            {item.productName ?? "—"}
                          </td>
                          <td className="px-3 py-3 text-slate-600">
                            {item.sku}
                          </td>
                          <td className="px-3 py-3 text-right text-slate-700">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                handleInventoryAction(item, "Do Not Reorder")
                              }
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Do Not Reorder
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div className="mt-8 overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
            <div className="flex-1 min-w-[240px]">
              <input
                type="text"
                placeholder="Search product or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-500"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                Filter by Status
              </p>
            </div>
            <p className="text-xs text-slate-500">
              Showing {filteredInventoryAnalysis.length} of {inventoryAnalysis.length} SKUs
            </p>
            <div>
              <p className="text-sm font-medium text-slate-700">
                Search Product / SKU
              </p>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search product or SKU..."
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-slate-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "All" | InventoryItem["status"]
                )
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-slate-500"
            >
              <option value="All">All Status</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Critical">Critical</option>
              <option value="Low Stock">Low Stock</option>
              <option value="No Sales">No Sales</option>
              <option value="Watch">Watch</option>
              <option value="Healthy">Healthy</option>
              <option value="Overstock">Overstock</option>
            </select>
            {statusFilter !== "All" && (
              <button
                type="button"
                onClick={() => setStatusFilter("All")}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Clear Filter
              </button>
            )}

            <button
              type="button"
              onClick={() => setReorderOnly(!reorderOnly)}
              className={`ml-2 rounded-lg border px-3 py-2 text-sm font-medium ${reorderOnly
                  ? "border-orange-500 bg-orange-500 text-white"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                }`}
            >
              {reorderOnly ? "Showing Reorder Only" : "Reorder Only"}
            </button>
          </div>

          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Inventory Health
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              SKU-level inventory and sales velocity.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">

              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <button
                      type="button"
                      onClick={() => handleSort("product")}
                      className="font-medium hover:text-slate-900"
                    >
                      Product
                      {sortField === "product" && (sortDirection === "asc" ? " ↑" : " ↓")}
                    </button>
                  </th>

                  <th className="px-6 py-4 text-left">
                    <button
                      type="button"
                      onClick={() => handleSort("sku")}
                      className="font-medium hover:text-slate-900"
                    >
                      SKU
                      {sortField === "sku" && (sortDirection === "asc" ? " ↑" : " ↓")}
                    </button>
                  </th>

                  <th className="px-6 py-4 text-left">
                    <button
                      type="button"
                      onClick={() => handleSort("stock")}
                      className="font-medium hover:text-slate-900"
                    >
                      Stock
                      {sortField === "stock" && (sortDirection === "asc" ? " ↑" : " ↓")}
                    </button>
                  </th>

                  <th className="px-6 py-4 text-left">
                    <button
                      type="button"
                      onClick={() => handleSort("unitsSold")}
                      className="font-medium hover:text-slate-900"
                    >
                      Units Sold
                      {sortField === "unitsSold" &&
                        (sortDirection === "asc" ? " ↑" : " ↓")}
                    </button>
                  </th>

                  <th className="px-6 py-4 text-left">
                    <button
                      type="button"
                      onClick={() => handleSort("dailySales")}
                      className="font-medium hover:text-slate-900"
                    >
                      Daily Sales
                      {sortField === "dailySales" &&
                        (sortDirection === "asc" ? " ↑" : " ↓")}
                    </button>
                  </th>

                  <th className="px-6 py-4 text-left">
                    <button
                      type="button"
                      onClick={() => handleSort("daysOfStock")}
                      className="font-medium hover:text-slate-900"
                    >
                      Days of Stock
                      {sortField === "daysOfStock" &&
                        (sortDirection === "asc" ? " ↑" : " ↓")}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Reorder
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Priority
                  </th>

                  <th className="px-6 py-4 text-left">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredInventoryAnalysis.map((item, index) => {

                  const days = Number.isFinite(item.daysOfStock)
                    ? Math.round(item.daysOfStock)
                    : null;

                  return (
                    <tr
                      key={`${item.sku}-${index}`}
                      className="hover:bg-slate-50"
                    >

                      <td className="px-6 py-4 font-medium text-slate-900">
                        {item.productName ?? "—"}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {item.sku}
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {item.quantity}
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {item.unitsSold}
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {item.dailySales.toFixed(2)}
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {item.unitsSold === 0
                          ? "No sales"
                          : `${days ?? 0} days`}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold">
                        {item.reorderQty > 0 ? (
                          <span className="text-orange-600">
                            {item.reorderQty}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center text-sm font-semibold">
                        {item.reorderQty > 0 ? (
                          item.status === "Out of Stock" ? (
                            <span className="text-red-600">Critical</span>
                          ) : item.daysOfStock <= 7 ? (
                            <span className="text-orange-600">High</span>
                          ) : (
                            <span className="text-yellow-600">Medium</span>
                          )
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={item.status} />
                      </td>

                    </tr>
                  );
                })}

                {filteredInventoryAnalysis.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      No inventory data found.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>
          </div>

        </div>

      </div>
    </main>
  );
}

function StatusBadge({
  status,
}: {
  status: InventoryItem["status"];
}) {
  const classes = {
    "Out of Stock":
      "bg-red-100 text-red-700",
    "No Sales":
      "bg-slate-100 text-slate-700",
    Critical:
      "bg-red-100 text-red-700",
    "Low Stock":
      "bg-orange-100 text-orange-700",
    Watch:
      "bg-yellow-100 text-yellow-700",
    Healthy:
      "bg-green-100 text-green-700",
    Overstock:
      "bg-blue-100 text-blue-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${classes[status]}`}
    >
      {status}
    </span>
  );
}
