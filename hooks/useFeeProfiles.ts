"use client";

import { useCallback, useEffect, useState } from "react";
import type { Marketplace } from "@/lib/profit-calculator";
import {
  type FeeProfile,
  createEmptyProfile,
  loadFeeProfiles,
  saveFeeProfiles,
  getProfilesForMarketplace,
} from "@/lib/fee-profiles";

export function useFeeProfiles() {
  const [profiles, setProfiles] = useState<FeeProfile[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProfiles(loadFeeProfiles());
    setLoaded(true);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "seller-dashboard-fee-profiles") {
        setProfiles(loadFeeProfiles());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const persist = useCallback((next: FeeProfile[]) => {
    setProfiles(next);
    saveFeeProfiles(next);
  }, []);

  const addProfile = useCallback(
    (marketplace: Marketplace, name?: string) => {
      const profile = createEmptyProfile(marketplace, name);
      persist([...profiles, profile]);
      return profile;
    },
    [profiles, persist],
  );

  const updateProfile = useCallback(
    (id: string, updates: Partial<Omit<FeeProfile, "id">>) => {
      persist(
        profiles.map((p) =>
          p.id === id
            ? { ...p, ...updates, updatedAt: new Date().toISOString() }
            : p,
        ),
      );
    },
    [profiles, persist],
  );

  const deleteProfile = useCallback(
    (id: string) => {
      persist(profiles.filter((p) => p.id !== id));
    },
    [profiles, persist],
  );

  const getByMarketplace = useCallback(
    (marketplace: Marketplace) => getProfilesForMarketplace(profiles, marketplace),
    [profiles],
  );

  return {
    profiles,
    loaded,
    addProfile,
    updateProfile,
    deleteProfile,
    getByMarketplace,
  };
}
