import type { Marketplace } from "@/lib/profit-calculator";
export type FulfilmentMethod =
  | "EASY_SHIP"
  | "FBA"
  | "SELF_SHIP"
  | "FLIPKART_FULFILMENT"
  | "FLIPKART_SELLER_SHIPPING"
  | "MEESHO_SHIPPING"
  | "MEESHO_SELF_SHIPPING";

export type ShippingZone = "LOCAL" | "REGIONAL" | "NATIONAL";

export type ShippingRule = {
  zone: ShippingZone;
  maxWeightGrams: number;
  charge: number;
};
export type FeeProfile = {
  id: string;
  marketplace: Marketplace;
  name: string;

  referralFeePercent: number;
  closingFee: number;
  shippingFee: number;
  gstPercent: number;
  otherMarketplaceFee: number;

  fulfilmentMethod?: FulfilmentMethod;

  shippingRules?: ShippingRule[];

  updatedAt: string;
};

export const FEE_PROFILES_STORAGE_KEY = "seller-dashboard-fee-profiles";

export function createEmptyProfile(marketplace: Marketplace, name = "New Profile"): FeeProfile {
  return {
    id: crypto.randomUUID(),
    marketplace,
    name,
    referralFeePercent: 0,
    closingFee: 0,
    shippingFee: 0,
    gstPercent: 0,
    otherMarketplaceFee: 0,
    fulfilmentMethod: "EASY_SHIP",
shippingRules: [],
    updatedAt: new Date().toISOString(),
  };
}

export function loadFeeProfiles(): FeeProfile[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(FEE_PROFILES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FeeProfile[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFeeProfiles(profiles: FeeProfile[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FEE_PROFILES_STORAGE_KEY, JSON.stringify(profiles));
}

export function getProfilesForMarketplace(
  profiles: FeeProfile[],
  marketplace: Marketplace,
): FeeProfile[] {
  return profiles
    .filter((p) => p.marketplace === marketplace)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function applyProfileToCalculatorFields(profile: FeeProfile) {
  return {
    referralFeePercent: profile.referralFeePercent,
    closingFee: profile.closingFee,
    shippingFee: profile.shippingFee,
    gstPercent: profile.gstPercent,
    otherMarketplaceFee: profile.otherMarketplaceFee,
  };
}
