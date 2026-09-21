import type {
  FulfilmentMethod,
  ShippingRule,
  ShippingZone,
} from "@/lib/fee-profiles";
export type Marketplace = "amazon" | "flipkart" | "meesho";

export type ProfitCalculatorInputs = {
  marketplace: Marketplace;
  sellingPrice: number;
  cogs: number;
  gstPercent: number;
  referralFeePercent: number;
  closingFee: number;
  shippingFee: number;
  fulfilmentMethod?: FulfilmentMethod;
  shippingZone?: ShippingZone;
  shippingRules?: ShippingRule[];
  otherMarketplaceFee: number;
  packagingCost: number;
  advertisingCost: number;
  otherCosts: number;
};

export type ProfitCalculatorResults = {
  referralFee: number;
  gstAmount: number;
  totalMarketplaceCharges: number;
  totalCost: number;
  netProfit: number;
  profitMargin: number;
  roi: number;
};

export type CostBreakdownRow = {
  label: string;
  value: number;
  type: "income" | "fee" | "cost" | "tax" | "total" | "result";
  note?: string;
};

export const MARKETPLACES: { id: Marketplace; label: string; color: string }[] = [
  { id: "amazon", label: "Amazon", color: "bg-orange-500" },
  { id: "flipkart", label: "Flipkart", color: "bg-blue-600" },
  { id: "meesho", label: "Meesho", color: "bg-pink-500" },
];

export const DEFAULT_INPUTS: ProfitCalculatorInputs = {
  marketplace: "amazon",
  sellingPrice: 0,
  cogs: 0,
  gstPercent: 0,
  referralFeePercent: 0,
  closingFee: 0,
  shippingFee: 0,
  otherMarketplaceFee: 0,
  packagingCost: 0,
  advertisingCost: 0,
  otherCosts: 0,
};

export function calculateProfit(inputs: ProfitCalculatorInputs): ProfitCalculatorResults {
  const {
    sellingPrice,
    cogs,
    gstPercent,
    referralFeePercent,
    closingFee,
    shippingFee,
    otherMarketplaceFee,
    packagingCost,
    advertisingCost,
    otherCosts,
  } = inputs;
  const fulfilmentMethod = inputs.fulfilmentMethod;
  const shippingZone = inputs.shippingZone;
  const shippingRules = inputs.shippingRules ?? [];

  const referralFee = sellingPrice * (referralFeePercent / 100);

const profileShippingFee =
  shippingZone && shippingRules.length > 0
    ? shippingRules.find((rule) => rule.zone === shippingZone)?.charge ?? 0
    : shippingFee;

const calculatedShippingFee =
  fulfilmentMethod && shippingZone
    ? profileShippingFee
    : shippingFee;

const totalMarketplaceCharges =
  referralFee +
  closingFee +
  calculatedShippingFee +
  otherMarketplaceFee;

const gstAmount =
  totalMarketplaceCharges * (gstPercent / 100);
  const totalCost =
    cogs +
    totalMarketplaceCharges +
    packagingCost +
    advertisingCost +
    otherCosts +
    gstAmount;
  const netProfit = sellingPrice - totalCost;
  const profitMargin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;

  const investmentBase = cogs + packagingCost + advertisingCost + otherCosts;
  const roi = investmentBase > 0 ? (netProfit / investmentBase) * 100 : 0;

  return {
    referralFee,
    gstAmount,
    totalMarketplaceCharges,
    totalCost,
    netProfit,
    profitMargin,
    roi,
  };
}

export function buildCostBreakdown(
  inputs: ProfitCalculatorInputs,
  results: ProfitCalculatorResults,
): CostBreakdownRow[] {
  const marketplaceLabel =
    MARKETPLACES.find((m) => m.id === inputs.marketplace)?.label ?? inputs.marketplace;

  return [
    {
      label: "Selling Price",
      value: inputs.sellingPrice,
      type: "income",
      note: `Listed price on ${marketplaceLabel}`,
    },
    {
      label: "Cost of Goods Sold (COGS)",
      value: inputs.cogs,
      type: "cost",
    },
    {
      label: `Referral Fee (${inputs.referralFeePercent}%)`,
      value: results.referralFee,
      type: "fee",
      note: `${inputs.referralFeePercent}% of selling price`,
    },
    {
      label: "Closing Fee",
      value: inputs.closingFee,
      type: "fee",
    },
    {
      label: "Shipping / Fulfilment Fee",
      value: inputs.shippingFee,
      type: "fee",
    },
    ...(inputs.otherMarketplaceFee > 0
      ? [
          {
            label: "Other Marketplace Fee",
            value: inputs.otherMarketplaceFee,
            type: "fee" as const,
          },
        ]
      : []),
    {
      label: "Total Marketplace Charges",
      value: results.totalMarketplaceCharges,
      type: "total",
      note: "Referral + Closing + Shipping + Other marketplace fees",
    },
    {
      label: `GST (${inputs.gstPercent}%)`,
      value: results.gstAmount,
      type: "tax",
      note: `${inputs.gstPercent}% of marketplace charges`,
    },
    {
      label: "Packaging Cost",
      value: inputs.packagingCost,
      type: "cost",
    },
    {
      label: "Advertising Cost",
      value: inputs.advertisingCost,
      type: "cost",
    },
    {
      label: "Other Costs",
      value: inputs.otherCosts,
      type: "cost",
    },
    {
      label: "Total Cost",
      value: results.totalCost,
      type: "total",
      note: "All costs combined",
    },
    {
      label: "Net Profit",
      value: results.netProfit,
      type: "result",
    },
  ];
}
