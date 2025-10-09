import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Search,
  Filter,
  X,
  ArrowUpDown,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface FilterPanelProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  assetTypeFilter: string;
  setAssetTypeFilter: (value: string) => void;
  riskFilter: string;
  setRiskFilter: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  assetTypes: string[];
  riskLevels: string[];
  clearFilters: () => void;
  filtersCollapsed: boolean;
  setFiltersCollapsed: (value: boolean) => void;
  activeFiltersCount: number;
  mobileFiltersOpen: boolean;
  setMobileFiltersOpen: (value: boolean) => void;
}

const FilterSection = ({
  searchTerm,
  setSearchTerm,
  assetTypeFilter,
  setAssetTypeFilter,
  riskFilter,
  setRiskFilter,
  sortBy,
  setSortBy,
  assetTypes,
  riskLevels,
  clearFilters,
}: Omit<
  FilterPanelProps,
  | "filtersCollapsed"
  | "setFiltersCollapsed"
  | "activeFiltersCount"
  | "mobileFiltersOpen"
  | "setMobileFiltersOpen"
>) => (
  <div className="space-y-6">
    {/* Search Section */}
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Search className="h-4 w-4" />
        Search
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search ETFs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-muted/30 pl-10"
        />
      </div>
    </div>

    {/* Filter Section */}
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <SlidersHorizontal className="h-4 w-4" />
        Filter by
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Asset Type Filter */}
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-muted-foreground">
            Asset Type
          </label>
          <Select value={assetTypeFilter} onValueChange={setAssetTypeFilter}>
            <SelectTrigger className="bg-muted/30">
              <SelectValue placeholder="All Asset Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Asset Types</SelectItem>
              {assetTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Risk Level Filter */}
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-muted-foreground">
            Risk Level
          </label>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="bg-muted/30">
              <SelectValue placeholder="All Risk Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              {riskLevels.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>

    {/* Sort Section */}
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <ArrowUpDown className="h-4 w-4" />
        Sort by
      </div>
      <div className="space-y-1">
        <label className="text-xs uppercase tracking-wide text-muted-foreground">
          Order
        </label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="bg-muted/30">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="ticker">Ticker</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    {/* Clear Filters Button */}
    <div className="flex justify-end pt-2">
      <Button
        variant="outline"
        onClick={clearFilters}
        className="flex items-center gap-2"
      >
        <X className="h-4 w-4" />
        Clear Filters
      </Button>
    </div>
  </div>
);

export function FilterPanel(props: FilterPanelProps) {
  return (
    <>
      {/* Desktop Filters */}
      <Card className="mb-6 hidden transition-all duration-300 md:block">
        <CardHeader
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => props.setFiltersCollapsed(!props.filtersCollapsed)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
              {props.activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {props.activeFiltersCount} active
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm">
              {props.filtersCollapsed ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </Button>
          </div>
        </CardHeader>

        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            maxHeight: props.filtersCollapsed ? "0px" : "1000px",
            opacity: props.filtersCollapsed ? 0 : 1,
          }}
        >
          <CardContent className="pt-6">
            <FilterSection
              searchTerm={props.searchTerm}
              setSearchTerm={props.setSearchTerm}
              assetTypeFilter={props.assetTypeFilter}
              setAssetTypeFilter={props.setAssetTypeFilter}
              riskFilter={props.riskFilter}
              setRiskFilter={props.setRiskFilter}
              sortBy={props.sortBy}
              setSortBy={props.setSortBy}
              assetTypes={props.assetTypes}
              riskLevels={props.riskLevels}
              clearFilters={props.clearFilters}
            />
          </CardContent>
        </div>
      </Card>

      {/* Mobile Filters */}
      <Sheet
        open={props.mobileFiltersOpen}
        onOpenChange={props.setMobileFiltersOpen}
      >
        <SheetTrigger asChild>
          <Button className="mb-6 flex w-full items-center gap-2 md:hidden">
            <Filter className="h-4 w-4" />
            Filters & Search
            {props.activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {props.activeFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 max-h-[calc(85vh-100px)] overflow-y-auto">
            <FilterSection
              searchTerm={props.searchTerm}
              setSearchTerm={props.setSearchTerm}
              assetTypeFilter={props.assetTypeFilter}
              setAssetTypeFilter={props.setAssetTypeFilter}
              riskFilter={props.riskFilter}
              setRiskFilter={props.setRiskFilter}
              sortBy={props.sortBy}
              setSortBy={props.setSortBy}
              assetTypes={props.assetTypes}
              riskLevels={props.riskLevels}
              clearFilters={props.clearFilters}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
