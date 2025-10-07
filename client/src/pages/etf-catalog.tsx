import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Search, TrendingUp, TrendingDown, DollarSign, BarChart3, Filter, X, 
  ArrowUpDown, SlidersHorizontal, Heart, ChevronDown, ChevronUp, Eye 
} from "lucide-react";
import { DetailedETFView } from "@/components/DetailedETFView";
import { ETFComparison } from "@/components/ETFComparison";
import { useToast } from "@/hooks/use-toast";

interface ETF {
  ticker: string;
  name: string;
  description: string;
  assetType: string;
  category: string;
  expenseRatio: number;
  riskLevel: 'Low' | 'Moderate' | 'High';
  dividendYield?: number;
  yearlyGain?: number;
  lastPrice?: number;
  color: string;
}

// Extended ETF data with more details
const ETF_DATA: ETF[] = [
  {
    ticker: 'VTI',
    name: 'Vanguard Total Stock Market ETF',
    description: 'Provides broad exposure to the entire U.S. equity market, including small-, mid-, and large-cap growth and value stocks.',
    assetType: 'US Equity',
    category: 'Large Blend',
    expenseRatio: 0.03,
    riskLevel: 'Moderate',
    dividendYield: 1.32,
    yearlyGain: 12.5,
    lastPrice: 268.50,
    color: 'hsl(var(--chart-1))'
  },
  {
    ticker: 'VXUS',
    name: 'Vanguard Total International Stock ETF',
    description: 'Provides broad exposure to developed and emerging non-U.S. equity markets around the globe.',
    assetType: 'International Equity',
    category: 'Foreign Large Blend',
    expenseRatio: 0.07,
    riskLevel: 'Moderate',
    dividendYield: 2.85,
    yearlyGain: 8.2,
    lastPrice: 62.15,
    color: 'hsl(var(--chart-2))'
  },
  {
    ticker: 'BND',
    name: 'Vanguard Total Bond Market ETF',
    description: 'Provides broad exposure to U.S. investment-grade bonds with maturities of more than one year.',
    assetType: 'Bonds',
    category: 'Intermediate-Term Bond',
    expenseRatio: 0.03,
    riskLevel: 'Low',
    dividendYield: 3.12,
    yearlyGain: 4.1,
    lastPrice: 73.25,
    color: 'hsl(var(--chart-3))'
  },
  {
    ticker: 'VNQ',
    name: 'Vanguard Real Estate ETF',
    description: 'Provides broad exposure to U.S. real estate investment trusts (REITs) and real estate companies.',
    assetType: 'REIT',
    category: 'Real Estate',
    expenseRatio: 0.12,
    riskLevel: 'Moderate',
    dividendYield: 3.87,
    yearlyGain: 9.8,
    lastPrice: 88.90,
    color: 'hsl(var(--chart-4))'
  },
  {
    ticker: 'QQQ',
    name: 'Invesco QQQ Trust',
    description: 'Tracks the Nasdaq-100 Index, providing exposure to the largest non-financial companies listed on the Nasdaq.',
    assetType: 'US Growth',
    category: 'Large Growth',
    expenseRatio: 0.20,
    riskLevel: 'High',
    dividendYield: 0.48,
    yearlyGain: 15.2,
    lastPrice: 475.20,
    color: 'hsl(var(--chart-5))'
  },
  {
    ticker: 'VIG',
    name: 'Vanguard Dividend Appreciation ETF',
    description: 'Provides exposure to companies with a history of increasing dividends, focusing on quality dividend growth stocks.',
    assetType: 'US Dividend Equity',
    category: 'Large Blend',
    expenseRatio: 0.06,
    riskLevel: 'Low',
    dividendYield: 1.78,
    yearlyGain: 11.8,
    lastPrice: 184.75,
    color: 'hsl(var(--chart-1))'
  },
  {
    ticker: 'VYMI',
    name: 'Vanguard International High Dividend Yield ETF',
    description: 'Provides exposure to high-dividend-yield companies in developed and emerging markets outside the U.S.',
    assetType: 'International Dividend Equity',
    category: 'Foreign Large Value',
    expenseRatio: 0.22,
    riskLevel: 'Moderate',
    dividendYield: 4.35,
    yearlyGain: 7.5,
    lastPrice: 71.20,
    color: 'hsl(var(--chart-2))'
  },
  {
    ticker: 'VWO',
    name: 'Vanguard FTSE Emerging Markets ETF',
    description: 'Provides broad exposure to emerging market equities, focusing on large- and mid-cap companies.',
    assetType: 'Emerging Markets Equity',
    category: 'Diversified Emerging Markets',
    expenseRatio: 0.08,
    riskLevel: 'High',
    dividendYield: 3.12,
    yearlyGain: 6.8,
    lastPrice: 43.85,
    color: 'hsl(var(--chart-2))'
  },
  {
    ticker: 'ESGV',
    name: 'Vanguard ESG U.S. Stock ETF',
    description: 'Provides broad exposure to U.S. companies with high environmental, social, and governance (ESG) ratings.',
    assetType: 'US Equity',
    category: 'Large Blend',
    expenseRatio: 0.09,
    riskLevel: 'Moderate',
    dividendYield: 1.18,
    yearlyGain: 12.2,
    lastPrice: 95.60,
    color: 'hsl(var(--chart-1))'
  },
  {
    ticker: 'ESGD',
    name: 'iShares ESG Aware MSCI EAFE ETF',
    description: 'Provides exposure to developed market companies with high ESG ratings, excluding U.S. and Canada.',
    assetType: 'International Equity',
    category: 'Foreign Large Blend',
    expenseRatio: 0.20,
    riskLevel: 'Moderate',
    dividendYield: 2.45,
    yearlyGain: 8.1,
    lastPrice: 79.45,
    color: 'hsl(var(--chart-2))'
  },
  {
    ticker: 'SUSB',
    name: 'iShares ESG Aware USD Corporate Bond ETF',
    description: 'Provides exposure to U.S. dollar-denominated investment-grade corporate bonds with high ESG ratings.',
    assetType: 'Bonds',
    category: 'Short-Term Bond',
    expenseRatio: 0.12,
    riskLevel: 'Low',
    dividendYield: 2.89,
    yearlyGain: 3.8,
    lastPrice: 24.75,
    color: 'hsl(var(--chart-3))'
  },
  {
    ticker: 'ITOT',
    name: 'iShares Core S&P Total U.S. Stock Mkt ETF',
    description: 'Provides broad exposure to the entire U.S. stock market, including small-, mid-, and large-cap stocks.',
    assetType: 'US Equity',
    category: 'Large Blend',
    expenseRatio: 0.03,
    riskLevel: 'Moderate',
    dividendYield: 1.25,
    yearlyGain: 12.3,
    lastPrice: 120.45,
    color: 'hsl(var(--chart-1))'
  },
  {
    ticker: 'VTV',
    name: 'Vanguard Value ETF',
    description: 'Provides exposure to large-cap U.S. companies with value characteristics, focusing on undervalued stocks.',
    assetType: 'US Equity',
    category: 'Large Value',
    expenseRatio: 0.04,
    riskLevel: 'Moderate',
    dividendYield: 2.15,
    yearlyGain: 10.8,
    lastPrice: 165.80,
    color: 'hsl(var(--chart-1))'
  },
  {
    ticker: 'SPYV',
    name: 'SPDR® Portfolio S&P 500 Value ETF',
    description: 'Tracks the S&P 500 Value Index, providing exposure to large-cap U.S. value stocks.',
    assetType: 'US Equity',
    category: 'Large Value',
    expenseRatio: 0.04,
    riskLevel: 'Moderate',
    dividendYield: 1.95,
    yearlyGain: 10.5,
    lastPrice: 49.20,
    color: 'hsl(var(--chart-1))'
  },
  {
    ticker: 'VOE',
    name: 'Vanguard Mid-Cap Value ETF',
    description: 'Provides exposure to mid-cap U.S. companies with value characteristics.',
    assetType: 'US Equity',
    category: 'Mid-Cap Value',
    expenseRatio: 0.07,
    riskLevel: 'Moderate',
    dividendYield: 2.05,
    yearlyGain: 11.2,
    lastPrice: 155.30,
    color: 'hsl(var(--chart-1))'
  },
  {
    ticker: 'IWS',
    name: 'iShares Russell Mid-Cap Value ETF',
    description: 'Tracks the Russell Midcap Value Index, focusing on mid-cap value stocks.',
    assetType: 'US Equity',
    category: 'Mid-Cap Value',
    expenseRatio: 0.24,
    riskLevel: 'Moderate',
    dividendYield: 1.85,
    yearlyGain: 10.9,
    lastPrice: 125.60,
    color: 'hsl(var(--chart-1))'
  },
  {
    ticker: 'VBR',
    name: 'Vanguard Small-Cap Value ETF',
    description: 'Provides exposure to small-cap U.S. companies with value characteristics.',
    assetType: 'US Equity',
    category: 'Small Value',
    expenseRatio: 0.07,
    riskLevel: 'Moderate',
    dividendYield: 1.95,
    yearlyGain: 11.8,
    lastPrice: 185.40,
    color: 'hsl(var(--chart-1))'
  },
  {
    ticker: 'IWN',
    name: 'iShares Russell 2000 Value ETF',
    description: 'Tracks the Russell 2000 Value Index, focusing on small-cap value stocks.',
    assetType: 'US Equity',
    category: 'Small Value',
    expenseRatio: 0.24,
    riskLevel: 'High',
    dividendYield: 1.75,
    yearlyGain: 10.2,
    lastPrice: 155.80,
    color: 'hsl(var(--chart-1))'
  },
  {
    ticker: 'VEA',
    name: 'Vanguard FTSE Developed Markets ETF',
    description: 'Provides exposure to developed market stocks outside the U.S. and Canada.',
    assetType: 'International Equity',
    category: 'Foreign Large Blend',
    expenseRatio: 0.05,
    riskLevel: 'Moderate',
    dividendYield: 2.85,
    yearlyGain: 7.8,
    lastPrice: 50.15,
    color: 'hsl(var(--chart-2))'
  },
  {
    ticker: 'IEFA',
    name: 'iShares Core MSCI EAFE ETF',
    description: 'Tracks the MSCI EAFE Index, providing broad exposure to developed markets outside North America.',
    assetType: 'International Equity',
    category: 'Foreign Large Blend',
    expenseRatio: 0.07,
    riskLevel: 'Moderate',
    dividendYield: 2.65,
    yearlyGain: 8.1,
    lastPrice: 74.80,
    color: 'hsl(var(--chart-2))'
  },
  {
    ticker: 'IEMG',
    name: 'iShares Core MSCI Emerging Markets ETF',
    description: 'Tracks the MSCI Emerging Markets Index, providing broad exposure to emerging market stocks.',
    assetType: 'Emerging Markets Equity',
    category: 'Diversified Emerging Markets',
    expenseRatio: 0.11,
    riskLevel: 'High',
    dividendYield: 2.45,
    yearlyGain: 6.5,
    lastPrice: 53.20,
    color: 'hsl(var(--chart-2))'
  },
  {
    ticker: 'GBIL',
    name: 'Goldman Sachs Access Treasury 0-1 Year ETF',
    description: 'Provides exposure to U.S. Treasury securities with maturities between 0-1 year.',
    assetType: 'Bonds',
    category: 'Ultrashort Bond',
    expenseRatio: 0.12,
    riskLevel: 'Low',
    dividendYield: 4.85,
    yearlyGain: 2.1,
    lastPrice: 100.05,
    color: 'hsl(var(--chart-3))'
  },
  {
    ticker: 'JPST',
    name: 'JPMorgan Ultra-Short Income ETF',
    description: 'Provides exposure to ultra-short-term investment-grade debt securities.',
    assetType: 'Bonds',
    category: 'Ultrashort Bond',
    expenseRatio: 0.18,
    riskLevel: 'Low',
    dividendYield: 4.95,
    yearlyGain: 2.3,
    lastPrice: 50.45,
    color: 'hsl(var(--chart-3))'
  },
  {
    ticker: 'VTIP',
    name: 'Vanguard Short-Term Infl-Prot Secs ETF',
    description: 'Provides exposure to short-term Treasury Inflation-Protected Securities (TIPS).',
    assetType: 'Bonds',
    category: 'Inflation-Protected Bond',
    expenseRatio: 0.05,
    riskLevel: 'Low',
    dividendYield: 3.25,
    yearlyGain: 2.8,
    lastPrice: 48.60,
    color: 'hsl(var(--chart-3))'
  },
  {
    ticker: 'MUB',
    name: 'iShares National Muni Bond ETF',
    description: 'Provides exposure to investment-grade municipal bonds from across the United States.',
    assetType: 'Bonds',
    category: 'Muni National Intermediate',
    expenseRatio: 0.07,
    riskLevel: 'Low',
    dividendYield: 2.85,
    yearlyGain: 3.9,
    lastPrice: 107.20,
    color: 'hsl(var(--chart-3))'
  },
  {
    ticker: 'TFI',
    name: 'SPDR® Nuveen Blmbg Mncpl Bd ETF',
    description: 'Tracks the Bloomberg Barclays Municipal Managed Money 1-25 Years Index.',
    assetType: 'Bonds',
    category: 'Muni National Long',
    expenseRatio: 0.23,
    riskLevel: 'Low',
    dividendYield: 2.75,
    yearlyGain: 4.2,
    lastPrice: 46.80,
    color: 'hsl(var(--chart-3))'
  },
  {
    ticker: 'AGG',
    name: 'iShares Core U.S. Aggregate Bond ETF',
    description: 'Tracks the Bloomberg Barclays U.S. Aggregate Bond Index, providing broad bond market exposure.',
    assetType: 'Bonds',
    category: 'Intermediate Core Bond',
    expenseRatio: 0.04,
    riskLevel: 'Low',
    dividendYield: 3.15,
    yearlyGain: 4.0,
    lastPrice: 99.15,
    color: 'hsl(var(--chart-3))'
  },
  {
    ticker: 'BNDX',
    name: 'Vanguard Total International Bond ETF',
    description: 'Provides exposure to investment-grade bonds from developed and emerging markets outside the U.S.',
    assetType: 'Bonds',
    category: 'Global Bond-USD Hedged',
    expenseRatio: 0.08,
    riskLevel: 'Low',
    dividendYield: 2.95,
    yearlyGain: 3.2,
    lastPrice: 49.25,
    color: 'hsl(var(--chart-3))'
  },
  {
    ticker: 'EMB',
    name: 'iShares JP Morgan USD Em Mkts Bd ETF',
    description: 'Provides exposure to U.S. dollar-denominated emerging market sovereign and corporate bonds.',
    assetType: 'Bonds',
    category: 'Emerging Markets Bond',
    expenseRatio: 0.39,
    riskLevel: 'Moderate',
    dividendYield: 4.85,
    yearlyGain: 5.8,
    lastPrice: 89.60,
    color: 'hsl(var(--chart-3))'
  },
  {
    ticker: 'VWOB',
    name: 'Vanguard Emerging Mkts Govt Bd ETF',
    description: 'Provides exposure to emerging market government bonds denominated in local currencies.',
    assetType: 'Bonds',
    category: 'Emerging Markets Bond',
    expenseRatio: 0.25,
    riskLevel: 'Moderate',
    dividendYield: 5.15,
    yearlyGain: 4.9,
    lastPrice: 63.40,
    color: 'hsl(var(--chart-3))'
  }
];

