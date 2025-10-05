import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, TrendingUp, TrendingDown, DollarSign, BarChart3, Filter, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ETF {
  ticker: string;
  name: string;
  description: string;
  assetType: string;
  category: string;
  expenseRatio: number;
  riskLevel: 'Low' | 'Moderate' | 'High';
  dividendYield?: number;
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
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchTerm, assetTypeFilter, riskFilter, sortBy]);

  const assetTypes = [...new Set(ETF_DATA.map(etf => etf.assetType))];
  const riskLevels = [...new Set(ETF_DATA.map(etf => etf.riskLevel))];

  const clearFilters = () => {
    setSearchTerm('');
    setAssetTypeFilter('all');
    setRiskFilter('all');
    setSortBy('name');
  };

  return (
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
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ETFs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Asset Type Filter */}
            <Select value={assetTypeFilter} onValueChange={setAssetTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Asset Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Asset Types</SelectItem>
                {assetTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Risk Level Filter */}
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                {riskLevels.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="ticker">Ticker</SelectItem>
                <SelectItem value="expenseRatio">Expense Ratio (Low to High)</SelectItem>
                <SelectItem value="dividendYield">Dividend Yield (High to Low)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
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
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium">Expense Ratio:</span>
                        <p className="text-muted-foreground">{(etf.expenseRatio * 100).toFixed(2)}%</p>
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
  );
}
