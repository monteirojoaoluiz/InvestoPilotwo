/**
 * Optimized Portfolio Display Component
 * Shows the results of portfolio optimization with detailed metrics
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  DollarSign, 
  AlertCircle,
  CheckCircle,
  Globe,
  Shield
} from "lucide-react";

interface ETFDetail {
  ticker: string;
  name: string;
  weight: number;
  expectedReturn: number;
  volatility: number;
  ter: number;
}

interface OptimizedPortfolioProps {
  portfolio: {
    expectedReturn: number;
    expectedVolatility: number;
    sharpeRatio: number;
    regionExposure: {
      NL: number;
      EU_EX_NL: number;
      US: number;
      DEV_EX_US_EU: number;
      EM: number;
    };
    totalFees: number;
    constraints: {
      excludedIndustries: string[];
      volatilityCap: number;
      maxETFs: number;
      targetRegions: string[];
    };
  };
  allocations: Array<{
    ticker: string;
    name: string;
    percentage: number;
    assetType: string;
  }>;
}

const regionNames: Record<string, string> = {
  NL: "Netherlands",
  EU_EX_NL: "Europe (ex-NL)",
  US: "United States",
  DEV_EX_US_EU: "Developed (ex-US/EU)",
  EM: "Emerging Markets",
};

export default function OptimizedPortfolio({ portfolio, allocations }: OptimizedPortfolioProps) {
  const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;
  const formatBasisPoints = (value: number) => `${(value * 10000).toFixed(0)} bps`;

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Optimized Portfolio Summary
          </CardTitle>
          <CardDescription>
            Your portfolio has been optimized based on your risk profile and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Expected Return */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Expected Return (Annual)
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatPercent(portfolio.expectedReturn)}
              </div>
              <p className="text-xs text-muted-foreground">
                Projected annual return after fees
              </p>
            </div>

            {/* Expected Volatility */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingDown className="h-4 w-4" />
                Expected Risk (Annual)
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {formatPercent(portfolio.expectedVolatility)}
              </div>
              <p className="text-xs text-muted-foreground">
                Target: {formatPercent(portfolio.constraints.volatilityCap)}
              </p>
            </div>

            {/* Sharpe Ratio */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4" />
                Sharpe Ratio
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {portfolio.sharpeRatio.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Risk-adjusted return metric
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Allocations */}
      <Card>
        <CardHeader>
          <CardTitle>Fund Allocations ({allocations.length} ETFs)</CardTitle>
          <CardDescription>
            Diversified across {allocations.length} low-cost index funds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allocations.map((allocation) => (
              <div key={allocation.ticker} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{allocation.ticker}</span>
                      <Badge variant="outline" className="text-xs">
                        {allocation.assetType}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {allocation.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{allocation.percentage}%</div>
                  </div>
                </div>
                <Progress value={allocation.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Geographic Exposure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Geographic Exposure
          </CardTitle>
          <CardDescription>
            Regional diversification of your portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(portfolio.regionExposure)
              .filter(([_, exposure]) => exposure > 0.001)
              .sort((a, b) => b[1] - a[1])
              .map(([region, exposure]) => (
                <div key={region} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{regionNames[region]}</span>
                    <span className="font-semibold">{formatPercent(exposure)}</span>
                  </div>
                  <Progress value={exposure * 100} className="h-1.5" />
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Costs & Constraints */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Costs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Portfolio Costs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Weighted Average TER
                </span>
                <span className="font-semibold">{formatPercent(portfolio.totalFees)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Annual Cost (per €10,000)
                </span>
                <span className="font-semibold">
                  €{(portfolio.totalFees * 10000).toFixed(0)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Low-cost index funds keep more of your returns
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Constraints */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Portfolio Constraints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium">Risk Cap</div>
                <div className="text-sm text-muted-foreground">
                  Max {formatPercent(portfolio.constraints.volatilityCap)} annual volatility
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Simplicity</div>
                <div className="text-sm text-muted-foreground">
                  Max {portfolio.constraints.maxETFs} funds
                </div>
              </div>
              {portfolio.constraints.excludedIndustries.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-1">ESG Exclusions</div>
                  <div className="flex flex-wrap gap-1">
                    {portfolio.constraints.excludedIndustries.map((industry) => (
                      <Badge key={industry} variant="secondary" className="text-xs">
                        {industry.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disclaimer */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-yellow-900">Important Disclaimer</p>
              <p className="text-yellow-800">
                This portfolio recommendation is based on mathematical optimization and your risk
                profile. Past performance does not guarantee future results. Please consult with a
                qualified financial advisor before making investment decisions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
