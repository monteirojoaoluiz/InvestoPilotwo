import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, TrendingUp, TrendingDown, DollarSign, BarChart3, Filter, X, ArrowUpDown, SlidersHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";

interface ETF {
  ticker: string;
  name: string;
  description: string;
  assetType: string;
  category: string;
  expenseRatio: number;
  riskLevel: 'Low' | 'Moderate' | 'High';
  dividendYield?: number;
  yearlyGain?: number; // Annualized return since inception
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
    color: 'hsl(var(--chart-3))'
  },
  // Additional ETFs from the comprehensive list
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
    color: 'hsl(var(--chart-3))'
  }
];

export default function ETFCatalog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  const filteredETFs = useMemo(() => {
    let filtered = ETF_DATA.filter(etf => {
      const matchesSearch = etf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           etf.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           etf.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAssetType = assetTypeFilter === 'all' || etf.assetType === assetTypeFilter;
      const matchesRisk = riskFilter === 'all' || etf.riskLevel === riskFilter;

      return matchesSearch && matchesAssetType && matchesRisk;
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
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchTerm, assetTypeFilter, riskFilter, sortBy]);

  const assetTypes = Array.from(new Set(ETF_DATA.map(etf => etf.assetType)));
  const riskLevels = Array.from(new Set(ETF_DATA.map(etf => etf.riskLevel)));

  const clearFilters = () => {
    setSearchTerm('');
    setAssetTypeFilter('all');
    setRiskFilter('all');
    setSortBy('name');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col flex-1 min-w-0 max-w-full overflow-x-hidden">
        <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full max-w-full">
          <div className="flex items-center gap-2 min-w-0">
            <SidebarTrigger className="mr-2 flex-shrink-0" />
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-bold text-sm">S16</span>
            </div>
            <span className="font-semibold text-lg truncate">ETF Catalog</span>
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-auto w-full max-w-full min-h-0">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">ETF Catalog</h1>
              <p className="text-muted-foreground">
                Explore our comprehensive collection of ETFs with detailed information and filtering options
              </p>
            </div>

      {/* Filters Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
              </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>

        {/* Clear Filters */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Results Summary */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Showing {filteredETFs.length} of {ETF_DATA.length} ETFs
        </p>
      </div>

      {/* ETF Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredETFs.map((etf) => (
          <Card key={etf.ticker} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: etf.color }}
                  />
                  <div>
                    <CardTitle className="text-lg">{etf.ticker}</CardTitle>
                    <CardDescription className="text-sm font-medium">
                      {etf.name}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={
                  etf.riskLevel === 'Low' ? 'secondary' :
                  etf.riskLevel === 'Moderate' ? 'default' : 'destructive'
                }>
                  {etf.riskLevel}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium">Expense Ratio:</span>
                        <p className="text-muted-foreground">{etf.expenseRatio.toFixed(2)}%</p>
                      </div>
                    </div>
                    {etf.dividendYield && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="font-medium">Dividend Yield:</span>
                          <p className="text-muted-foreground">{etf.dividendYield}%</p>
                        </div>
                      </div>
                    )}
                    {etf.yearlyGain && (
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="font-medium">Annual Return:</span>
                          <p className="text-muted-foreground">{etf.yearlyGain}%</p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredETFs.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No ETFs Found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search terms or filters to find ETFs that match your criteria.
          </p>
          </div>
          )}
          </div>
        </main>
      </div>
    </div>
  );
}
