export const kpis = {
  totalSales: { value: 2847650, change: 12.4, trend: "up" as const },
  netProfit: { value: 487320, change: 8.7, trend: "up" as const },
  orders: { value: 3842, change: -2.1, trend: "down" as const },
  unitsSold: { value: 5218, change: 15.3, trend: "up" as const },
  roas: { value: 4.82, change: 6.2, trend: "up" as const },
  acos: { value: 20.7, change: -1.4, trend: "down" as const },
};

export const salesChartData = [
  { month: "Jan", sales: 185000 },
  { month: "Feb", sales: 210000 },
  { month: "Mar", sales: 198000 },
  { month: "Apr", sales: 245000 },
  { month: "May", sales: 268000 },
  { month: "Jun", sales: 290000 },
  { month: "Jul", sales: 275000 },
  { month: "Aug", sales: 310000 },
  { month: "Sep", sales: 295000 },
  { month: "Oct", sales: 340000 },
  { month: "Nov", sales: 380000 },
  { month: "Dec", sales: 420000 },
];

export const profitChartData = [
  { month: "Jan", profit: 32000 },
  { month: "Feb", profit: 38000 },
  { month: "Mar", profit: 35000 },
  { month: "Apr", profit: 42000 },
  { month: "May", profit: 48000 },
  { month: "Jun", profit: 52000 },
  { month: "Jul", profit: 49000 },
  { month: "Aug", profit: 55000 },
  { month: "Sep", profit: 51000 },
  { month: "Oct", profit: 58000 },
  { month: "Nov", profit: 62000 },
  { month: "Dec", profit: 68000 },
];

export type Product = {
  id: string;
  name: string;
  sku: string;
  sellingPrice?: number;
cogs?: number;
  unitsSold: number;
  revenue: number;
  profit: number;
  stock: number;
  category: string;
};

export const topProducts: Product[] = [
  {
    id: "1",
    name: "Wireless Bluetooth Earbuds Pro",
    sku: "WBEP-001",
    unitsSold: 842,
    revenue: 421000,
    profit: 84200,
    stock: 156,
    category: "Electronics",
  },
  {
    id: "2",
    name: "Organic Turmeric Powder 500g",
    sku: "OTP-500",
    unitsSold: 723,
    revenue: 144600,
    profit: 43380,
    stock: 89,
    category: "Grocery",
  },
  {
    id: "3",
    name: "Stainless Steel Water Bottle 1L",
    sku: "SSWB-1L",
    unitsSold: 612,
    revenue: 183600,
    profit: 55080,
    stock: 234,
    category: "Home & Kitchen",
  },
  {
    id: "4",
    name: "Yoga Mat Premium 6mm",
    sku: "YMP-6MM",
    unitsSold: 534,
    revenue: 160200,
    profit: 64080,
    stock: 67,
    category: "Sports",
  },
  {
    id: "5",
    name: "LED Desk Lamp with USB Port",
    sku: "LDL-USB",
    unitsSold: 489,
    revenue: 146700,
    profit: 44010,
    stock: 112,
    category: "Electronics",
  },
];

export const lowStockProducts: Product[] = [
  {
    id: "6",
    name: "Vitamin C Serum 30ml",
    sku: "VCS-30",
    unitsSold: 312,
    revenue: 93600,
    profit: 37440,
    stock: 8,
    category: "Beauty",
  },
  {
    id: "7",
    name: "Portable Phone Charger 10000mAh",
    sku: "PPC-10K",
    unitsSold: 445,
    revenue: 222500,
    profit: 66750,
    stock: 12,
    category: "Electronics",
  },
  {
    id: "8",
    name: "Cotton Bedsheet Set King Size",
    sku: "CBS-KS",
    unitsSold: 198,
    revenue: 118800,
    profit: 35640,
    stock: 5,
    category: "Home & Kitchen",
  },
  {
    id: "9",
    name: "Protein Powder Chocolate 1kg",
    sku: "PPW-1KG",
    unitsSold: 267,
    revenue: 160200,
    profit: 48060,
    stock: 9,
    category: "Health",
  },
  {
    id: "10",
    name: "Kids Educational Puzzle Set",
    sku: "KEP-SET",
    unitsSold: 156,
    revenue: 46800,
    profit: 18720,
    stock: 3,
    category: "Toys",
  },
];

export const navItems = [
  { label: "Dashboard", href: "/", icon: "dashboard" },
  { label: "Sales", href: "/sales", icon: "sales" },
  { label: "Products", href: "/products", icon: "products" },
  { label: "Inventory", href: "/inventory", icon: "inventory" },
  { label: "PPC", href: "/ppc", icon: "ppc" },
  { label: "Profit Calculator", href: "/profit-calculator", icon: "calculator" },
  { label: "Keywords", href: "/keywords", icon: "keywords" },
  { label: "AI Insights", href: "/ai-insights", icon: "ai" },
  { label: "Alerts", href: "/alerts", icon: "alerts" },
  { label: "Settings", href: "/settings", icon: "settings" },
] as const;
