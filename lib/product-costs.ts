export type ProductCost = {
    sku: string;
    cost: number;
  };
  
  const STORAGE_KEY = "amazon_product_costs";
  
  function normalizeSku(sku: string): string {
    return sku.trim().toLowerCase();
  }
  
  export function loadProductCosts(): ProductCost[] {
    if (typeof window === "undefined") {
      return [];
    }
  
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
  
      if (!saved) {
        return [];
      }
  
      const parsed = JSON.parse(saved);
  
      if (!Array.isArray(parsed)) {
        return [];
      }
  
      return parsed.filter(
        (item): item is ProductCost =>
          item &&
          typeof item.sku === "string" &&
          typeof item.cost === "number"
      );
    } catch {
      return [];
    }
  }
  
  export function saveProductCosts(costs: ProductCost[]): void {
    if (typeof window === "undefined") {
      return;
    }
  
    localStorage.setItem(STORAGE_KEY, JSON.stringify(costs));
  }
  
  export function getProductCost(
    costs: ProductCost[],
    sku: string
  ): number {
    const normalizedSku = normalizeSku(sku);
  
    const match = costs.find(
      (item) => normalizeSku(item.sku) === normalizedSku
    );
  
    return match?.cost ?? 0;
  }
  
  export function setProductCost(
    costs: ProductCost[],
    sku: string,
    cost: number
  ): ProductCost[] {
    const normalizedSku = normalizeSku(sku);
  
    const existingIndex = costs.findIndex(
      (item) => normalizeSku(item.sku) === normalizedSku
    );
  
    const updated = [...costs];
  
    if (existingIndex >= 0) {
      updated[existingIndex] = {
        ...updated[existingIndex],
        cost,
      };
    } else {
      updated.push({
        sku: sku.trim(),
        cost,
      });
    }
  
    saveProductCosts(updated);
  
    return updated;
  }