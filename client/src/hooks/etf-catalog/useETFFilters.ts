import type { ETF } from "@/data/etfs";
import { useState, useMemo, useEffect } from "react";

export function useETFFilters(etfs: ETF[], favorites: Set<string>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, assetTypeFilter, riskFilter, sortBy, showFavoritesOnly]);

  const filteredETFs = useMemo(() => {
    let filtered = etfs.filter((etf) => {
      const matchesSearch =
        etf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        etf.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        etf.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAssetType =
        assetTypeFilter === "all" || etf.assetType === assetTypeFilter;
      const matchesRisk = riskFilter === "all" || etf.riskLevel === riskFilter;
      const matchesFavorites = !showFavoritesOnly || favorites.has(etf.ticker);

      return (
        matchesSearch && matchesAssetType && matchesRisk && matchesFavorites
      );
    });

    // Sort ETFs
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "ticker":
          return a.ticker.localeCompare(b.ticker);
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    etfs,
    searchTerm,
    assetTypeFilter,
    riskFilter,
    sortBy,
    showFavoritesOnly,
    favorites,
  ]);

  const clearFilters = () => {
    setSearchTerm("");
    setAssetTypeFilter("all");
    setRiskFilter("all");
    setSortBy("name");
    setShowFavoritesOnly(false);
  };

  const activeFiltersCount = [
    searchTerm !== "",
    assetTypeFilter !== "all",
    riskFilter !== "all",
    sortBy !== "name",
    showFavoritesOnly,
  ].filter(Boolean).length;

  return {
    searchTerm,
    setSearchTerm,
    assetTypeFilter,
    setAssetTypeFilter,
    riskFilter,
    setRiskFilter,
    sortBy,
    setSortBy,
    showFavoritesOnly,
    setShowFavoritesOnly,
    currentPage,
    setCurrentPage,
    filteredETFs,
    clearFilters,
    activeFiltersCount,
  };
}
