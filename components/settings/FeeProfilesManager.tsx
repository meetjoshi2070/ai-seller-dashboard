"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { useFeeProfiles } from "@/hooks/useFeeProfiles";
import { MARKETPLACES, type Marketplace } from "@/lib/profit-calculator";
import type {
  FeeProfile,
  FulfilmentMethod,
  ShippingRule,
  ShippingZone,
} from "@/lib/fee-profiles";

function parseNumber(value: string): number {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function ProfileEditor({
  
  profile,
  onUpdate,
  onDelete,
}: {
  profile: FeeProfile;
  onUpdate: (id: string, updates: Partial<Omit<FeeProfile, "id">>) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const fulfilmentOptions: { value: FulfilmentMethod; label: string }[] = [
    { value: "EASY_SHIP", label: "Amazon Easy Ship" },
    { value: "FBA", label: "Amazon FBA" },
    { value: "SELF_SHIP", label: "Amazon Self-Ship" },
    { value: "FLIPKART_FULFILMENT", label: "Flipkart Fulfilment" },
    { value: "FLIPKART_SELLER_SHIPPING", label: "Flipkart Seller Shipping" },
    { value: "MEESHO_SHIPPING", label: "Meesho Shipping" },
    { value: "MEESHO_SELF_SHIPPING", label: "Meesho Self Shipping" },
  ];
  
  const shippingZones: ShippingZone[] = [
    "LOCAL",
    "REGIONAL",
    "NATIONAL",
  ];

  const updateField = (field: keyof FeeProfile, value: string) => {
    if (field === "name") {
      onUpdate(profile.id, { name: value });
      return;
    }
    onUpdate(profile.id, { [field]: parseNumber(value) });
  };

  const numValue = (n: number) => (n === 0 ? "" : String(n));
  const updateFulfilmentMethod = (value: FulfilmentMethod) => {
    onUpdate(profile.id, {
      fulfilmentMethod: value,
    });
  };
  
  const updateShippingRule = (
    zone: ShippingZone,
    value: string
  ) => {
    const charge = parseNumber(value);
  
    const existingRules = profile.shippingRules ?? [];
  
    const otherRules = existingRules.filter(
      (rule) => rule.zone !== zone
    );
  
    onUpdate(profile.id, {
      shippingRules: [
        ...otherRules,
        {
          zone,
          maxWeightGrams: 0,
          charge,
        },
      ],
    });
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <svg
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${expanded ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">
              {profile.name || "Untitled Profile"}
            </p>
            <p className="text-xs text-slate-400">
              Referral {profile.referralFeePercent}% · GST {profile.gstPercent}%
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onDelete(profile.id)}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          Delete
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Category / Profile Name"
              id={`name-${profile.id}`}
              type="text"
              value={profile.name}
              onChange={(v) => updateField("name", v)}
              placeholder="e.g. Electronics, Grocery"
            />
            <FormField
              label="Referral Fee"
              id={`referral-${profile.id}`}
              value={numValue(profile.referralFeePercent)}
              onChange={(v) => updateField("referralFeePercent", v)}
              suffix="%"
            />
            
            <FormField
              label="Closing Fee"
              id={`closing-${profile.id}`}
              value={numValue(profile.closingFee)}
              onChange={(v) => updateField("closingFee", v)}
              prefix="₹"
            />
            <FormField
              label="Shipping / Fulfilment Fee"
              id={`shipping-${profile.id}`}
              value={numValue(profile.shippingFee)}
              onChange={(v) => updateField("shippingFee", v)}
              prefix="₹"
            />
            <FormField
              label="GST"
              id={`gst-${profile.id}`}
              value={numValue(profile.gstPercent)}
              onChange={(v) => updateField("gstPercent", v)}
              suffix="%"
            />
            <FormField
              label="Other Marketplace Fee"
              id={`other-${profile.id}`}
              value={numValue(profile.otherMarketplaceFee)}
              onChange={(v) => updateField("otherMarketplaceFee", v)}
              prefix="₹"
            />
          </div>
          <div className="mt-6 border-t border-slate-100 pt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Fulfilment Method
              </label>

              <select
                value={profile.fulfilmentMethod ?? "EASY_SHIP"}
                onChange={(e) =>
                  updateFulfilmentMethod(e.target.value as FulfilmentMethod)
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-400"
              >
                {fulfilmentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-sm font-medium text-slate-700">
              Shipping Rules
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Set your shipping/fulfilment charge for each shipping zone.
            </p>

            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {shippingZones.map((zone) => {
                const rule = profile.shippingRules?.find(
                  (item) => item.zone === zone
                );

                return (
                  <FormField
                    key={zone}
                    label={`${zone.charAt(0) + zone.slice(1).toLowerCase()} Shipping`}
                    id={`${zone.toLowerCase()}-${profile.id}`}
                    type="number"
                    value={rule ? String(rule.charge) : ""}
                    onChange={(value) => updateShippingRule(zone, value)}
                    prefix="₹"
                  />
                );
              })}
            </div>
          </div>
        </div>
          <p className="mt-3 text-xs text-slate-400">
            Changes are saved automatically to this browser.
          </p>
        </div>
      )}
    </div>
  );
}

export function FeeProfilesManager() {
  const { loaded, addProfile, updateProfile, deleteProfile, getByMarketplace } =
    useFeeProfiles();
  const [activeMarketplace, setActiveMarketplace] = useState<Marketplace>("amazon");

  const marketplaceProfiles = getByMarketplace(activeMarketplace);
  const activeMarketplaceMeta = MARKETPLACES.find((m) => m.id === activeMarketplace)!;

  if (!loaded) {
    return (
      <Card title="Marketplace Fee Profiles" subtitle="Loading saved profiles…">
        <p className="text-sm text-slate-500">Loading…</p>
      </Card>
    );
  }

  return (
    <Card
      id="fee-profiles"
      title="Marketplace Fee Profiles"
      subtitle="Create reusable fee templates for each marketplace and product category"
      action={
        <button
          type="button"
          onClick={() => addProfile(activeMarketplace)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-orange-600"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Profile
        </button>
      }
    >
      <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {MARKETPLACES.map((marketplace) => {
          const isActive = activeMarketplace === marketplace.id;
          const count = getByMarketplace(marketplace.id).length;
          return (
            <button
              key={marketplace.id}
              type="button"
              onClick={() => setActiveMarketplace(marketplace.id)}
              className={`flex items-center justify-between gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? "border-orange-400 bg-orange-50 text-orange-900 ring-2 ring-orange-400/20"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${marketplace.color}`} />
                {marketplace.label}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {marketplaceProfiles.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 px-5 py-10 text-center">
          <p className="text-sm font-medium text-slate-600">
            No fee profiles for {activeMarketplaceMeta.label} yet
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Add a profile and enter your own fee values — nothing is pre-filled
          </p>
          <button
            type="button"
            onClick={() => addProfile(activeMarketplace)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Create first profile
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {marketplaceProfiles.map((profile) => (
            <ProfileEditor
              key={profile.id}
              profile={profile}
              onUpdate={updateProfile}
              onDelete={deleteProfile}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
