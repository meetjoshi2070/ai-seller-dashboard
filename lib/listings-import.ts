export type ListingRow = {
    sku: string;
    asin?: string;
    productName?: string;
    sellingPrice?: number;
  };
  
  function normalizeColumnName(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, "-");
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
      } else if (char === "\t" && !insideQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  
    result.push(current.trim());
  
    return result;
  }
  
  export function parseAmazonListingsReport(
    reportText: string
  ): ListingRow[] {
    const lines = reportText
      .split(/\r?\n/)
      .filter((line) => line.trim());
  
    if (lines.length < 2) {
      throw new Error("The Amazon Listings Report is empty.");
    }
  
    const headers = parseCsvLine(lines[0]).map(normalizeColumnName);
  
    const skuIndex = headers.findIndex((header) =>
      ["seller-sku", "sku"].includes(header)
    );
  
    const asinIndex = headers.findIndex((header) =>
      ["asin1", "asin", "child-asin"].includes(header)
    );
  
    const productNameIndex = headers.findIndex((header) =>
      ["item-name", "product-name", "title"].includes(header)
    );
    const sellingPriceIndex = headers.findIndex((header) =>
        ["price", "listing-price", "your-price", "standard-price"].includes(header)
      );
  
    if (skuIndex === -1) {
      throw new Error(
        "Could not find the seller SKU column in the Amazon Listings Report."
      );
    }
  
    if (asinIndex === -1) {
      throw new Error(
        "Could not find the ASIN column in the Amazon Listings Report."
      );
    }
  
    const rows: ListingRow[] = [];
  
    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);
  
      const sku = values[skuIndex]?.trim();
      const asin = values[asinIndex]?.trim();
  
      if (!sku || !asin) continue;
  
      const productName =
        productNameIndex !== -1
          ? values[productNameIndex]?.trim() || undefined
          : undefined;
          const sellingPrice =
  sellingPriceIndex !== -1
    ? Number(
        values[sellingPriceIndex]
          ?.replace(/[₹$,]/g, "")
          .trim()
      ) || undefined
    : undefined;
  
    rows.push({
        sku,
        asin,
        productName,
        sellingPrice,
      });
    }
    if (rows.length === 0) {
      throw new Error(
        "No valid SKU → ASIN mappings were found in the Listings Report."
      );
    }
  
    console.log("AMAZON LISTINGS:", rows.length);
    console.log("FIRST 10 SKU → ASIN:", rows.slice(0, 10));
  
    return rows;
}