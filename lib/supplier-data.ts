export type SupplierData = {
    sku: string;
    supplierName: string;
    supplierContact: string;
    purchasePrice: number;
    moq: number;
  };
  
  const STORAGE_KEY = "amazon_supplier_data";
  
  export function loadSupplierData(): SupplierData[] {
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
  
      return parsed;
    } catch {
      return [];
    }
  }
  
  export function saveSupplierData(data: SupplierData[]): void {
    if (typeof window === "undefined") {
      return;
    }
  
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }