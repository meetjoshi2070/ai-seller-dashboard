"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

type PPCRow = {
    sku: string;
    product: string;
    campaign: string;
    spend: number;
    sales: number;
    units: number;
  };
  type SearchTermRow = {
    searchTerm: string;
    campaign: string;
    adGroup: string;
    matchType: string;
    impressions: number;
    clicks: number;
    spend: number;
    sales: number;
    orders: number;
  };
  type NegativeKeywordDetail = {
    keyword: string;
    campaign: string;
    adGroup: string;
    clicks: number;
    spend: number;
    sales: number;
    reason: string;
    addedAt: string;
    status: "Pending" | "Added to Amazon";
  };
  type PPCActionHistory = {
    id: string;
    keyword: string;
    action:
  | "Added Negative"
  | "Marked Added to Amazon"
  | "Removed"
  | "Increase Budget"
  | "Reduce Budget"
  | "Reduce Bid"
  | "Pause";
    campaign: string;
    adGroup: string;
    timestamp: string;
status?: "Pending" | "Completed";
  };
  type CampaignRecommendation = {
    campaign: string;
    spend: number;
    sales: number;
    acos: number;
    roas: number;
    action: "Increase Budget" | "Reduce Budget" | "Reduce Bid" | "Pause" | "Monitor";
    reason: string;
  };
  type CampaignOptimization = {
    campaign: string;
    currentBudget: number;
    suggestedBudget: number;
    budgetChangePercent: number;
    currentBid: number;
    suggestedBid: number;
    bidChangePercent: number;
    reason: string;
  };
  type ProductPPCPerformance = {
    product: string;
    campaign: string;
    adGroup: string;
    impressions: number;
    clicks: number;
    spend: number;
    sales: number;
    orders: number;
    acos: number;
    roas: number;
    conversionRate: number;
    action: "Scale" | "Reduce Bid" | "Review" | "Monitor";
    reason: string;
  };

const PPC_STORAGE_KEY = "seller-dashboard-ppc-data";

export default function PPCPage() {
    const [isMounted, setIsMounted] = useState(false);

useEffect(() => {
  setIsMounted(true);
}, []);
    const [rows, setRows] = useState<PPCRow[]>([]);
const [pausedCampaigns, setPausedCampaigns] = useState<string[]>([]);
const [searchTerms, setSearchTerms] = useState<SearchTermRow[]>([]);
const [productPPCPerformance, setProductPPCPerformance] =
  useState<ProductPPCPerformance[]>([]);
const [negativeKeywords, setNegativeKeywords] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
  
    try {
      const saved = localStorage.getItem(
        "seller-dashboard-negative-keywords"
      );
  
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const recordPPCAction = (
    keyword: string,
    action: PPCActionHistory["action"],
    campaign: string,
    adGroup: string
  ) => {
    const handleCampaignAction = (
        campaign: CampaignRecommendation
      ) => {
        if (campaign.action === "Monitor") return;
      
        recordPPCAction(
          campaign.campaign,
          campaign.action,
          campaign.campaign,
          ""
        );
      };
    const historyItem: PPCActionHistory = {
      id: `${Date.now()}-${keyword}`,
      keyword,
      action,
      campaign,
      adGroup,
      timestamp: new Date().toISOString(),
      status: "Pending",
    };
  
    setPpcActionHistory((current) => {
      const updated = [historyItem, ...current];
  
      localStorage.setItem(
        "seller-dashboard-ppc-action-history",
        JSON.stringify(updated)
      );
  
      return updated;
    });
  };
  const markPPCActionCompleted = (id: string) => {
    setPpcActionHistory((current) => {
      const updated = current.map((item) =>
        item.id === id
          ? { ...item, status: "Completed" as const }
          : item
      );
  
      localStorage.setItem(
        "seller-dashboard-ppc-action-history",
        JSON.stringify(updated)
      );
  
      return updated;
    });
  };
  const handleAddNegativeKeyword = (
    term: SearchTermRow,
    reason: string = "High click volume and spend with no attributed sales."
  ) => {
    const keyword = term.searchTerm.trim();
  
    if (!keyword) return;
    const detail: NegativeKeywordDetail = {
        keyword,
        campaign: term.campaign || "—",
        adGroup: term.adGroup || "—",
        clicks: term.clicks,
        spend: term.spend,
        sales: term.sales,
        reason,
        addedAt: new Date().toISOString(),
        status: "Pending",
      };
      
      setNegativeKeywordDetails((prev) => {
        if (prev.some((item) => item.keyword === keyword)) {
          return prev;
        }
      
        const updated = [...prev, detail];
      
        localStorage.setItem(
          "seller-dashboard-negative-keyword-details",
          JSON.stringify(updated)
        );
      
        return updated;
      });
  
    setNegativeKeywords((prev) => {
      if (prev.includes(keyword)) {
        return prev;
      }
  
      const updated = [...prev, keyword];
  
      localStorage.setItem(
        "seller-dashboard-negative-keywords",
        JSON.stringify(updated)
      );
  
      return updated;
    });
    recordPPCAction(
        keyword,
        "Added Negative",
        term.campaign || "—",
        term.adGroup || "—"
      );
  };
  
  const [negativeKeywordDetails, setNegativeKeywordDetails] =
  useState<NegativeKeywordDetail[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const saved = localStorage.getItem(
        "seller-dashboard-negative-keyword-details"
      );

      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [ppcActionHistory, setPpcActionHistory] = useState<
  PPCActionHistory[]
>([]);

useEffect(() => {
  try {
    const saved = localStorage.getItem(
      "seller-dashboard-ppc-action-history"
    );

    if (saved) {
      setPpcActionHistory(JSON.parse(saved));
    }
  } catch {
    setPpcActionHistory([]);
  }
}, []);

const toggleCampaignPause = (campaign: string) => {
  setPausedCampaigns((current) => {
    const updated = current.includes(campaign)
      ? current.filter((item) => item !== campaign)
      : [...current, campaign];

    localStorage.setItem(
      "seller-dashboard-paused-campaigns",
      JSON.stringify(updated)
    );

    return updated;
  });
};

useEffect(() => {
    const savedPPC = localStorage.getItem(PPC_STORAGE_KEY);
  
    if (savedPPC) {
      try {
        const parsed = JSON.parse(savedPPC);
  
        if (Array.isArray(parsed)) {
          setRows(parsed);
        }
      } catch (error) {
        console.error("Failed to load saved PPC data:", error);
      }
    }
  
    const savedPaused = localStorage.getItem(
      "seller-dashboard-paused-campaigns"
    );
  
    if (savedPaused) {
      try {
        const parsedPaused = JSON.parse(savedPaused);
  
        if (Array.isArray(parsedPaused)) {
          setPausedCampaigns(parsedPaused);
        }
      } catch (error) {
        console.error("Failed to load paused campaigns:", error);
      }
    }
    const savedSearchTerms = localStorage.getItem(
        "seller-dashboard-search-terms"
      );
      
      if (savedSearchTerms) {
        try {
          const parsedSearchTerms = JSON.parse(savedSearchTerms);
      
          if (Array.isArray(parsedSearchTerms)) {
            setSearchTerms(parsedSearchTerms);
          }
        } catch (error) {
          console.error("Failed to load saved search term data:", error);
        }
      }
  }, []);
    
  
  
  useEffect(() => {
    try {
      localStorage.setItem(
        "seller-dashboard-ppc",
        JSON.stringify(rows)
      );
    } catch (error) {
      console.error("Failed to save PPC data:", error);
    }
  }, [rows]);

  const totals = useMemo(() => {
    const spend = rows.reduce((sum, row) => sum + row.spend, 0);
    const sales = rows.reduce((sum, row) => sum + row.sales, 0);
    const units = rows.reduce((sum, row) => sum + row.units, 0);

    const acos = sales > 0 ? (spend / sales) * 100 : 0;
    const roas = spend > 0 ? sales / spend : 0;

    return {
      spend,
      sales,
      units,
      acos,
      roas,
    };
  }, [rows]);
  
  const campaignTotals = useMemo(() => {
    const grouped: Record<
      string,
      {
        campaign: string;
        spend: number;
        sales: number;
        units: number;
      }
    > = {};
  
    rows.forEach((row) => {
      const campaign = row.campaign?.trim() || "Unknown Campaign";
  
      if (!grouped[campaign]) {
        grouped[campaign] = {
          campaign,
          spend: 0,
          sales: 0,
          units: 0,
        };
      }
  
      grouped[campaign].spend += row.spend;
      grouped[campaign].sales += row.sales;
      grouped[campaign].units += row.units;
    });
  
    return Object.values(grouped).map((campaign) => ({
      ...campaign,
      acos:
        campaign.sales > 0
          ? (campaign.spend / campaign.sales) * 100
          : 0,
      roas:
        campaign.spend > 0
          ? campaign.sales / campaign.spend
          : 0,
    }));
  }, [rows]);
  const actionCenter = useMemo(() => {
    const monitor: typeof campaignTotals = [];
    const reduce: typeof campaignTotals = [];
    const scale: typeof campaignTotals = [];
    const wasted: typeof campaignTotals = [];
    const priority: typeof campaignTotals = [];
  
    campaignTotals.forEach((campaign) => {
     
      // Wasted advertising spend
      if (campaign.spend > 0 && campaign.sales === 0) {
        wasted.push(campaign);
      }
  
      // High priority: very poor performance
      if (
        campaign.spend >= 500 &&
        campaign.sales === 0
      ) {
        priority.push(campaign);
        reduce.push(campaign);
        return;
      }
  
      // Reduce / pause
      if (
        campaign.spend > 0 &&
        campaign.acos >= 70
      ) {
        reduce.push(campaign);
        return;
      }
  
      // Strong performance
      if (
        campaign.sales > 0 &&
        campaign.roas >= 3 &&
        campaign.acos <= 30
      ) {
        scale.push(campaign);
        return;
      }
  
      // Needs monitoring
      if (
        campaign.spend > 0 &&
        campaign.sales > 0 &&
        campaign.roas >= 1.5 &&
        campaign.acos > 30 &&
        campaign.acos < 70
      ) {
        monitor.push(campaign);
      }
    });
  
    const totalWastedSpend = wasted.reduce(
      (sum, campaign) => sum + campaign.spend,
      0
    );
  
    const estimatedSavings = totalWastedSpend;
  
    return {
      monitor,
      reduce,
      scale,
      wasted,
      priority,
      totalWastedSpend,
      estimatedSavings,
    };
}, [campaignTotals, pausedCampaigns]);
  const ppcInsights = useMemo(() => {
    if (!rows.length) {
      return [];
    }

    const insights: {
      type: "success" | "warning" | "danger" | "info";
      title: string;
      message: string;
    }[] = [];

    // Best campaign by ROAS
    const bestCampaign = [...campaignTotals]
      .filter((campaign) => campaign.sales > 0 && campaign.spend > 0)
      .sort((a, b) => b.roas - a.roas)[0];

    if (bestCampaign) {
      insights.push({
        type: "success",
        title: "Best Performing Campaign",
        message: `${bestCampaign.campaign} has the highest ROAS at ${bestCampaign.roas.toFixed(
          2
        )}x with ${bestCampaign.acos.toFixed(2)}% ACOS.`,
      });
    }

    // High ACOS campaign
    const highAcosCampaign = [...campaignTotals]
      .filter((campaign) => campaign.spend > 0 && campaign.sales > 0)
      .sort((a, b) => b.acos - a.acos)[0];

    if (highAcosCampaign && highAcosCampaign.acos >= 70) {
      insights.push({
        type: "danger",
        title: "High ACOS Alert",
        message: `${highAcosCampaign.campaign} has ${highAcosCampaign.acos.toFixed(
          2
        )}% ACOS. Consider reducing bids or reviewing targeting.`,
      });
    }

    // Spend without sales
    const noSalesSpend = rows
      .filter((row) => row.spend > 0 && row.sales === 0)
      .reduce((sum, row) => sum + row.spend, 0);

    if (noSalesSpend > 0) {
      insights.push({
        type: "warning",
        title: "Wasted Ad Spend",
        message: `₹${noSalesSpend.toFixed(
          2
        )} has been spent on advertising with zero attributed sales.`,
      });
    }

    // Overall PPC health
    if (totals.acos > 60) {
      insights.push({
        type: "danger",
        title: "Overall PPC Efficiency",
        message: `Overall ACOS is ${totals.acos.toFixed(
          2
        )}%. Your advertising cost is relatively high compared with attributed sales.`,
      });
    } else if (totals.acos > 40) {
      insights.push({
        type: "warning",
        title: "Overall PPC Efficiency",
        message: `Overall ACOS is ${totals.acos.toFixed(
          2
        )}%. There may be opportunities to improve campaign efficiency.`,
      });
    } else {
      insights.push({
        type: "success",
        title: "Overall PPC Efficiency",
        message: `Overall ACOS is ${totals.acos.toFixed(
          2
        )}% with a ROAS of ${totals.roas.toFixed(
          2
        )}x. Advertising performance looks healthy.`,
      });
    }

    return insights;
  }, [rows, campaignTotals, totals]);
  
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
  
    if (!file) return;
  
    try {
      const buffer = await file.arrayBuffer();
  
      const workbook = XLSX.read(buffer, {
        type: "array",
      });
  
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        firstSheet,
        {
          defval: "",
        }
      );
  
      const parsedRows: PPCRow[] = rawRows
        .map((row) => {
          const getValue = (...keys: string[]) => {
            const key = Object.keys(row).find((rowKey) =>
              keys.some(
                (key) =>
                  rowKey.trim().toLowerCase() === key.toLowerCase()
              )
            );
  
            return key ? row[key] : "";
          };
  
          const sku = String(
            getValue("SKU", "Advertised SKU", "Customer Search Term")
          ).trim();
  
          const product = String(
            getValue("Campaign Name", "Ad Group Name", "Product Name")
          ).trim();
  
          const spend = Number(
            getValue("Spend", "Cost", "Total Spend")
          ) || 0;
  
          const sales = Number(
            getValue(
              "7 Day Total Sales",
              "7 Day Total Sales (₹)",
              "Sales",
              "Attributed Sales"
            )
          ) || 0;
  
          const units = Number(
            getValue(
              "7 Day Total Units (#)",
              "7 Day Total Units",
              "Units",
              "Orders"
            )
          ) || 0;
  
          return {
            sku,
            product,
            campaign: product,
            spend,
            sales,
            units,
          };
        })
        .filter(
          (row) =>
            row.sku ||
            row.product ||
            row.spend > 0 ||
            row.sales > 0 ||
            row.units > 0
        );
  
      setRows(parsedRows);
      localStorage.setItem(
        PPC_STORAGE_KEY,
        JSON.stringify(parsedRows)
      );
  
      console.log("Imported PPC rows:", parsedRows);
    } catch (error) {
      console.error("PPC report import failed:", error);
      alert("Unable to read this Amazon PPC report.");
    }
  
    event.target.value = "";
  };
  const handleSearchTermUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
  
    if (!file) return;
  
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, {
        type: "array",
      });
  
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
  
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        worksheet,
        {
          defval: "",
        }
      );
  
      const getValue = (
        row: Record<string, unknown>,
        ...names: string[]
      ) => {
        const rowKeys = Object.keys(row);
      
        for (const name of names) {
          const exactKey = rowKeys.find(
            (key) => key.toLowerCase() === name.toLowerCase()
          );
      
          if (
            exactKey &&
            row[exactKey] !== undefined &&
            row[exactKey] !== null
          ) {
            return row[exactKey];
          }
        }
      
        return "";
      };
      
  
      const toNumber = (value: unknown) => {
        const cleaned = String(value ?? "")
          .replace(/[₹,%]/g, "")
          .replace(/,/g, "")
          .trim();
  
        const number = Number(cleaned);
  
        return Number.isFinite(number) ? number : 0;
      };
  
      const parsedSearchTerms: SearchTermRow[] = rawRows
        .map((row) => {
          const searchTerm = String(
            getValue(
              row,
              "Customer Search Term",
              "Search Term",
              "Search term"
            )
          ).trim();
  
          const campaign = String(
            getValue(row, "Campaign Name", "Campaign")
          ).trim();
  
          const adGroup = String(
            getValue(
              row,
              "Ad group name",
              "Ad Group Name"
            ) ?? ""
          ).trim();
  
          const matchType = String(
            getValue(row, "Match Type", "Match type")
          ).trim();
  
          const impressions = toNumber(
            getValue(row, "Impressions")
          );
  
          const clicks = toNumber(
            getValue(row, "Clicks")
          );
  
          const spend = toNumber(
            getValue(row, "Total cost", "Spend", "Cost")
          );
          
          const sales = toNumber(
            getValue(
              row,
              "Sales (promoted)",
              "Sales",
              "7 Day Total Sales",
              "14 Day Total Sales"
            )
          );
          
          const orders = toNumber(
            getValue(
              row,
              "Purchases (promoted)",
              "Purchases",
              "Orders",
              "7 Day Total Orders (#)",
              "14 Day Total Orders (#)"
            )
          );
  
          return {
            searchTerm,
            campaign,
            adGroup,
            matchType,
            impressions,
            clicks,
            spend,
            sales,
            orders,
          };
        })
        setSearchTerms(parsedSearchTerms);
        
  
      
  
      localStorage.setItem(
        "seller-dashboard-search-terms",
        JSON.stringify(parsedSearchTerms)
      );
  
      console.log("SEARCH TERM HEADERS:", Object.keys(rawRows[0] ?? {}));
