"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { ResultCard } from "@/components/ui/ResultCard";
import { CostBreakdownTable } from "@/components/profit-calculator/CostBreakdownTable";
import { useFeeProfiles } from "@/hooks/useFeeProfiles";
import { applyProfileToCalculatorFields } from "@/lib/fee-profiles";
import {
  MARKETPLACES,
  DEFAULT_INPUTS,
  calculateProfit,
  buildCostBreakdown,
  type Marketplace,
  type ProfitCalculatorInputs,
} from "@/lib/profit-calculator";
import { formatCurrency, formatPercent } from "@/lib/utils";

function parseNumber(value: string): number {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatFieldValue(value: number): string {
  return value === 0 ? "" : String(value);
}

export function ProfitCalculator() {
  const { loaded, getByMarketplace } = useFeeProfiles();
  const [inputs, setInputs] = useState<ProfitCalculatorInputs>(DEFAULT_INPUTS);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({
    sellingPrice: "",
    cogs: "",
    gstPercent: "",
    referralFeePercent: "",
    closingFee: "",
    shippingFee: "",
    otherMarketplaceFee: "",
    fulfilmentMethod: "EASY_SHIP",
    shippingZone: "NATIONAL",
    shippingRules: "",
    packagingCost: "",
    advertisingCost: "",
    otherCosts: "",
  });

  const marketplaceProfiles = getByMarketplace(inputs.marketplace);

  useEffect(() => {
    if (!selectedProfileId) return;
    const stillValid = marketplaceProfiles.some((p) => p.id === selectedProfileId);
    if (!stillValid) setSelectedProfileId("");
  }, [marketplaceProfiles, selectedProfileId]);

  const results = useMemo(() => calculateProfit(inputs), [inputs]);
  const breakdown = useMemo(
    () => buildCostBreakdown(inputs, results),
    [inputs, results],
  );

  const updateField = (key: keyof typeof fieldValues, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
    setInputs((prev) => ({ ...prev, [key]: parseNumber(value) }));
  };

  const setMarketplace = (marketplace: Marketplace) => {
    setSelectedProfileId("");
    setInputs((prev) => ({ ...prev, marketplace }));
  };

  const applyProfile = (profileId: string) => {
    setSelectedProfileId(profileId);

    if (!profileId) return;

    const profile = marketplaceProfiles.find((p) => p.id === profileId);
    if (!profile) return;

    const feeFields = applyProfileToCalculatorFields(profile);

    setInputs((prev) => ({
      ...prev,
      marketplace: profile.marketplace,
      ...feeFields,
      fulfilmentMethod: profile.fulfilmentMethod ?? "EASY_SHIP",
      shippingZone: "NATIONAL",
      shippingRules: profile.shippingRules ?? [],
    }));

    setFieldValues((prev) => ({
      ...prev,
      referralFeePercent: formatFieldValue(feeFields.referralFeePercent),
      closingFee: formatFieldValue(feeFields.closingFee),
      shippingFee: formatFieldValue(feeFields.shippingFee),
      gstPercent: formatFieldValue(feeFields.gstPercent),
      otherMarketplaceFee: formatFieldValue(feeFields.otherMarketplaceFee),
    }));
  };

  const resetForm = () => {
    setSelectedProfileId("");
    setInputs(DEFAULT_INPUTS);
    setFieldValues({
      sellingPrice: "",
      cogs: "",
      gstPercent: "",
      referralFeePercent: "",
      closingFee: "",
      shippingFee: "",
      otherMarketplaceFee: "",
      packagingCost: "",
      advertisingCost: "",
      otherCosts: "",
    });
  };

  const profitVariant =
    results.netProfit > 0 ? "positive" : results.netProfit < 0 ? "negative" : "neutral";

  const selectedMarketplace = MARKETPLACES.find((m) => m.id === inputs.marketplace)!;
  const selectedProfile = marketplaceProfiles.find((p) => p.id === selectedProfileId);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Marketplace" subtitle="Select where you sell — fees are entered manually below">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {MARKETPLACES.map((marketplace) => {
                const isSelected = inputs.marketplace === marketplace.id;
                return (
                  <button
                    key={marketplace.id}
                    type="button"
                    onClick={() => setMarketplace(marketplace.id)}
                    className={`flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                      isSelected
                        ? "border-orange-400 bg-orange-50 text-orange-900 ring-2 ring-orange-400/20"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${marketplace.color}`} />
                    {marketplace.label}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card
            title="Fee Profile"
            subtitle="Load saved fees or enter manually — all fields remain editable"
            action={
              <Link
                href="/settings#fee-profiles"
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-orange-600 transition-colors hover:bg-orange-50"
              >
                Manage Fee Profiles
              </Link>
            }
          >
            <div>
              <label htmlFor="feeProfile" className="block text-sm font-medium text-slate-700">
                Profile
              </label>
              <select
                id="feeProfile"
                value={selectedProfileId}
                onChange={(e) => applyProfile(e.target.value)}
                disabled={!loaded}
                className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-10 text-sm text-slate-900 shadow-sm transition-colors focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">No profile — enter fees manually</option>
                {marketplaceProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name || "Untitled Profile"}
                  </option>
                ))}
              </select>
              {selectedProfile && (
                <p className="mt-2 text-xs text-slate-400">
                  Loaded &ldquo;{selectedProfile.name}&rdquo; — override any field below for this order
                </p>
              )}
              {!loaded && (
                <p className="mt-2 text-xs text-slate-400">Loading saved profiles…</p>
              )}
              {loaded && marketplaceProfiles.length === 0 && (
                <p className="mt-2 text-xs text-slate-400">
                  No profiles for {selectedMarketplace.label} yet.{" "}
                  <Link href="/settings#fee-profiles" className="text-orange-600 hover:underline">
                    Create one in Settings
                  </Link>
                </p>
              )}
            </div>
          </Card>

          <Card
            title="Product & Pricing"
            subtitle={`Enter your costs for ${selectedMarketplace.label}`}
            action={
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                Reset
              </button>
            }
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label="Selling Price"
                id="sellingPrice"
                value={fieldValues.sellingPrice}
                onChange={(v) => updateField("sellingPrice", v)}
                prefix="₹"
                hint="Your listing price per unit"
              />
              <FormField
                label="Cost of Goods Sold (COGS)"
                id="cogs"
                value={fieldValues.cogs}
                onChange={(v) => updateField("cogs", v)}
                prefix="₹"
                hint="Product procurement cost per unit"
              />
            </div>
          </Card>

          <Card title="Marketplace Fees" subtitle="Enter the fee rates and charges applicable to your listing">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label="Referral Fee"
                id="referralFeePercent"
                value={fieldValues.referralFeePercent}
                onChange={(v) => updateField("referralFeePercent", v)}
                suffix="%"
                hint="Percentage of selling price"
              />
              <FormField
                label="GST"
                id="gstPercent"
                value={fieldValues.gstPercent}
                onChange={(v) => updateField("gstPercent", v)}
                suffix="%"
                hint="GST rate on selling price"
              />
              <FormField
                label="Closing Fee"
                id="closingFee"
                value={fieldValues.closingFee}
                onChange={(v) => updateField("closingFee", v)}
                prefix="₹"
                hint="Fixed closing fee per unit"
              />
              <FormField
                label="Shipping / Fulfilment Fee"
                id="shippingFee"
                value={fieldValues.shippingFee}
                onChange={(v) => updateField("shippingFee", v)}
                prefix="₹"
                hint="Shipping or fulfilment cost"
              />
              <FormField
                label="Other Marketplace Fee"
                id="otherMarketplaceFee"
                value={fieldValues.otherMarketplaceFee}
                onChange={(v) => updateField("otherMarketplaceFee", v)}
                prefix="₹"
                hint="Any additional marketplace charge per unit"
              />
            </div>
          </Card>

          <Card title="Additional Costs" subtitle="Other expenses per unit sold">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label="Packaging Cost"
                id="packagingCost"
                value={fieldValues.packagingCost}
                onChange={(v) => updateField("packagingCost", v)}
                prefix="₹"
              />
              <FormField
                label="Advertising Cost"
                id="advertisingCost"
                value={fieldValues.advertisingCost}
                onChange={(v) => updateField("advertisingCost", v)}
                prefix="₹"
                hint="PPC or ad spend per unit"
              />
              <FormField
                label="Other Costs"
                id="otherCosts"
                value={fieldValues.otherCosts}
                onChange={(v) => updateField("otherCosts", v)}
                prefix="₹"
                hint="Any other per-unit expenses"
              />
            </div>
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ResultCard
              label="Net Profit"
              value={formatCurrency(results.netProfit)}
              variant={profitVariant}
              subtitle="Per unit after all costs"
            />
            <ResultCard
              label="Profit Margin"
              value={formatPercent(results.profitMargin)}
              variant={results.profitMargin >= 0 ? "positive" : "negative"}
              subtitle="Net profit ÷ selling price"
            />
            <ResultCard
              label="ROI"
              value={formatPercent(results.roi)}
              variant={results.roi >= 0 ? "positive" : "negative"}
              subtitle="Return on product investment"
            />
            <ResultCard
              label="Referral Fee"
              value={formatCurrency(results.referralFee)}
              subtitle={`${inputs.referralFeePercent || 0}% of selling price`}
            />
            <ResultCard
              label="GST Amount"
              value={formatCurrency(results.gstAmount)}
              subtitle={`${inputs.gstPercent || 0}% of selling price`}
            />
            <ResultCard
              label="Marketplace Charges"
              value={formatCurrency(results.totalMarketplaceCharges)}
              subtitle="Referral + closing + shipping + other"
            />
            <ResultCard
              label="Total Cost"
              value={formatCurrency(results.totalCost)}
              subtitle="All costs combined"
            />
            <ResultCard
              label="Selling Price"
              value={formatCurrency(inputs.sellingPrice)}
              subtitle={`Listed on ${selectedMarketplace.label}`}
            />
          </div>

          {inputs.sellingPrice === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center">
              <p className="text-sm font-medium text-slate-600">
                Enter a selling price to see your profit breakdown
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Select a fee profile or enter rates manually — all fields stay editable
              </p>
            </div>
          )}

          <CostBreakdownTable rows={breakdown} />
        </div>
      </div>
    </div>
  );
}
