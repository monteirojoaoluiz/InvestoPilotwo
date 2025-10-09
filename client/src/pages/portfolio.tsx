import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  PieChart,
  Info,
} from "lucide-react";

interface Allocation {
  ticker: string;
  name: string;
  percentage: number;
  assetType: string;
}

interface Portfolio {
  id: string;
  totalValue: number;
  totalReturn: number;
  allocations: Allocation[];
  createdAt?: string;
  optimization?: {
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
}

export default function PortfolioPage() {
  const {
    data: portfolio,
    isLoading,
    error,
  } = useQuery<Portfolio>({
    queryKey: ["/api/portfolio"],
  });

  const { data: assessment } = useQuery<{ createdAt: string }>({
    queryKey: ["/api/risk-assessment"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading your portfolio...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error Loading Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Failed to load portfolio. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!portfolio || !portfolio.id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              No Portfolio Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No portfolio found. Please complete the{" "}
              <a
                href="/assessment"
                className="font-medium text-primary underline"
              >
                risk assessment
              </a>{" "}
              to generate your personalized portfolio.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalAllocated = portfolio.allocations.reduce(
    (sum, a) => sum + a.percentage,
    0,
  );

  // Group by asset type
  const assetTypeGroups = portfolio.allocations.reduce(
    (acc, allocation) => {
      const type = allocation.assetType || "Other";
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(allocation);
      return acc;
    },
    {} as Record<string, Allocation[]>,
  );

  const assetTypeDistribution = Object.entries(assetTypeGroups).map(
    ([type, allocations]) => ({
      type,
      percentage: allocations.reduce((sum, a) => sum + a.percentage, 0),
      count: allocations.length,
    }),
  );

  const formatPercent = (value: number) => `${value.toFixed(2)}%`;
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Your Portfolio</h1>
        <p className="text-muted-foreground">
          Optimized based on your risk assessment and investment preferences
        </p>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Expected Return
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portfolio.optimization
                ? formatPercent(portfolio.optimization.expectedReturn * 100)
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">Annualized</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Expected Volatility
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portfolio.optimization
                ? formatPercent(portfolio.optimization.expectedVolatility * 100)
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">Standard deviation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portfolio.optimization
                ? portfolio.optimization.sharpeRatio.toFixed(2)
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              Risk-adjusted return
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="allocations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="allocations">Asset Allocation</TabsTrigger>
          <TabsTrigger value="geographic">Geographic Exposure</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="allocations" className="space-y-4">
          {/* Asset Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Asset Type Distribution</CardTitle>
              <CardDescription>
                Breakdown of your portfolio by asset class
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {assetTypeDistribution.map((group) => (
                <div key={group.type}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">
                        {group.type}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({group.count} {group.count === 1 ? "ETF" : "ETFs"})
                      </span>
                    </div>
                    <span className="font-medium">
                      {formatPercent(group.percentage)}
                    </span>
                  </div>
                  <Progress value={group.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Individual Holdings */}
          <Card>
            <CardHeader>
              <CardTitle>Holdings</CardTitle>
              <CardDescription>
                Individual ETF allocations in your portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {portfolio.allocations
                  .sort((a, b) => b.percentage - a.percentage)
                  .map((allocation) => (
                    <div key={allocation.ticker} className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-semibold">
                              {allocation.ticker}
                            </span>
                            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize text-secondary-foreground">
                              {allocation.assetType}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {allocation.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            {formatPercent(allocation.percentage)}
                          </div>
                        </div>
                      </div>
                      <Progress value={allocation.percentage} className="h-2" />
                    </div>
                  ))}
              </div>

              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between font-semibold">
                  <span>Total Allocation</span>
                  <span>{formatPercent(totalAllocated)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-4">
          {portfolio.optimization && (
            <Card>
              <CardHeader>
                <CardTitle>Geographic Exposure</CardTitle>
                <CardDescription>
                  Regional distribution of your investments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(portfolio.optimization.regionExposure).map(
                  ([region, percentage]) => {
                    const regionNames: Record<string, string> = {
                      NL: "Netherlands",
                      EU_EX_NL: "Europe (ex. NL)",
                      US: "United States",
                      DEV_EX_US_EU: "Developed (ex. US/EU)",
                      EM: "Emerging Markets",
                    };

                    if (percentage < 0.01) return null; // Skip regions with <1%

                    return (
                      <div key={region}>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-medium">
                            {regionNames[region] || region}
                          </span>
                          <span className="font-medium">
                            {formatPercent(percentage * 100)}
                          </span>
                        </div>
                        <Progress value={percentage * 100} className="h-2" />
                      </div>
                    );
                  },
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {portfolio.optimization && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Metrics</CardTitle>
                  <CardDescription>
                    Key performance indicators and risk metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">
                        Expected Annual Return
                      </div>
                      <div className="text-2xl font-bold">
                        {formatPercent(
                          portfolio.optimization.expectedReturn * 100,
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">
                        Expected Volatility
                      </div>
                      <div className="text-2xl font-bold">
                        {formatPercent(
                          portfolio.optimization.expectedVolatility * 100,
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">
                        Sharpe Ratio
                      </div>
                      <div className="text-2xl font-bold">
                        {portfolio.optimization.sharpeRatio.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">
                        Total Fees (TER)
                      </div>
                      <div className="text-2xl font-bold">
                        {formatPercent(portfolio.optimization.totalFees * 100)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Constraints & Preferences</CardTitle>
                  <CardDescription>
                    Your portfolio is optimized based on the preferences you
                    specified in your{" "}
                    <a
                      href="/assessment"
                      className="font-medium text-primary underline hover:text-primary/80"
                    >
                      investment profile
                    </a>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="mb-4 text-sm text-muted-foreground">
                    These constraints ensure your portfolio aligns with your
                    risk tolerance, values, and investment goals while
                    maximizing returns within your comfort zone.
                  </div>

                  <div className="space-y-4">
                    <div className="border-l-2 border-primary pl-4">
                      <div className="mb-1 text-sm font-medium">
                        Volatility Cap
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Maximum portfolio volatility set to{" "}
                        {formatPercent(
                          portfolio.optimization.constraints.volatilityCap *
                            100,
                        )}{" "}
                        to match your risk tolerance level.
                      </div>
                    </div>

                    <div className="border-l-2 border-primary pl-4">
                      <div className="mb-1 text-sm font-medium">
                        Portfolio Complexity
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Limited to {portfolio.optimization.constraints.maxETFs}{" "}
                        ETFs for simplified management and tracking.
                      </div>
                    </div>

                    {portfolio.optimization.constraints.targetRegions.length >
                      0 && (
                      <div className="border-l-2 border-primary pl-4">
                        <div className="mb-1 text-sm font-medium">
                          Geographic Focus
                        </div>
                        <div className="mb-2 text-sm text-muted-foreground">
                          Prioritizing{" "}
                          {portfolio.optimization.constraints.targetRegions.join(
                            ", ",
                          )}{" "}
                          markets based on your preferences.
                        </div>
                      </div>
                    )}

                    {portfolio.optimization.constraints.excludedIndustries
                      .length > 0 && (
                      <div className="border-l-2 border-primary pl-4">
                        <div className="mb-2 text-sm font-medium">
                          Ethical Exclusions
                        </div>
                        <div className="mb-2 text-sm text-muted-foreground">
                          Your portfolio excludes companies in these industries
                          to align with your values:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {portfolio.optimization.constraints.excludedIndustries.map(
                            (industry) => (
                              <span
                                key={industry}
                                className="rounded-full bg-secondary px-3 py-1 text-sm capitalize text-secondary-foreground"
                              >
                                {industry.replace(/_/g, " ")}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 border-t pt-4">
                    <p className="text-xs text-muted-foreground">
                      Want to adjust these preferences? Complete a{" "}
                      <a
                        href="/assessment"
                        className="font-medium text-primary underline hover:text-primary/80"
                      >
                        new risk assessment
                      </a>{" "}
                      to regenerate your portfolio with updated constraints.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {portfolio.createdAt && (
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Generated: {new Date(portfolio.createdAt).toLocaleString()}
                </div>
                {assessment && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Based on risk assessment completed:{" "}
                    {new Date(assessment.createdAt).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