console.log("FIRST SEARCH TERM ROW:", rawRows[0]);
console.log("PARSED SEARCH TERM:", parsedSearchTerms[0]);
    } catch (error) {
      console.error("Failed to import Search Term Report:", error);
    }
  
    event.target.value = "";
  };
  const handleAdvertisedProductUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
  
    if (!file) return;
  
    try {
      const buffer = await file.arrayBuffer();
  
      const workbook = XLSX.read(buffer, {
        type: "array",
      });
  
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
  
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        worksheet,
        {
          defval: "",
        }
      );
  
      const getProductValue = (
        row: Record<string, unknown>,
        names: string[]
      ): unknown => {
        const rowKeys = Object.keys(row);
  
        for (const name of names) {
          const exactKey = rowKeys.find(
            (key) => key.toLowerCase() === name.toLowerCase()
          );
  
          if (
            exactKey &&
            row[exactKey] !== undefined &&
            row[exactKey] !== null &&
            row[exactKey] !== ""
          ) {
            return row[exactKey];
          }
        }
  
        return "";
      };
  
      const toNumber = (value: unknown): number => {
        if (typeof value === "number") return value;
  
        const parsed = Number(
          String(value ?? "")
            .replace(/,/g, "")
            .replace(/%/g, "")
            .trim()
        );
  
        return Number.isFinite(parsed) ? parsed : 0;
      };
  
      const productData: ProductPPCPerformance[] = rawRows
        .map((row) => {
          const product =
            String(
              getProductValue(row, [
                "Advertised SKU",
                "Advertised ASIN",
                "ASIN",
                "SKU",
              ])
            ).trim() || "Unknown Product";
  
          const campaign =
            String(
              getProductValue(row, [
                "Campaign Name",
                "Campaign",
              ])
            ).trim() || "Unknown Campaign";
  
          const adGroup =
            String(
              getProductValue(row, [
                "Ad Group Name",
                "Ad Group",
              ])
            ).trim() || "Unknown Ad Group";
  
          const impressions = toNumber(
            getProductValue(row, ["Impressions"])
          );
  
          const clicks = toNumber(
            getProductValue(row, ["Clicks"])
          );
  
          const spend = toNumber(
            getProductValue(row, [
              "Spend",
              "Total Cost",
            ])
          );
  
          const sales = toNumber(
            getProductValue(row, [
              "Sales",
              "7 Day Total Sales",
              "7 Day Advertised Product Sales",
            ])
          );
  
          const orders = toNumber(
            getProductValue(row, [
              "Orders",
              "Purchases",
              "7 Day Total Orders (#)",
              "7 Day Advertised Product Orders (#)",
            ])
          );
  
          const calculatedAcos =
            sales > 0 ? (spend / sales) * 100 : 0;
  
          const calculatedRoas =
            spend > 0 ? sales / spend : 0;
  
          const conversionRate =
            clicks > 0 ? (orders / clicks) * 100 : 0;
  
          let action: ProductPPCPerformance["action"] = "Monitor";
          let reason =
            "Product performance is within a reasonable range.";
  
          if (spend > 0 && sales === 0) {
            action = "Review";
            reason =
              "Spend recorded without attributed sales.";
          } else if (
            sales > 0 &&
            calculatedAcos <= 30 &&
            calculatedRoas >= 3
          ) {
            action = "Scale";
            reason =
              "Strong sales, efficient ACOS and healthy ROAS.";
          } else if (
            sales > 0 &&
            calculatedAcos >= 70
          ) {
            action = "Reduce Bid";
            reason =
              "High ACOS is reducing advertising efficiency.";
          } else if (
            clicks >= 10 &&
            orders === 0
          ) {
            action = "Review";
            reason =
              "Clicks are being generated without orders.";
          }
  
          return {
            product,
            campaign,
            adGroup,
            impressions,
            clicks,
            spend,
            sales,
            orders,
            acos: calculatedAcos,
            roas: calculatedRoas,
            conversionRate,
            action,
            reason,
          };
        })
        .filter((row) => row.product !== "Unknown Product");
  
      setProductPPCPerformance(productData);
  
      event.target.value = "";
    } catch (error) {
      console.error(
        "Failed to import Advertised Product Report:",
        error
      );
    }
  };
  const keywordRecommendations = searchTerms
  .filter((term) => term.searchTerm)
  .map((term: SearchTermRow) => {
    const ctr =
      term.impressions > 0
        ? (term.clicks / term.impressions) * 100
        : 0;

    const acos =
      term.sales > 0
        ? (term.spend / term.sales) * 100
        : 0;

        let action = "Monitor";
    let reason = "Performance is within a reasonable range.";
    
    if (term.sales > 0 && acos <= 30 && ctr >= 1) {
      action = "Scale";
      reason = "Strong sales, efficient ACOS and healthy CTR.";
    } else if (term.spend > 0 && term.sales === 0 && term.clicks >= 10) {
      action = "Negative / Pause";
      reason = "High click volume and spend with no attributed sales.";
    } else if (term.spend > 0 && term.sales === 0 && term.clicks > 0) {
      action = "Review";
      reason = "Spend and clicks recorded, but no attributed sales.";
    } else if (term.sales > 0 && acos >= 70) {
      action = "Reduce Bid";
      reason = "High ACOS is reducing advertising efficiency.";
    }

    return {
      ...term,
      ctr,
      acos,
      action,
      reason,
    };
  })
  
  .filter((term) => term.action !== "Monitor")
  .sort(
    (a: SearchTermRow & { ctr: number; acos: number; action: string; reason: string },
     b: SearchTermRow & { ctr: number; acos: number; action: string; reason: string }) =>
      b.spend - a.spend
  );
  const campaignRecommendations: CampaignRecommendation[] = Object.values(
    rows.reduce(
      (groups, row) => {
        const campaign = row.campaign?.trim() || "Unknown Campaign";
  
        if (!groups[campaign]) {
          groups[campaign] = {
            campaign,
            spend: 0,
            sales: 0,
          };
        }
  
        groups[campaign].spend += row.spend;
        groups[campaign].sales += row.sales;
  
        return groups;
      },
      {} as Record<
        string,
        {
          campaign: string;
          spend: number;
          sales: number;
        }
      >
    )
  ).map((campaign) => {
    const acos =
      campaign.sales > 0
        ? (campaign.spend / campaign.sales) * 100
        : 0;
  
    const roas =
      campaign.spend > 0
        ? campaign.sales / campaign.spend
        : 0;
  
    let action: CampaignRecommendation["action"] = "Monitor";
    let reason = "Campaign performance is within a reasonable range.";
  
    if (campaign.spend > 0 && campaign.sales === 0) {
      action = "Pause";
      reason = "Campaign has spend but no attributed sales.";
    } else if (campaign.sales > 0 && acos <= 30 && roas >= 3) {
      action = "Increase Budget";
      reason = "Strong sales, efficient ACOS and healthy ROAS.";
    } else if (campaign.sales > 0 && acos >= 70) {
      action = "Reduce Bid";
      reason = "High ACOS is reducing campaign efficiency.";
    } else if (campaign.sales > 0 && acos >= 50) {
      action = "Reduce Budget";
      reason = "Campaign ACOS is high and budget efficiency should be improved.";
    }
  
    return {
      campaign: campaign.campaign,
      spend: campaign.spend,
      sales: campaign.sales,
      acos,
      roas,
      action,
      reason,
    };
  });
  const campaignOptimizations: CampaignOptimization[] =
  campaignRecommendations.map((campaign) => {
    const isStrong =
      campaign.sales > 0 &&
      campaign.acos <= 30 &&
      campaign.roas >= 3;

    const isWeak =
      campaign.sales > 0 &&
      campaign.acos >= 70;

    const hasNoSales =
      campaign.spend > 0 &&
      campaign.sales === 0;

    return {
      campaign: campaign.campaign,
      currentBudget: 0,
      suggestedBudget: 0,
      budgetChangePercent: isStrong
        ? 20
        : isWeak || hasNoSales
          ? -20
          : 0,
      currentBid: 0,
      suggestedBid: 0,
      bidChangePercent: isWeak || hasNoSales ? -20 : 0,
      reason: isStrong
        ? "Strong performance. Consider increasing budget by 20% once the current campaign budget is available."
        : isWeak
          ? "High ACOS. Consider reducing bids by 20% once current bid data is available."
          : hasNoSales
            ? "Spend without sales. Consider reducing bids by 20% or pausing after reviewing search terms."
            : "Performance does not currently require a budget or bid adjustment."
    };
  });
  return (
    <main className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            PPC / Advertising
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Track Amazon advertising spend, sales, ACOS and ROAS.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Ad Spend
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              ₹{totals.spend.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Ad Sales
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              ₹{totals.sales.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              ACOS
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {totals.acos.toFixed(2)}%
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              ROAS
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {totals.roas.toFixed(2)}x
            </p>
          </div>
        </div>

        {/* Import */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Amazon Ads Report
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Import your Amazon advertising report to calculate PPC
                performance.
              </p>
            </div>

            <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600">
              Import Report
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <div className="mt-3">
  <label
    htmlFor="search-term-report-upload"
    className="inline-flex cursor-pointer items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
  >
    🔍 Import Search Term Report
  </label>

  <input
    id="search-term-report-upload"
    type="file"
    accept=".xlsx,.xls,.csv"
    className="hidden"
    onChange={handleSearchTermUpload}
  />
</div>
<div className="mt-3">
  <label
    htmlFor="advertised-product-report-upload"
    className="inline-flex cursor-pointer items-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
  >
    📦 Import Advertised Product Report
  </label>

  <input
    id="advertised-product-report-upload"
    type="file"
    accept=".xlsx,.xls,.csv"
    className="hidden"
    onChange={handleAdvertisedProductUpload}
  />
</div>
          </div>
        </section>

        {/* Product PPC Table */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Product PPC Performance
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Advertising performance by SKU.
            </p>
          </div>

          {rows.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <p className="text-sm font-medium text-slate-600">
                No PPC data imported yet.
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Import an Amazon Ads report to see product-level performance.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Product
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      SKU
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Spend
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Ad Sales
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Units
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      ACOS
                    </th>
                  </tr>
                </thead>

                <tbody>
                {rows.map((row, index) => {
                    const acos =
                      row.sales > 0 ? (row.spend / row.sales) * 100 : 0;

                    return (
                      <tr
                      key={`${row.sku}-${index}`}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-5 py-4 text-sm font-medium text-slate-900">
                          {row.product}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {row.sku}
                        </td>

                        <td className="px-5 py-4 text-right text-sm text-slate-700">
                          ₹{row.spend.toLocaleString("en-IN")}
                        </td>

                        <td className="px-5 py-4 text-right text-sm text-slate-700">
                          ₹{row.sales.toLocaleString("en-IN")}
                        </td>

                        <td className="px-5 py-4 text-right text-sm text-slate-700">
                          {row.units}
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-semibold text-slate-900">
                          {acos.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      
{/* PPC Health & Insights */}
<section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
  <div className="border-b border-slate-200 px-5 py-4">
    <h2 className="text-lg font-semibold text-slate-900">
      ✨ PPC Health & Insights
    </h2>
    <p className="mt-1 text-sm text-slate-500">
      Automated insights based on your advertising performance.
    </p>
  </div>

  {ppcInsights.length === 0 ? (
    <div className="px-5 py-10 text-center">
      <p className="font-medium text-slate-700">
        No PPC insights available yet.
      </p>
      <p className="mt-1 text-sm text-slate-400">
        Import an Amazon Ads report to generate recommendations.
      </p>
    </div>
  ) : (
    <div className="grid gap-4 p-5 md:grid-cols-2">
      {ppcInsights.map((insight, index) => {
        const styles = {
          success: {
            box: "border-emerald-200 bg-emerald-50",
            icon: "🟢",
            title: "text-emerald-800",
            text: "text-emerald-700",
          },
          warning: {
            box: "border-amber-200 bg-amber-50",
            icon: "⚠️",
            title: "text-amber-800",
            text: "text-amber-700",
          },
          danger: {
            box: "border-red-200 bg-red-50",
            icon: "🔴",
            title: "text-red-800",
            text: "text-red-700",
          },
          info: {
            box: "border-blue-200 bg-blue-50",
            icon: "ℹ️",
            title: "text-blue-800",
            text: "text-blue-700",
          },
        }[insight.type];

        return (
          <div
            key={`${insight.title}-${index}`}
            className={`rounded-xl border p-4 ${styles.box}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">{styles.icon}</span>

              <div>
                <h3 className={`font-semibold ${styles.title}`}>
                  {insight.title}
                </h3>

                <p className={`mt-1 text-sm leading-6 ${styles.text}`}>
                  {insight.message}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  )}
</section>
{/* PPC Action Center */}
<section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
  <div className="border-b border-slate-200 px-5 py-4">
    <h2 className="text-lg font-semibold text-slate-900">
      🎯 PPC Action Center
    </h2>
    <p className="mt-1 text-sm text-slate-500">
      Recommended actions based on your campaign performance.
    </p>
  </div>

  <div className="grid gap-4 p-5 md:grid-cols-2">

    {/* SCALE CAMPAIGNS */}
    <div className="rounded-xl border border-green-200 bg-green-50 p-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">🟢</span>
        <h3 className="font-semibold text-green-800">
          Scale Campaigns
        </h3>
      </div>

      {actionCenter.scale.length === 0 ? (
        <p className="mt-3 text-sm text-green-700">
          No campaigns currently qualify for scaling.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {actionCenter.scale.map((campaign, index) => {
            const isPaused = pausedCampaigns.includes(campaign.campaign);

            return (
              <div
                key={`scale-${campaign.campaign}-${index}`}
                className="rounded-lg bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {campaign.campaign}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      ROAS: {campaign.roas.toFixed(2)}x · ACOS:{" "}
                      {campaign.acos.toFixed(2)}%
                    </p>

                    <p className="mt-1 text-sm text-green-700">
                      Strong performance — consider increasing budget/bids.
                    </p>
                  </div>

                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                    HIGH
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      alert(
                        `Recommended: Increase budget/bid for "${campaign.campaign}".`
                      )
                    }
                    className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    ↑ Increase Bid
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      toggleCampaignPause(campaign.campaign)
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {isPaused ? "▶ Resume" : "⏸ Pause"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

    {/* REDUCE / PAUSE */}
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">🔴</span>
        <h3 className="font-semibold text-red-800">
          Reduce / Pause
        </h3>
      </div>

      {actionCenter.reduce.length === 0 ? (
        <p className="mt-3 text-sm text-red-700">
          No campaigns currently require reduction.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {actionCenter.reduce.map((campaign, index) => {
            const isPaused = pausedCampaigns.includes(campaign.campaign);

            return (
              <div
                key={`reduce-${campaign.campaign}-${index}`}
                className="rounded-lg bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {campaign.campaign}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Spend: ₹{campaign.spend.toFixed(2)} · ACOS:{" "}
                      {campaign.acos.toFixed(2)}%
                    </p>

                    <p className="mt-1 text-sm text-red-600">
                      High ACOS — consider reducing bids or pausing.
                    </p>
                  </div>

                  <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                    HIGH
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      alert(
                        `Recommended: Decrease bid for "${campaign.campaign}".`
                      )
                    }
                    className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    ↓ Decrease Bid
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      toggleCampaignPause(campaign.campaign)
                    }
                    className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    {isPaused ? "▶ Resume" : "⏸ Pause"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

    {/* WASTED SPEND */}
    <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">🟠</span>
        <h3 className="font-semibold text-orange-800">
          Wasted Ad Spend
        </h3>
      </div>

      {actionCenter.wasted.length === 0 ? (
        <p className="mt-3 text-sm text-orange-700">
          No wasted ad spend detected.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {actionCenter.wasted.map((campaign, index) => (
            <div
              key={`wasted-${campaign.campaign}-${index}`}
              className="rounded-lg bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">
                    {campaign.campaign}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    ₹{campaign.spend.toFixed(2)} spent · ₹
                    {campaign.sales.toFixed(2)} sales
                  </p>

                  <p className="mt-1 text-sm text-orange-700">
                    Review targeting and search terms.
                  </p>
                </div>

                <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700">
                  REVIEW
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  alert(
                    `Review targeting and search terms for "${campaign.campaign}".`
                  )
                }
                className="mt-3 rounded-lg border border-orange-300 bg-white px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50"
              >
                🔎 Review Campaign
              </button>
              <button
  type="button"
  onClick={() => toggleCampaignPause(campaign.campaign)}
  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
>
  {pausedCampaigns.includes(campaign.campaign) ? "▶ Resume" : "⏸ Pause"}
</button>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* MONITOR */}
    <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">🟡</span>
        <h3 className="font-semibold text-yellow-800">
          Monitor
        </h3>
      </div>

      {actionCenter.monitor.length === 0 ? (
        <p className="mt-3 text-sm text-yellow-700">
          No campaigns currently need monitoring.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {actionCenter.monitor.map((campaign, index) => (
            <div
              key={`monitor-${campaign.campaign}-${index}`}
              className="rounded-lg bg-white p-4 shadow-sm"
            >
              <p className="font-medium text-slate-900">
                {campaign.campaign}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Spend: ₹{campaign.spend.toFixed(2)} · Sales: ₹
                {campaign.sales.toFixed(2)}
              </p>

              <p className="mt-1 text-sm text-yellow-700">
                Continue monitoring performance.
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
  </section>
  {/* CAMPAIGN PPC OPTIMIZATION */}
<section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
  <div className="border-b border-slate-200 px-5 py-4">
    <h2 className="text-lg font-semibold text-slate-900">
      🎯 Campaign PPC Optimization
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      Recommended campaign-level actions based on spend, sales, ACOS and ROAS.
    </p>
  </div>

  {campaignRecommendations.length === 0 ? (
    <div className="p-5 text-sm text-slate-500">
      No campaign data available yet.
    </div>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Campaign</th>
            <th className="px-4 py-3">Spend</th>
            <th className="px-4 py-3">Sales</th>
            <th className="px-4 py-3">ACOS</th>
            <th className="px-4 py-3">ROAS</th>
            <th className="px-4 py-3">Recommendation</th>
            <th className="px-4 py-3">Reason</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {campaignRecommendations.map((campaign) => (
            <tr
              key={campaign.campaign}
              className="hover:bg-slate-50"
            >
              <td className="px-4 py-4 font-medium text-slate-900">
                {campaign.campaign}
              </td>

              <td className="px-4 py-4 text-slate-700">
                ₹{campaign.spend.toFixed(2)}
              </td>

              <td className="px-4 py-4 text-slate-700">
                ₹{campaign.sales.toFixed(2)}
              </td>

              <td className="px-4 py-4 font-medium text-slate-700">
                {campaign.sales > 0
                  ? `${campaign.acos.toFixed(1)}%`
                  : "—"}
              </td>

              <td className="px-4 py-4 font-medium text-slate-700">
                {campaign.spend > 0
                  ? `${campaign.roas.toFixed(2)}x`
                  : "—"}
              </td>

              <td className="px-4 py-4">
                <span
                  className={
                    campaign.action === "Increase Budget"
                      ? "inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
                      : campaign.action === "Pause"
                        ? "inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
                        : campaign.action === "Reduce Bid"
                          ? "inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700"
                          : campaign.action === "Reduce Budget"
                            ? "inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700"
                            : "inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                  }
                >
                  {campaign.action}
                </span>
              </td>

              <td className="max-w-[320px] px-4 py-4 text-slate-500">
                {campaign.reason}
              </td>
              <td className="px-4 py-4">
  {campaign.action !== "Monitor" ? (
    (() => {
      const action = campaign.action as Exclude<
        CampaignRecommendation["action"],
        "Monitor"
      >;

      const alreadyRecorded = ppcActionHistory.some(
        (history) =>
          history.campaign === campaign.campaign &&
          history.action === action
      );

      return (
        <button
          type="button"
          disabled={alreadyRecorded}
          onClick={() => {
            if (alreadyRecorded) return;

            recordPPCAction(
              campaign.campaign,
              action,
              campaign.campaign,
              ""
            );
          }}
          className={`rounded-lg px-3 py-2 text-xs font-semibold ${
            alreadyRecorded
              ? "cursor-not-allowed bg-green-100 text-green-700"
              : "bg-slate-900 text-white hover:bg-slate-700"
          }`}
        >
          {alreadyRecorded ? "✓ Recorded" : action}
        </button>
      );
    })()
  ) : null}
</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</section>
{/* BUDGET & BID INTELLIGENCE */}
<section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
  <div className="border-b border-slate-200 px-5 py-4">
    <h2 className="text-lg font-semibold text-slate-900">
      💰 Budget & Bid Intelligence
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      Suggested percentage changes based on campaign performance.
    </p>
  </div>

  {campaignOptimizations.length === 0 ? (
    <div className="p-5 text-sm text-slate-500">
      No campaign optimization data available yet.
    </div>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Campaign</th>
            <th className="px-4 py-3">Budget Recommendation</th>
            <th className="px-4 py-3">Bid Recommendation</th>
            <th className="px-4 py-3">Reason</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {campaignOptimizations.map((optimization) => (
            <tr
              key={optimization.campaign}
              className="hover:bg-slate-50"
            >
              <td className="px-4 py-4 font-medium text-slate-900">
                {optimization.campaign}
              </td>

              <td className="px-4 py-4">
                {optimization.budgetChangePercent > 0 ? (
                  <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Increase Budget +{optimization.budgetChangePercent}%
                  </span>
                ) : optimization.budgetChangePercent < 0 ? (
                  <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                    Reduce Budget {optimization.budgetChangePercent}%
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    No Change
                  </span>
                )}
              </td>

              <td className="px-4 py-4">
                {optimization.bidChangePercent < 0 ? (
                  <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                    Reduce Bid {optimization.bidChangePercent}%
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    No Change
                  </span>
                )}
              </td>

              <td className="max-w-[420px] px-4 py-4 text-slate-500">
                {optimization.reason}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</section>
  {/* PPC PRIORITY SUMMARY */}
  <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 className="font-semibold text-slate-900">
          📊 PPC Priority Summary
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Automatically prioritized from your current campaign data.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">
          {actionCenter.reduce.length} High Risk
        </span>

        <span className="rounded-full bg-orange-100 px-3 py-1 text-orange-700">
          {actionCenter.wasted.length} Wasted Spend
        </span>

        <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
          {actionCenter.scale.length} Scale
        </span>

        <span className="rounded-full bg-yellow-100 px-3 py-1 text-yellow-700">
          {actionCenter.monitor.length} Monitor
        </span>
      </div>
    </div>
  </div>

  {/* KEYWORD RECOMMENDATIONS */}
<section className="border-t border-slate-200 px-5 py-4">
  <div className="flex items-center gap-2">
    <span className="text-xl">🔎</span>

    <div>
      <h3 className="font-semibold text-slate-900">
        Keyword Recommendations
      </h3>

      <p className="text-sm text-slate-500">
        Search-term recommendations based on your imported Amazon Search Term Report.
      </p>
    </div>
  </div>

  {keywordRecommendations.length === 0 ? (
    <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
      <p className="font-medium text-slate-700">
        No keyword recommendations yet.
      </p>

      <p className="mt-1">
        Import your Amazon Search Term Report to identify high-performing,
        high-spend and under-performing search terms.
      </p>
    </div>
  ) : (
    <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Search Term</th>
            <th className="px-4 py-3">Campaign</th>
            <th className="px-4 py-3">Match Type</th>
            <th className="px-4 py-3 text-left">AD GROUP</th>
            <th className="px-4 py-3 text-right">Clicks</th>
            <th className="px-4 py-3 text-right">Spend</th>
            <th className="px-4 py-3 text-right">Sales</th>
            <th className="px-4 py-3 text-right">ACOS</th>
            <th className="px-4 py-3">Recommendation</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 bg-white">
          {keywordRecommendations.slice(0, 20).map((term, index) => (
            <tr key={`${term.searchTerm}-${term.campaign}-${index}`} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">
                {term.searchTerm}
              </td>

              <td className="px-4 py-3 text-slate-600">
                {term.campaign || "—"}
              </td>

              <td className="px-4 py-3 text-slate-600">
                {term.matchType || "—"}
              </td>
              <td className="px-4 py-3 text-left text-slate-700">
  {term.adGroup || "—"}
</td>

              <td className="px-4 py-3 text-right text-slate-700">
                {term.clicks}
              </td>

              <td className="px-4 py-3 text-right text-slate-700">
                ₹{term.spend.toFixed(2)}
              </td>

              <td className="px-4 py-3 text-right text-slate-700">
                ₹{term.sales.toFixed(2)}
              </td>

              <td className="px-4 py-3 text-right font-medium text-slate-700">
              {term.sales > 0 ? `${term.acos.toFixed(1)}%` : "—"}
              </td>

              <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  <span
                    className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                        term.action === "Scale"
                        ? "bg-green-100 text-green-700"
                        : term.action === "Negative / Pause"
                          ? "bg-red-100 text-red-700"
                          : term.action === "Reduce Bid"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {term.action}
                  </span>

                  <span className="text-xs text-slate-500">
                    {term.reason}
                  </span>
                </div>
              </td>
              {term.action === "Negative / Pause" && (
  
    <td className="px-4 py-3">
      <button
        type="button"
        onClick={() => handleAddNegativeKeyword(term)}
        className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
      >
        Add Negative
      </button>
    </td>
  )}
            </tr>
          ))}
        </tbody>
      </table>

      {keywordRecommendations.length > 20 && (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs text-slate-500">
          Showing the top 20 recommendations by ad spend.
        </div>
      )}
    </div>
  )}
</section>

{/* NEGATIVE KEYWORDS */}
<section className="mt-6 overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
  <div className="border-b border-red-100 bg-red-50 px-5 py-4">
    <div className="flex items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-red-800">
          🚫 Negative Keywords
        </h2>

        <p className="mt-1 text-sm text-red-700">
          Search terms you've marked for negative targeting.
        </p>
      </div>

      <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
      {isMounted ? negativeKeywordDetails.length : 0}
      </span>
    </div>
  </div>

  {!isMounted || negativeKeywordDetails.length === 0 ? (
    <div className="p-5 text-sm text-slate-500">
      No negative keywords added yet.
    </div>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Keyword</th>
            <th className="px-4 py-3">Campaign</th>
            <th className="px-4 py-3">Ad Group</th>
            <th className="px-4 py-3 text-right">Clicks</th>
            <th className="px-4 py-3 text-right">Spend</th>
            <th className="px-4 py-3 text-right">Sales</th>
            <th className="px-4 py-3">Reason</th>
<th className="px-4 py-3">Status</th>
<th className="px-4 py-3">Added</th>
<th className="px-4 py-3">Action</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {negativeKeywordDetails.map((item) => (
            <tr
              key={`${item.keyword}-${item.addedAt}`}
              className="hover:bg-slate-50"
            >
              <td className="px-4 py-3 font-medium text-slate-800">
                {item.keyword}
              </td>

              <td className="px-4 py-3 text-slate-600">
                {item.campaign}
              </td>

              <td className="px-4 py-3 text-slate-600">
                {item.adGroup}
              </td>

              <td className="px-4 py-3 text-right text-slate-700">
                {item.clicks}
              </td>

              <td className="px-4 py-3 text-right text-slate-700">
                ₹{item.spend.toFixed(2)}
              </td>

              <td className="px-4 py-3 text-right text-slate-700">
                ₹{item.sales.toFixed(2)}
              </td>

              <td className="px-4 py-3 text-slate-600">
  {item.reason}
</td>

<td className="px-4 py-3">
  <span
    className={
      item.status === "Added to Amazon"
        ? "inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700"
        : "inline-flex rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-700"
    }
  >
    {item.status}
  </span>
</td>

<td className="px-4 py-3 whitespace-nowrap text-slate-500">
                {new Date(item.addedAt).toLocaleDateString()}
              </td>

              <td className="px-4 py-3">
              <div className="flex items-center gap-2">
  {item.status === "Pending" && (
    <button
      type="button"
      onClick={() => {
        recordPPCAction(
            item.keyword,
            "Marked Added to Amazon",
            item.campaign,
            item.adGroup
          );
          recordPPCAction(
            item.keyword,
            "Removed",
            item.campaign,
            item.adGroup
          );
        setNegativeKeywordDetails((current) => {
          const updated = current.map((negative) =>
            negative.keyword === item.keyword &&
            negative.addedAt === item.addedAt
              ? {
                  ...negative,
                  status: "Added to Amazon" as const,
                }
              : negative
          );

          localStorage.setItem(
            "seller-dashboard-negative-keyword-details",
            JSON.stringify(updated)
          );

          return updated;
        });
      }}
      className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
    >
      Mark Added
    </button>
  )}

  <button
    type="button"
    onClick={() => {
      setNegativeKeywordDetails((current) => {
        const updated = current.filter(
          (negative) =>
            !(
              negative.keyword === item.keyword &&
              negative.addedAt === item.addedAt
            )
        );

        localStorage.setItem(
          "seller-dashboard-negative-keyword-details",
          JSON.stringify(updated)
        );

        return updated;
      });

      setNegativeKeywords((current) =>
        current.filter(
          (keyword) => keyword !== item.keyword
        )
      );
    }}
    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
  >
    Remove
  </button>
</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</section>
{/* PPC ACTION HISTORY */}
<section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
  <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
    <div className="flex items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          📋 PPC Action History
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Track changes made to your negative keyword recommendations.
        </p>
      </div>

      <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-semibold text-slate-700">
        {ppcActionHistory.length}
      </span>
    </div>
  </div>

  {ppcActionHistory.length === 0 ? (
    <div className="p-5 text-sm text-slate-500">
      No PPC actions recorded yet.
    </div>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Keyword</th>
            <th className="px-4 py-3">Campaign</th>
            <th className="px-4 py-3">Ad Group</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {ppcActionHistory.map((history) => (
            <tr
            key={`${history.id}-${history.keyword}-${history.campaign}-${history.action}`}
              className="hover:bg-slate-50"
            >
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                {new Date(history.timestamp).toLocaleString()}
              </td>

              <td className="px-4 py-3 font-medium text-slate-800">
                {history.keyword}
              </td>

              <td className="px-4 py-3 text-slate-600">
                {history.campaign}
              </td>

              <td className="px-4 py-3 text-slate-600">
                {history.adGroup}
              </td>

              <td className="px-4 py-3">
                <span
                  className={
                    history.action === "Added Negative"
                      ? "inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700"
                      : history.action === "Marked Added to Amazon"
                        ? "inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700"
                        : "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
                  }
                >
                  {history.action}
                </span>
              </td>
              <td className="px-4 py-3">
  <div className="flex items-center gap-2">
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        history.status === "Completed"
          ? "bg-green-100 text-green-700"
          : "bg-yellow-100 text-yellow-700"
      }`}
    >
      {history.status ?? "Pending"}
    </span>

    {history.status !== "Completed" && (
      <button
        type="button"
        onClick={() => markPPCActionCompleted(history.id)}
        className="rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
      >
        Mark Completed
      </button>
    )}
  </div>
</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</section>
{/* Campaign Performance */}
<section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
  <div className="border-b border-slate-200 px-5 py-4">
    <h2 className="text-lg font-semibold text-slate-900">
      Campaign Performance
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      Advertising performance by campaign.
    </p>
  </div>

  {campaignTotals.length === 0 ? (
    <div className="px-5 py-16 text-center">
      <p className="font-medium text-slate-700">
        No campaign data imported yet.
      </p>

      <p className="mt-1 text-sm text-slate-400">
        Import an Amazon Ads report to see campaign-level performance.
      </p>
    </div>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left">
            <th className="px-5 py-4 font-semibold text-slate-500">
              CAMPAIGN
            </th>
            <th className="px-5 py-4 text-right font-semibold text-slate-500">
              SPEND
            </th>
            <th className="px-5 py-4 text-right font-semibold text-slate-500">
              AD SALES
            </th>
            <th className="px-5 py-4 text-right font-semibold text-slate-500">
              UNITS
            </th>
            <th className="px-5 py-4 text-right font-semibold text-slate-500">
              ACOS
            </th>
            <th className="px-5 py-4 text-right font-semibold text-slate-500">
              ROAS
            </th>
          </tr>
        </thead>

        <tbody>
        {campaignTotals.map((campaign, index) => (
            <tr
            key={`${campaign.campaign}-${index}`}
              className="border-b border-slate-100 last:border-0"
            >
              <td className="px-5 py-4 font-medium text-slate-800">
                {campaign.campaign}
              </td>

              <td className="px-5 py-4 text-right text-slate-700">
                ₹{campaign.spend.toFixed(2)}
              </td>

              <td className="px-5 py-4 text-right text-slate-700">
                ₹{campaign.sales.toFixed(2)}
              </td>

              <td className="px-5 py-4 text-right text-slate-700">
                {campaign.units}
              </td>

              <td className="px-5 py-4 text-right font-semibold">
                {campaign.acos.toFixed(2)}%
              </td>

              <td className="px-5 py-4 text-right font-semibold">
                {campaign.roas.toFixed(2)}x
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</section>
</div>
</main>
);
}
 