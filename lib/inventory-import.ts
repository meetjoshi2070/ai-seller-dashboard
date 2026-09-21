export type InventoryRow = {
    sku: string;
    asin?: string;
    quantity: number;
    productName?: string;
  };
  
  export type InventorySyncResult = {
    updatedProducts: number;
    matchedSkus: number;
    unmatchedAmazonSkus: InventoryRow[];
    missingDashboardSkus: string[];
  };
  
  function normalizeColumnName(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[_\s]+/g, "-");
  }
  
  function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let insideQuotes = false;
  
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
  
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === "," && !insideQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  
    result.push(current.trim());
  
    return result;
  }
  function detectDelimiter(line: string): string {
    if (line.includes("\t")) {
      return "\t";
    }
  
    return ",";
  }
  export function parseAmazonInventoryCsv(csvText: string): InventoryRow[] {
    const lines = csvText
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((line) => line.trim());
  
    if (lines.length < 2) {
      throw new Error("The inventory file is empty or has no data rows.");
    }
  
    const delimiter = detectDelimiter(lines[0]);
  
    const parseLine = (line: string): string[] => {
      if (delimiter === "\t") {
        return line.split("\t").map((value) => value.trim());
      }
  
      return parseCsvLine(line);
    };
  
    const headers = parseLine(lines[0]).map(normalizeColumnName);
  
    console.log("AMAZON HEADERS:", headers);
  
    const skuIndex = headers.findIndex((header) =>
      ["seller-sku", "sku"].includes(header)
    );
    const asinIndex = headers.findIndex((header) =>
        ["asin", "child-asin", "parent-asin", "asin1"].includes(header)
      );
  
    const quantityIndex = headers.findIndex((header) =>
      ["quantity", "available", "available-quantity"].includes(header)
    );
  
    const productNameIndex = headers.findIndex((header) =>
      ["item-name", "product-name", "productname", "title"].includes(header)
    );
  
    if (skuIndex === -1) {
      throw new Error(
        "Could not find the SKU column. Expected seller-sku or sku."
      );
    }
  
    if (quantityIndex === -1) {
      throw new Error(
        "Could not find the inventory quantity column. Expected quantity, available, or available-quantity."
      );
    }
  
    const rows: InventoryRow[] = [];
  
    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
  
      const sku = values[skuIndex]?.trim();
      const asin = asinIndex !== -1 ? values[asinIndex]?.trim() : undefined;
  
      if (!sku) continue;
  
      const quantityRaw = values[quantityIndex]?.trim() ?? "";
      const quantity = Number(quantityRaw);
  
      if (!Number.isFinite(quantity)) {
        continue;
      }
  
      const productName =
        productNameIndex !== -1
          ? values[productNameIndex]?.trim() || undefined
          : undefined;
  
          rows.push({
            sku,
            asin,
            quantity: Math.max(0, Math.floor(quantity)),
            productName,
          });
    }
  
    if (rows.length === 0) {
      throw new Error("No valid inventory rows were found in the file.");
    }
  
    console.log("AMAZON INVENTORY ROWS:", rows.length);
    console.log("FIRST 10 AMAZON SKUS:", rows.slice(0, 10));
    console.log("FIRST 10 INVENTORY ROWS WITH ASIN:", rows.slice(0, 10).map(row => ({
        sku: row.sku,
        asin: row.asin,
        quantity: row.quantity,
      })));
  
    return rows;
  }