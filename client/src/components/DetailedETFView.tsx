import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, TrendingUp, TrendingDown, DollarSign, BarChart3, Info } from "lucide-react";

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

interface DetailedETFViewProps {
  etf: ETF | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (ticker: string) => void;
  onAddToComparison: (ticker: string) => void;
  isInComparison: boolean;
}

export function DetailedETFView({
  etf,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
  onAddToComparison,
  isInComparison,
}: DetailedETFViewProps) {
  if (!etf) return null;

  // Mock historical data for the chart visualization
  const mockHistoricalData = [
    { month: 'Jan', value: 100 },
    { month: 'Feb', value: 105 },
    { month: 'Mar', value: 103 },
    { month: 'Apr', value: 108 },
    { month: 'May', value: 112 },
    { month: 'Jun', value: 110 },
    { month: 'Jul', value: 115 },
    { month: 'Aug', value: 113 },
    { month: 'Sep', value: 118 },
    { month: 'Oct', value: 120 },
    { month: 'Nov', value: 125 },
    { month: 'Dec', value: 100 + (etf.yearlyGain || 0) },
  ];

  const maxValue = Math.max(...mockHistoricalData.map(d => d.value));
  const minValue = Math.min(...mockHistoricalData.map(d => d.value));
  const range = maxValue - minValue;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded-full flex-shrink-0"
                style={{ backgroundColor: etf.color }}
              />
              <div>
                <DialogTitle className="text-2xl">{etf.ticker}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">{etf.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  etf.riskLevel === 'Low' ? 'secondary' :
                  etf.riskLevel === 'Moderate' ? 'default' : 'destructive'
                }
              >
                {etf.riskLevel} Risk
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant={isFavorite ? "default" : "outline"}
              onClick={() => onToggleFavorite(etf.ticker)}
              className="flex items-center gap-2"
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
              {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            </Button>
            <Button
              variant={isInComparison ? "default" : "outline"}
              onClick={() => onAddToComparison(etf.ticker)}
              className="flex items-center gap-2"
              disabled={isInComparison}
            >
              <BarChart3 className="h-4 w-4" />
              {isInComparison ? 'In Comparison' : 'Add to Compare'}
            </Button>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-2">About</h3>
            <p className="text-muted-foreground leading-relaxed">{etf.description}</p>
          </div>

          <Separator />

          {/* Key Metrics */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide">Expense Ratio</span>
                </div>
                <p className="text-2xl font-semibold">{etf.expenseRatio.toFixed(2)}%</p>
              </div>

              {etf.dividendYield && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wide">Dividend Yield</span>
                  </div>
                  <p className="text-2xl font-semibold">{etf.dividendYield.toFixed(2)}%</p>
                </div>
              )}

              {etf.yearlyGain && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wide">Annual Return</span>
                  </div>
                  <p className={`text-2xl font-semibold ${etf.yearlyGain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {etf.yearlyGain > 0 ? '+' : ''}{etf.yearlyGain.toFixed(1)}%
                  </p>
                </div>
              )}

              {etf.lastPrice && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wide">Last Price</span>
                  </div>
                  <p className="text-2xl font-semibold">${etf.lastPrice.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Performance Chart */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Performance Overview (12 Months)</h3>
            <div className="bg-muted/30 rounded-lg p-6">
              <div className="relative h-64">
                {/* Simple SVG line chart */}
                <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <line x1="0" y1="0" x2="600" y2="0" stroke="currentColor" strokeOpacity="0.1" />
                  <line x1="0" y1="50" x2="600" y2="50" stroke="currentColor" strokeOpacity="0.1" />
                  <line x1="0" y1="100" x2="600" y2="100" stroke="currentColor" strokeOpacity="0.1" />
                  <line x1="0" y1="150" x2="600" y2="150" stroke="currentColor" strokeOpacity="0.1" />
                  <line x1="0" y1="200" x2="600" y2="200" stroke="currentColor" strokeOpacity="0.1" />
                  
                  {/* Line chart */}
                  <polyline
                    fill="none"
                    stroke={etf.color}
                    strokeWidth="2"
                    points={mockHistoricalData
                      .map((d, i) => {
                        const x = (i / (mockHistoricalData.length - 1)) * 600;
                        const y = 200 - ((d.value - minValue) / range) * 200;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                  />
                  
                  {/* Area fill */}
                  <polygon
                    fill={etf.color}
                    fillOpacity="0.1"
                    points={
                      mockHistoricalData
                        .map((d, i) => {
                          const x = (i / (mockHistoricalData.length - 1)) * 600;
                          const y = 200 - ((d.value - minValue) / range) * 200;
                          return `${x},${y}`;
                        })
                        .join(' ') + ` 600,200 0,200`
                    }
                  />
                </svg>
                
                {/* X-axis labels */}
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  {mockHistoricalData.filter((_, i) => i % 3 === 0).map((d) => (
                    <span key={d.month}>{d.month}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Details */}
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="info">Additional Info</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Asset Type</label>
                  <p className="text-base mt-1">{etf.assetType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p className="text-base mt-1">{etf.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Risk Level</label>
                  <p className="text-base mt-1">{etf.riskLevel}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Ticker Symbol</label>
                  <p className="text-base mt-1">{etf.ticker}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-2">Investment Considerations</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Past performance does not guarantee future results</li>
                      <li>ETFs are subject to market fluctuation and risks</li>
                      <li>Expense ratios can impact long-term returns</li>
                      <li>Consider your investment goals and risk tolerance</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

