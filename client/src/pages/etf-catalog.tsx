import { DetailedETFView } from "@/components/DetailedETFView";
import { ETFComparison } from "@/components/ETFComparison";
import {
  FilterPanel,
  ETFCard,
  ComparisonBar,
  Pagination,
} from "@/components/etf-catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ETF_DATA, type ETF, type ETFLiveData } from "@/data/etfs";
import { useETFComparison } from "@/hooks/etf-catalog/useETFComparison";
import { useETFFavorites } from "@/hooks/etf-catalog/useETFFavorites";
import { useETFFilters } from "@/hooks/etf-catalog/useETFFilters";
import { apiRequest } from "@/lib/queryClient";
import { useQueries } from "@tanstack/react-query";
import { BarChart3, Heart } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

export default function ETFCatalog() {
  // Custom hooks
  const { favorites, toggleFavorite } = useETFFavorites();
  const { selectedForComparison, toggleComparison, clearComparison } =
    useETFComparison();

  const {
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
  } = useETFFilters(ETF_DATA, favorites);

  // UI state - filters collapsed by default
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [detailedViewETF, setDetailedViewETF] = useState<ETF | null>(null);

  // Persist filters collapsed state
  useEffect(() => {
    localStorage.setItem(
      "etf-catalog-filters-collapsed",
      JSON.stringify(filtersCollapsed),
    );
  }, [filtersCollapsed]);

  // Pagination calculations
  const itemsPerPage = 12;
  const totalPages = Math.ceil(filteredETFs.length / itemsPerPage);
  const paginatedETFs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredETFs.slice(startIndex, endIndex);
  }, [filteredETFs, currentPage]);

  // Fetch live data for paginated ETFs
  const liveDataQueries = useQueries({
    queries: paginatedETFs.map((etf) => ({
      queryKey: ["etf-live-data", etf.ticker, "v2"],
      queryFn: async () => {
        try {
          const res = await apiRequest("GET", `/api/etf/${etf.ticker}/info`);
          return await res.json();
        } catch (error) {
          console.error(`Error fetching data for ${etf.ticker}:`, error);
          return null;
        }
      },
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    })),
  });

  // Fetch live data for comparison ETFs
  const comparisonTickers = Array.from(selectedForComparison);
  const comparisonDataQueries = useQueries({
    queries: comparisonTickers.map((ticker) => ({
      queryKey: ["etf-live-data", ticker, "v2"],
      queryFn: async () => {
        try {
          const res = await apiRequest("GET", `/api/etf/${ticker}/info`);
          return await res.json();
        } catch (error) {
          console.error(`Error fetching data for ${ticker}:`, error);
          return null;
        }
      },
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    })),
  });

  // Create a map of ticker to live data
  const liveDataMap = useMemo(() => {
    const map = new Map<string, ETFLiveData>();

    const extractLiveData = (data: any): ETFLiveData => {
      let fiftyTwoWeekChange = undefined;
      if (
        data.fiftyTwoWeekChange !== undefined &&
        data.fiftyTwoWeekChange !== null
      ) {
        fiftyTwoWeekChange = data.fiftyTwoWeekChange * 100;
      } else if (
        data.fiftyTwoWeekChangePercent !== undefined &&
        data.fiftyTwoWeekChangePercent !== null
      ) {
        fiftyTwoWeekChange = data.fiftyTwoWeekChangePercent * 100;
      } else if (data.ytdReturn !== undefined && data.ytdReturn !== null) {
        fiftyTwoWeekChange = data.ytdReturn * 100;
      }

      return {
        regularMarketPrice: data.regularMarketPrice,
        trailingAnnualDividendYield:
          data.trailingAnnualDividendYield !== undefined &&
          data.trailingAnnualDividendYield !== null
            ? data.trailingAnnualDividendYield * 100
            : undefined,
        fiftyTwoWeekChange,
        expenseRatio:
          data.expenseRatio !== undefined && data.expenseRatio !== null
            ? data.expenseRatio * 100
            : undefined,
      };
    };

    paginatedETFs.forEach((etf, index) => {
      const queryResult = liveDataQueries[index];
      if (queryResult?.data) {
        map.set(etf.ticker, extractLiveData(queryResult.data));
      }
    });

    comparisonTickers.forEach((ticker, index) => {
      const queryResult = comparisonDataQueries[index];
      if (queryResult?.data && !map.has(ticker)) {
        map.set(ticker, extractLiveData(queryResult.data));
      }
    });

    return map;
  }, [
    paginatedETFs,
    liveDataQueries,
    comparisonTickers,
    comparisonDataQueries,
  ]);

  const assetTypes = Array.from(new Set(ETF_DATA.map((etf) => etf.assetType)));
  const riskLevels = Array.from(new Set(ETF_DATA.map((etf) => etf.riskLevel)));

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 text-3xl font-bold">ETF Catalog</h1>
            <p className="text-muted-foreground">
              Explore our comprehensive collection of ETFs with detailed
              information and filtering options
            </p>
          </div>
          {favorites.size > 0 && (
            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className="flex items-center gap-2"
            >
              <Heart className={showFavoritesOnly ? "fill-current" : ""} />
              Favorites
              <Badge variant="secondary" className="ml-1">
                {favorites.size}
              </Badge>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        assetTypeFilter={assetTypeFilter}
        setAssetTypeFilter={setAssetTypeFilter}
        riskFilter={riskFilter}
        setRiskFilter={setRiskFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        assetTypes={assetTypes}
        riskLevels={riskLevels}
        clearFilters={clearFilters}
        filtersCollapsed={filtersCollapsed}
        setFiltersCollapsed={setFiltersCollapsed}
        activeFiltersCount={activeFiltersCount}
        mobileFiltersOpen={mobileFiltersOpen}
        setMobileFiltersOpen={setMobileFiltersOpen}
      />

      {/* Results Summary */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredETFs.length} of {ETF_DATA.length} ETFs
          {showFavoritesOnly && " (Favorites)"}
        </p>
        {filtersCollapsed && activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFiltersCollapsed(false)}
            className="text-xs"
          >
            View Filters
          </Button>
        )}
      </div>

      {/* ETF Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {paginatedETFs.map((etf) => (
          <ETFCard
            key={etf.ticker}
            etf={etf}
            isFavorite={favorites.has(etf.ticker)}
            isInComparison={selectedForComparison.has(etf.ticker)}
            onToggleFavorite={toggleFavorite}
            onToggleComparison={toggleComparison}
            onViewDetails={setDetailedViewETF}
          />
        ))}
      </div>

      {/* Pagination */}
      {filteredETFs.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Empty State */}
      {filteredETFs.length === 0 && (
        <div className="py-12 text-center">
          <BarChart3 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No ETFs Found</h3>
          <p className="mb-4 text-muted-foreground">
            Try adjusting your search terms or filters to find ETFs that match
            your criteria.
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Clear All Filters
          </Button>
        </div>
      )}

      {/* Comparison Bar */}
      <ComparisonBar
        selectedTickers={Array.from(selectedForComparison)}
        onRemoveTicker={toggleComparison}
        onClearAll={clearComparison}
        onCompare={() => setShowComparison(true)}
      />

      {/* Detailed ETF View Modal */}
      <DetailedETFView
        etf={detailedViewETF}
        isOpen={!!detailedViewETF}
        onClose={() => setDetailedViewETF(null)}
        isFavorite={
          detailedViewETF ? favorites.has(detailedViewETF.ticker) : false
        }
        onToggleFavorite={toggleFavorite}
        onAddToComparison={toggleComparison}
        isInComparison={
          detailedViewETF
            ? selectedForComparison.has(detailedViewETF.ticker)
            : false
        }
      />

      {/* Comparison Modal */}
      <ETFComparison
        etfs={ETF_DATA.filter((etf) =>
          selectedForComparison.has(etf.ticker),
        ).map((etf) => {
          const liveData = liveDataMap.get(etf.ticker);
          return {
            ...etf,
            expenseRatio: liveData?.expenseRatio,
            dividendYield: liveData?.trailingAnnualDividendYield,
            yearlyGain: liveData?.fiftyTwoWeekChange,
            lastPrice: liveData?.regularMarketPrice,
          };
        })}
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
        onRemoveETF={toggleComparison}
      />
    </div>
  );
}
