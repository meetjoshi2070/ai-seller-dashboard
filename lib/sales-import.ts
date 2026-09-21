export type SalesRow = {
  asin: string;
  title: string;
  orders: number;
  unitsOrdered: number;
  unitsSold: number;
  orderedProductSales: number;
};
  
  function parseNumber(value: string): number {
    const cleaned = value
      .replace(/₹/g, "")
      .replace(/[$€£]/g, "")
      .replace(/,/g, "")
      .replace(/%/g, "")
      .trim();
  
    const number = Number(cleaned);
  
    return Number.isFinite(number) ? number : 0;
  }
  
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
  
  export function parseAmazonSalesCsv(csvText: string): SalesRow[] {
    const lines = csvText
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  
    if (lines.length < 2) {
      throw new Error("The sales file is empty or has no data rows.");
    }
  
    // Amazon reports are normally TSV.
    // Some CSV exports may still be comma separated.
    const delimiter = lines[0].includes("\t") ? "\t" : ",";
  
    const parseLine = (line: string): string[] => {
      if (delimiter === "\t") {
        return line.split("\t").map((value) => value.trim());
      }
  
      return parseCsvLine(line);
    };
  
    const headers = parseLine(lines[0]).map(normalizeColumnName);
  
    console.log("SALES HEADERS:", headers);
  
    /*
     * ASIN
     *
     * Amazon may call this:
     * - child-asin
     * - asin
     * - parent-asin
     *
     * We specifically prefer child ASIN.
     */
    const childAsinIndex = headers.findIndex(
      (header) =>
        header.includes("child") &&
        header.includes("asin")
    );
  
    const asinIndex =
      childAsinIndex !== -1
        ? childAsinIndex
        : headers.findIndex((header) => header === "asin");
  
    /*
     * Product title
     */
    const titleIndex = headers.findIndex(
      (header) =>
        header === "title" ||
        header === "item-name" ||
        header === "product-name"
    );
  
    /*
     * Units ordered
     */
    const unitsIndex = headers.findIndex(
      (header) =>
        header === "units-ordered" ||
        header === "units-ordered-b2b"
    );
    const ordersIndex = headers.findIndex(
      (header) =>
        header === "total-order-items" ||
        header === "total-order-items-b2b"
    );
  
    /*
     * Ordered product sales
     */
    const salesIndex = headers.findIndex(
      (header) =>
        header === "ordered-product-sales" ||
        header === "ordered-product-sales-b2b"
    );
  
    console.log("ASIN INDEX:", asinIndex);
    console.log("TITLE INDEX:", titleIndex);
    console.log("UNITS INDEX:", unitsIndex);
    console.log("ORDERS INDEX:", ordersIndex);
    console.log(
      "ORDER COLUMN SAMPLE:",
      lines.slice(1, 6).map((line) => parseLine(line)[ordersIndex])
    );
console.log("SALES HEADERS:", headers);
    console.log("SALES INDEX:", salesIndex);
  
    if (asinIndex === -1) {
      throw new Error(
        "Could not find the ASIN column in the sales report."
      );
    }
  
    if (unitsIndex === -1) {
      throw new Error(
        "Could not find the Units Ordered column in the sales report."
      );
    }
  
    if (salesIndex === -1) {
      throw new Error(
        "Could not find the Ordered Product Sales column in the sales report."
      );
    }
  
    const salesMap = new Map<
  string,
  {
    asin: string;
    title: string;
    orders: number;
    unitsOrdered: number;
    unitsSold: number;
    orderedProductSales: number;
  }
>();
  
    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
  
      const asin = values[asinIndex]?.trim();
  
      if (!asin) {
        continue;
      }
  
      const title =
        titleIndex !== -1
          ? values[titleIndex]?.trim() ?? ""
          : "";
  
      const unitsOrdered = parseNumber(
        values[unitsIndex] ?? "0"
      );
      const orders = parseNumber(
        ordersIndex !== -1 ? values[ordersIndex] ?? "0" : "0"
      );
  
      const orderedProductSales = parseNumber(
        values[salesIndex] ?? "0"
      );
  
      const key = asin.toLowerCase();
  
      const existing = salesMap.get(key);
  
      if (existing) {
        existing.orders += orders;
        existing.unitsOrdered += unitsOrdered;
        existing.orderedProductSales += orderedProductSales;
  
        if (!existing.title && title) {
          existing.title = title;
        }
      } else {
        salesMap.set(key, {
          asin,
          title,
          orders,
          unitsOrdered,
          unitsSold: unitsOrdered,
          orderedProductSales,
        });
      }
    }
  
    const rows: SalesRow[] = Array.from(
      salesMap.values()
    );
  
    console.log("AMAZON SALES ROWS:", rows.length);
    console.log("FIRST 10 SALES ROWS:", rows.slice(0, 10));
  
    if (rows.length === 0) {
      throw new Error(
        "No valid ASIN sales rows were found in the sales report."
      );
    }
  
    return rows;
  }