export default function ETFCatalog() {
  const { toast } = useToast();
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  
  // UI state - with localStorage persistence
  const [filtersCollapsed, setFiltersCollapsed] = useState(() => {
    const saved = localStorage.getItem('etf-catalog-filters-collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  
  // Favorites state - with localStorage persistence
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('etf-catalog-favorites');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // Comparison state
  const [selectedForComparison, setSelectedForComparison] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState(false);
  
  // Detailed view state
  const [detailedViewETF, setDetailedViewETF] = useState<ETF | null>(null);
  
  // Mobile filter sheet state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  // Persist filters collapsed state
  useEffect(() => {
    localStorage.setItem('etf-catalog-filters-collapsed', JSON.stringify(filtersCollapsed));
  }, [filtersCollapsed]);
  
  // Persist favorites
  useEffect(() => {
    localStorage.setItem('etf-catalog-favorites', JSON.stringify([...favorites]));
  }, [favorites]);

  const filteredETFs = useMemo(() => {
    let filtered = ETF_DATA.filter(etf => {
      const matchesSearch = etf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           etf.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           etf.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAssetType = assetTypeFilter === 'all' || etf.assetType === assetTypeFilter;
      const matchesRisk = riskFilter === 'all' || etf.riskLevel === riskFilter;
      const matchesFavorites = !showFavoritesOnly || favorites.has(etf.ticker);

      return matchesSearch && matchesAssetType && matchesRisk && matchesFavorites;
    });

    // Sort ETFs
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'ticker':
          return a.ticker.localeCompare(b.ticker);
        case 'expenseRatio':
          return a.expenseRatio - b.expenseRatio;
        case 'dividendYield':
          return (b.dividendYield || 0) - (a.dividendYield || 0);
        case 'yearlyGain':
          return (b.yearlyGain || 0) - (a.yearlyGain || 0);
        case 'lastPrice':
          return (a.lastPrice || 0) - (b.lastPrice || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchTerm, assetTypeFilter, riskFilter, sortBy, showFavoritesOnly, favorites]);

  const assetTypes = Array.from(new Set(ETF_DATA.map(etf => etf.assetType)));
  const riskLevels = Array.from(new Set(ETF_DATA.map(etf => etf.riskLevel)));

  const clearFilters = () => {
    setSearchTerm('');
    setAssetTypeFilter('all');
    setRiskFilter('all');
    setSortBy('name');
    setShowFavoritesOnly(false);
  };
  
  const toggleFavorite = (ticker: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(ticker)) {
        newFavorites.delete(ticker);
        toast({
          title: "Removed from favorites",
          description: `${ticker} has been removed from your watchlist.`,
        });
      } else {
        newFavorites.add(ticker);
        toast({
          title: "Added to favorites",
          description: `${ticker} has been added to your watchlist.`,
        });
      }
      return newFavorites;
    });
  };
  
  const toggleComparison = (ticker: string) => {
    setSelectedForComparison(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(ticker)) {
        newSelection.delete(ticker);
      } else {
        if (newSelection.size >= 4) {
          toast({
            title: "Maximum reached",
            description: "You can compare up to 4 ETFs at a time.",
            variant: "destructive",
          });
          return prev;
        }
        newSelection.add(ticker);
      }
      return newSelection;
    });
  };
  
  const activeFiltersCount = [
    searchTerm !== '',
    assetTypeFilter !== 'all',
    riskFilter !== 'all',
    sortBy !== 'name',
    showFavoritesOnly
  ].filter(Boolean).length;

  const FilterContent = () => (
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
            className="pl-10 bg-muted/30"
          />
        </div>
      </div>

      {/* Filter Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" />
          Filter by
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Asset Type Filter */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Asset Type</label>
            <Select value={assetTypeFilter} onValueChange={setAssetTypeFilter}>
              <SelectTrigger className="bg-muted/30">
                <SelectValue placeholder="All Asset Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Asset Types</SelectItem>
                {assetTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Risk Level Filter */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Risk Level</label>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="bg-muted/30">
                <SelectValue placeholder="All Risk Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                {riskLevels.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
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
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Order</label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="bg-muted/30">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="ticker">Ticker</SelectItem>
              <SelectItem value="expenseRatio">Expense Ratio (Low to High)</SelectItem>
              <SelectItem value="dividendYield">Dividend Yield (High to Low)</SelectItem>
              <SelectItem value="yearlyGain">Annual Return (High to Low)</SelectItem>
              <SelectItem value="lastPrice">Price (Low to High)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Clear Filters Button */}
      <div className="flex justify-end pt-2">
        <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
          <X className="h-4 w-4" />
          Clear Filters
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl pb-24">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold mb-2">ETF Catalog</h1>
            <p className="text-muted-foreground">
              Explore our comprehensive collection of ETFs with detailed information and filtering options
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
              <Badge variant="secondary" className="ml-1">{favorites.size}</Badge>
            </Button>
          )}
        </div>
      </div>

      {/* Desktop Filters */}
      <Card className="mb-6 hidden md:block transition-all duration-300">
        <CardHeader 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setFiltersCollapsed(!filtersCollapsed)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount} active
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm">
              {filtersCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </Button>
          </div>
        </CardHeader>
        
        <div 
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            maxHeight: filtersCollapsed ? '0px' : '1000px',
            opacity: filtersCollapsed ? 0 : 1,
          }}
        >
          <CardContent className="pt-6">
            <FilterContent />
          </CardContent>
        </div>
      </Card>

      {/* Mobile Filters Button */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetTrigger asChild>
          <Button className="md:hidden mb-6 w-full flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters & Search
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
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
          <div className="mt-6 overflow-y-auto max-h-[calc(85vh-100px)]">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredETFs.map((etf) => (
          <Card 
            key={etf.ticker} 
            className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer relative"
          >
            {/* Comparison Checkbox */}
            <div className="absolute top-4 left-4 z-10">
              <Checkbox
                checked={selectedForComparison.has(etf.ticker)}
                onCheckedChange={() => toggleComparison(etf.ticker)}
                className="bg-background"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            {/* Favorite Heart */}
            <div className="absolute top-4 right-4 z-10">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(etf.ticker);
                }}
              >
                <Heart 
                  className={`h-5 w-5 transition-all ${
                    favorites.has(etf.ticker) 
                      ? 'fill-red-500 text-red-500' 
                      : 'text-muted-foreground hover:text-red-500'
                  }`}
                />
              </Button>
            </div>
            
            <div onClick={() => setDetailedViewETF(etf)}>
              <CardHeader className="pb-3 pt-12">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: etf.color }}
                    />
                    <div>
                      <CardTitle className="text-lg">{etf.ticker}</CardTitle>
                      <CardDescription className="text-sm font-medium">
                        {etf.name}
                      </CardDescription>
                    </div>
                  </div>
                </div>
                <Badge 
                  variant={
                    etf.riskLevel === 'Low' ? 'secondary' :
                    etf.riskLevel === 'Moderate' ? 'default' : 'destructive'
                  }
                  className="mt-2 w-fit"
                >
                  {etf.riskLevel}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {etf.description}
                </p>

                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="metrics">Metrics</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium">Asset Type:</span>
                        <p className="text-muted-foreground">{etf.assetType}</p>
                      </div>
                      <div>
                        <span className="font-medium">Category:</span>
                        <p className="text-muted-foreground">{etf.category}</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="metrics" className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="font-medium">Expense:</span>
                          <p className="text-muted-foreground">{etf.expenseRatio.toFixed(2)}%</p>
                        </div>
                      </div>
                      {etf.dividendYield && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="font-medium">Dividend:</span>
                            <p className="text-muted-foreground">{etf.dividendYield}%</p>
                          </div>
                        </div>
                      )}
                      {etf.yearlyGain && (
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="font-medium">Return:</span>
                            <p className="text-muted-foreground">{etf.yearlyGain}%</p>
                          </div>
                        </div>
                      )}
                      {etf.lastPrice && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="font-medium">Price:</span>
                            <p className="text-muted-foreground">${etf.lastPrice.toFixed(2)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
                
                <Button variant="outline" size="sm" className="w-full mt-4 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  View Details
                </Button>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>

      {filteredETFs.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No ETFs Found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search terms or filters to find ETFs that match your criteria.
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Clear All Filters
          </Button>
        </div>
      )}
      
      {/* Comparison Floating Bar */}
      {selectedForComparison.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg p-4 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="container mx-auto max-w-7xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium">
                {selectedForComparison.size} ETF{selectedForComparison.size > 1 ? 's' : ''} selected for comparison
              </p>
              <div className="flex gap-2 flex-wrap">
                {Array.from(selectedForComparison).map(ticker => (
                  <Badge key={ticker} variant="secondary" className="flex items-center gap-1">
                    {ticker}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => toggleComparison(ticker)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedForComparison(new Set())}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => setShowComparison(true)}
                disabled={selectedForComparison.size < 2}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Compare
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Detailed ETF View Modal */}
      <DetailedETFView
        etf={detailedViewETF}
        isOpen={!!detailedViewETF}
        onClose={() => setDetailedViewETF(null)}
        isFavorite={detailedViewETF ? favorites.has(detailedViewETF.ticker) : false}
        onToggleFavorite={toggleFavorite}
        onAddToComparison={toggleComparison}
        isInComparison={detailedViewETF ? selectedForComparison.has(detailedViewETF.ticker) : false}
      />
      
      {/* Comparison Modal */}
      <ETFComparison
        etfs={ETF_DATA.filter(etf => selectedForComparison.has(etf.ticker))}
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
        onRemoveETF={toggleComparison}
      />
    </div>
  );
}
