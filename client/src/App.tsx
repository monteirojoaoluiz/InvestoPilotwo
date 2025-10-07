import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Switch, Route, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query"; // Add useQuery
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button"; // Add Button import
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { TrendingUp, Clock, Heart, MapPin, Target, LogOut, Download, Trash2 } from "lucide-react";
import stack16Logo from "@assets/generated_images/White Favicon.png";

// Hooks
import { useAuth } from "./hooks/useAuth";
import { apiRequest } from "./lib/queryClient";

// Components
import { ThemeProvider } from "./components/ThemeProvider";
import { ThemeToggle } from "./components/ThemeToggle";
import Header from "./components/Header";
import LandingPage from "./components/LandingPage";
import AppSidebar from "./components/AppSidebar";
import RiskAssessment from "./components/RiskAssessment";
import PortfolioChat from "./components/PortfolioChat";
import NotFound from "@/pages/not-found";
import ETFCatalog from "./pages/etf-catalog";
import AuthModal from "./components/AuthModal";
import ErrorBoundary from "./components/ErrorBoundary";
import ResetPassword from "./pages/reset-password";

function Dashboard() {
  const [location] = useLocation();

  // Force scroll to top and prevent any scrolling behavior
  useEffect(() => {
    // Disable scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    // Multiple scroll attempts with increasing delays
    const scrollToTop = () => window.scrollTo(0, 0);

    scrollToTop(); // Immediate

    const timeouts = [
      setTimeout(scrollToTop, 0),
      setTimeout(scrollToTop, 50),
      setTimeout(scrollToTop, 100),
      setTimeout(scrollToTop, 200),
      setTimeout(scrollToTop, 500),
    ];

    // Keep scrolling to top for a short period to override any late scroll attempts
    const interval = setInterval(scrollToTop, 100);

    // Clean up after 1 second
    const cleanup = setTimeout(() => {
      clearInterval(interval);
      // Re-enable scroll restoration
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'auto';
      }
    }, 1000);

    return () => {
      timeouts.forEach(clearTimeout);
      clearInterval(interval);
      clearTimeout(cleanup);
      // Re-enable scroll restoration
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'auto';
      }
    };
  }, [location]);

  const { data: portfolioData, refetch: refetchPortfolio } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/portfolio');
      if (!res.ok) throw new Error('Failed to fetch portfolio');
      return res.json();
    },
  });

  const { data: assessmentData, refetch: refetchAssessment } = useQuery({
    queryKey: ['assessment'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/risk-assessment');
      if (!res.ok) throw new Error('Failed to fetch assessment');
      return res.json();
    },
  });

  // Portfolio performance query for 3-year metrics
  const portfolioId = portfolioData?.id;
  const { data: combined } = useQuery<{ points: { date: string; value: number }[]; warning?: string } | null>({
    queryKey: ['portfolio-performance', portfolioId || 'default'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/portfolio/performance`);
      if (!res.ok) throw new Error('Failed to fetch portfolio performance');
      return res.json();
    },
    enabled: !!portfolioData, // Only fetch when portfolio exists
  });

  // Compute 3-year metrics from combined performance series
  const metrics = useMemo(() => {
    try {
      const pts = combined?.points || [];
      // If we have a warning or no data, don't compute metrics
      if (combined?.warning || !pts || pts.length < 2) return null;

      const firstVal = pts[0]?.value;
      const lastVal = pts[pts.length - 1]?.value;

      if (typeof firstVal !== 'number' || typeof lastVal !== 'number' || firstVal <= 0) {
        return null;
      }

      const totalGainPct = ((lastVal / firstVal) - 1) * 100;

      // Daily simple returns
      const dailyReturns: number[] = [];
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1]?.value;
        const cur = pts[i]?.value;
        if (typeof prev === 'number' && typeof cur === 'number' && prev > 0 && cur > 0) {
          dailyReturns.push((cur / prev) - 1);
        }
      }
      const meanDaily = dailyReturns.length ? (dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length) : 0;
      const varianceDaily = dailyReturns.length > 1
        ? dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanDaily, 2), 0) / (dailyReturns.length - 1)
        : 0;
      const stdDaily = Math.sqrt(varianceDaily);
      const annualizedReturn = meanDaily * 252;
      const annualizedVol = stdDaily * Math.sqrt(252);
      const sharpe = annualizedVol > 0 ? (annualizedReturn / annualizedVol) : 0;

      // Gains per calendar year (for last up to 3 years in series)
      const yearMap = new Map<number, { first?: number; last?: number }>();
      for (const p of pts) {
        if (!p?.date || typeof p.value !== 'number') continue;
        try {
          const y = new Date(p.date).getFullYear();
          const entry = yearMap.get(y) || {};
          if (entry.first == null) entry.first = p.value;
          entry.last = p.value;
          yearMap.set(y, entry);
        } catch (dateError) {
          // Skip invalid dates
          continue;
        }
      }
      const years = Array.from(yearMap.keys()).sort((a, b) => a - b);
      const lastThreeYears = years.slice(-3);
      const gainsPerYear = lastThreeYears.map((y) => {
        const e = yearMap.get(y);
        const gain = (e?.first && e?.last && e.first > 0) ? ((e.last / e.first) - 1) * 100 : 0;
        return { year: y, gainPct: gain };
      });

      // Calculate yearly average gain
      const yearlyAvgGain = gainsPerYear.length > 0
        ? gainsPerYear.reduce((sum, g) => sum + g.gainPct, 0) / gainsPerYear.length
        : 0;

      return {
        totalGainPct,
        annualizedVolPct: annualizedVol * 100,
        sharpe,
        gainsPerYear,
        yearlyAvgGain,
      };
    } catch (error) {
      console.error('Error calculating metrics:', error);
      return null;
    }
  }, [combined?.points]);

  const { toast } = useToast();
  const [, navigate] = useLocation(); // Add useLocation
   
  const handleGeneratePortfolio = async () => {
    try {
      const res = await apiRequest('POST', '/api/portfolio/generate');
      if (!res.ok) {
        throw new Error(`Failed to generate: ${res.statusText}`);
      }
      const newPortfolio = await res.json();
      if (!newPortfolio) {
        throw new Error('Invalid portfolio data received');
      }
      await refetchPortfolio();
      toast({
        title: "Portfolio Generated!",
        description: "Your recommendations are now available.",
      });
    } catch (error) {
      console.error('Portfolio generation error:', error);
      toast({
        title: "Failed to Generate",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const totalValue = portfolioData?.totalValue || 0; // kept for internal logic if needed
  const totalReturn = portfolioData ? (portfolioData.totalReturn / 100) : 0; // kept for internal logic if needed
  const riskScore = assessmentData?.riskTolerance
    ? assessmentData.riskTolerance.charAt(0).toUpperCase() + assessmentData.riskTolerance.slice(1)
    : 'Not Assessed';

  const hasAssessmentButNoPortfolio = assessmentData && !portfolioData;

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState('');

  const { data: etfInfo } = useQuery({
    queryKey: ['etf-info', selectedTicker],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', `/api/etf/${selectedTicker}/info`);
        if (!res.ok) throw new Error('Failed to fetch ETF info');
        return res.json();
      } catch (error) {
        console.error('Error fetching ETF info:', error);
        throw error;
      }
    },
    enabled: !!selectedTicker,
  });

  return (
    <div className="p-4 sm:p-6 w-full min-w-0 max-w-full overflow-x-hidden">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 break-words">Stack16 Dashboard</h1>
      {hasAssessmentButNoPortfolio && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 mb-2">Your investor profile is complete, but no portfolio has been generated yet.</p>
          <Button onClick={handleGeneratePortfolio} className="mr-2">
            Generate Portfolio Now
          </Button>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            View Dashboard
          </Button>
        </div>
      )}
      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-full min-w-0">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl lg:text-2xl">
              <Target className="h-5 w-5 text-primary" />
              Investor Profile
            </CardTitle>
            <CardDescription>Your investment preferences and profile</CardDescription>
          </CardHeader>
          <CardContent>
            {assessmentData ? (
              <div className="grid gap-4">
                <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-orange-700 dark:text-orange-300 uppercase tracking-wide">Risk Tolerance</div>
                    <div className="text-sm font-semibold text-orange-900 dark:text-orange-100">{riskScore}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">Investment Timeline</div>
                    <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">{assessmentData.timeHorizon?.replace(/-/g, ' ')?.replace(/\b\w/g, (l: string) => l.toUpperCase()) || '—'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <Heart className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wide">Career Stage</div>
                    <div className="text-sm font-semibold text-purple-900 dark:text-purple-100">{assessmentData.lifeStage?.replace(/-/g, ' ')?.replace(/\b\w/g, (l: string) => l.toUpperCase()) || '—'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <MapPin className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wide">Investment Regions</div>
                    <div className="text-sm font-semibold text-green-900 dark:text-green-100">
                      {Array.isArray(assessmentData.geographicFocus)
                        ? assessmentData.geographicFocus
                            .map((focus: string) =>
                              focus.replace(/-/g, ' ')
                                   .replace(/\b\w/g, l => l.toUpperCase())
                                   .replace(/ex us/g, 'ex-US')
                                   .replace(/ex nl/g, 'ex-NL')
                                   .replace(/europe ex nl/g, 'Europe ex-NL')
                                   .replace(/developed ex us europe/g, 'Developed ex-US & ex-Europe')
                            )
                            .join(', ')
                        : assessmentData.geographicFocus?.replace(/-/g, ' ')?.replace(/\b\w/g, (l: string) => l.toUpperCase()) || '—'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Sustainability Focus</div>
                    <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                      {Array.isArray(assessmentData.esgExclusions) && assessmentData.esgExclusions.includes('non-esg-funds') ? 'ESG Focused' : 
                       Array.isArray(assessmentData.esgExclusions) && assessmentData.esgExclusions.length > 0 ? `${assessmentData.esgExclusions.length} Exclusions` : 
                       'No Exclusions'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-orange-700 dark:text-orange-300 uppercase tracking-wide">Investment Objective</div>
                    <div className="text-sm font-semibold text-orange-900 dark:text-orange-100">{assessmentData.dividendVsGrowth?.replace(/-/g, ' ')?.replace(/\b\w/g, (l: string) => l.toUpperCase()) || '—'}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">No investor profile found</p>
                <p className="text-sm text-muted-foreground">Complete your risk assessment to build your personalized profile</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl lg:text-2xl">Recommended Portfolio</CardTitle>
            <CardDescription>Your personalized investment allocations</CardDescription>
          </CardHeader>
          <CardContent>
            {portfolioData ? (
              <div className="flex flex-col items-center gap-6">
                {/* Donut Chart */}
                <div className="flex-shrink-0 w-full max-w-[220px] sm:max-w-[200px] mx-auto">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={(portfolioData.allocations || [])?.map((a: any) => ({
                          name: a?.ticker || a?.name || 'Unknown',
                          value: typeof a?.percentage === 'number' ? a.percentage : 0,
                          color: a?.color || '#8884d8'
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {(portfolioData.allocations || [])?.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry?.color || '#8884d8'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${value}%`, 'Allocation']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Allocation List */}
                <div className="w-full space-y-3">
                  {(portfolioData.allocations || [])?.map((a: any, index: number) => (
                    <div
                      key={`${a?.ticker || a?.name || `allocation-${index}`}`}
                      className="flex items-center justify-between py-2 cursor-pointer hover:bg-muted/50 rounded"
                      onClick={() => {
                        if (a?.ticker) {
                          setSelectedTicker(a.ticker);
                          setModalOpen(true);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: a?.color || '#8884d8' }}
                        />
                        <div>
                          <div className="font-semibold text-sm">{a?.ticker || a?.name || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">{a?.assetType || 'ETF'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm">{typeof a?.percentage === 'number' ? a.percentage : 0}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-2">No portfolio recommendations yet</div>
                <p className="text-sm text-muted-foreground">Complete your risk assessment to get personalized allocations</p>
              </div>
            )}
          </CardContent>
        </Card>

        {portfolioData && metrics ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl lg:text-2xl">3-Year Performance</CardTitle>
              <CardDescription>Historical portfolio metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Total Return</div>
                    <div className={`text-2xl font-bold ${metrics.totalGainPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics.totalGainPct >= 0 ? '+' : ''}{metrics.totalGainPct.toFixed(1)}%
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Avg Annual</div>
                    <div className={`text-2xl font-bold ${metrics.yearlyAvgGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics.yearlyAvgGain >= 0 ? '+' : ''}{metrics.yearlyAvgGain.toFixed(1)}%
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Volatility</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {metrics.annualizedVolPct.toFixed(1)}%
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Sharpe Ratio</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {metrics.sharpe.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Annual Performance Timeline */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">Annual Performance</h4>
                  <div className="space-y-4">
                    {metrics.gainsPerYear.map((g) => (
                      <div key={g.year} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12 text-center">{g.year}</div>
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 relative overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${g.gainPct >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{
                                width: `${Math.min(Math.abs(g.gainPct) * 3, 100)}%`,
                                marginLeft: g.gainPct < 0 ? `${100 - Math.min(Math.abs(g.gainPct) * 3, 100)}%` : '0%'
                              }}
                            />
                          </div>
                        </div>
                        <div className={`text-sm font-bold w-16 text-right ${g.gainPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {g.gainPct >= 0 ? '+' : ''}{g.gainPct.toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Performance</CardTitle>
              <CardDescription>Performance metrics will appear here</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">Complete your portfolio to see performance metrics</p>
            </CardContent>
          </Card>
        )}
      </div>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{selectedTicker} Details</DialogTitle>
          </DialogHeader>
          {etfInfo ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Fund Name</h3>
                <p>{etfInfo?.longName || selectedTicker}</p>
              </div>
              <div>
                <h3 className="font-semibold">Category</h3>
                <p>{etfInfo?.category || 'N/A'}</p>
              </div>
              {etfInfo?.summaryProfile?.longBusinessSummary && (
                <div>
                  <h3 className="font-semibold">Description</h3>
                  <p className="text-sm">{etfInfo.summaryProfile.longBusinessSummary}</p>
                </div>
              )}
              <div>
                <h3 className="font-semibold">Expense Ratio</h3>
                <p>
                  {etfInfo?.summaryDetail?.annualReportExpenseRatio
                    ? `${(etfInfo.summaryDetail.annualReportExpenseRatio * 100).toFixed(2)}%`
                    : 'N/A (not available via current API)'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Top 10 Holdings</h3>
                <p className="text-sm text-muted-foreground italic">
                  Detailed holdings data not available via current API. Please refer to the ETF provider's website for complete holdings information.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p>Loading ETF details...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Performance Chart and Chat - Only show if portfolio exists */}
      {portfolioData && (
        <div className="mt-6 space-y-6">
          {/* Performance History Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Performance (3Y, Daily)</CardTitle>
              <CardDescription>
                Normalized index (100 = start)
                {combined?.warning && (
                  <div className="mt-2 text-amber-600 dark:text-amber-400 text-sm">
                    ⚠️ {combined.warning}
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={combined?.points || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey={'date'}
                      tickFormatter={(dateStr) => {
                        try {
                          if (!dateStr) return '';
                          const date = new Date(dateStr);
                          if (isNaN(date.getTime())) return '';
                          return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`;
                        } catch {
                          return '';
                        }
                      }}
                      interval="preserveStartEnd"
                      minTickGap={80}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      className="text-xs"
                    />
                    <YAxis domain={['auto', 'auto']} />
                    <Tooltip
                      labelFormatter={(dateStr) => {
                        try {
                          if (!dateStr) return '';
                          const date = new Date(dateStr);
                          if (isNaN(date.getTime())) return '';
                          return date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          });
                        } catch {
                          return '';
                        }
                      }}
                    />
                    <Line type="monotone" dataKey={'value'} stroke="#8884d8" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Chat */}
          <PortfolioChat portfolio={portfolioData} />
        </div>
      )}

      {portfolioData === null && !hasAssessmentButNoPortfolio && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">No portfolio available. Start by completing your investor profile.</p>
          <Button variant="outline" onClick={() => navigate('/assessment')} className="mt-2">
            Build Profile
          </Button>
        </div>
      )}
    </div>
  );
}


function Assessment() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const handleAssessmentComplete = async () => {
    try {
      // Generate portfolio based on assessment
      const res = await apiRequest('POST', '/api/portfolio/generate');
      if (!res.ok) {
        throw new Error(`Failed to generate portfolio: ${res.statusText}`);
      }
      const portfolio = await res.json();

      if (!portfolio) {
        throw new Error('Invalid portfolio data received from server');
      }

      // Normalise allocations so the dashboard can render immediately
      const normalizedPortfolio = {
        ...portfolio,
        allocations: Array.isArray(portfolio.allocations)
          ? portfolio.allocations
          : typeof portfolio.allocations === 'string'
            ? JSON.parse(portfolio.allocations)
            : [],
      };

      queryClient.setQueryData(['portfolio'], normalizedPortfolio);
      await queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      // Navigate to dashboard
      navigate('/dashboard');

      toast({
        title: "Portfolio Generated!",
        description: "Your personalized investment recommendations are ready.",
      });
    } catch (error) {
      console.error('Failed to generate portfolio:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Please try again or contact support.",
        variant: "destructive",
      });
      // Still navigate to dashboard even if portfolio generation fails
      navigate('/dashboard');
    }
  };

  return (
    <div className="p-6 w-full min-w-0 max-w-full overflow-x-hidden">
      <RiskAssessment 
        onComplete={handleAssessmentComplete}
      />
    </div>
  );
}

// Remove Chat function and route

function ETFCatalogPage() {
  const [location] = useLocation();
  const [isCompactSidebar, setIsCompactSidebar] = useState(true); // Assume mobile by default

  useEffect(() => {
    const updateCompactState = () => {
      try {
        if (typeof window === 'undefined') return;
        const width = window.innerWidth;
        // Force sidebar closed on mobile (< 768px) and tablet (768-1024px)
        const shouldBeCompact = width < 1024;
        console.log('Screen width:', width, 'Compact sidebar:', shouldBeCompact, 'User agent:', navigator.userAgent);
        setIsCompactSidebar(shouldBeCompact);
      } catch (error) {
        console.error('Error updating compact sidebar state:', error);
      }
    };

    updateCompactState();
    window.addEventListener('resize', updateCompactState);
    return () => window.removeEventListener('resize', updateCompactState);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="flex flex-col flex-1 min-w-0 max-w-full overflow-x-hidden">
        <main className="flex-1 overflow-auto w-full max-w-full min-h-0">
          <ErrorBoundary>
            <ETFCatalog />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

  function Account() {
    const [location, navigate] = useLocation(); // for path
    const { toast } = useToast();

    const { data: user } = useQuery({
      queryKey: ['user'],
      queryFn: async () => {
        const res = await apiRequest('GET', '/api/auth/user');
        if (!res.ok) throw new Error('Failed to fetch user');
        return res.json();
      },
    });

    const { data: assessment } = useQuery({
      queryKey: ['assessment'],
      queryFn: async () => {
        const res = await apiRequest('GET', '/api/risk-assessment');
        if (!res.ok) throw new Error('Failed to fetch assessment');
        return res.json();
      },
    });

    const formattedDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—';
    const risk = assessment?.riskTolerance
      ? assessment.riskTolerance.charAt(0).toUpperCase() + assessment.riskTolerance.slice(1)
      : 'Not set';

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    const [changePasswordOpen, setChangePasswordOpen] = useState(false);
    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');

    const [changeEmailOpen, setChangeEmailOpen] = useState(false);
    const [newEmail, setNewEmail] = useState('');

    const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');

    const [downloadDataLoading, setDownloadDataLoading] = useState(false);

    useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get('success');
      const error = urlParams.get('error');

      if (success === 'email_changed') {
        toast({
          title: "Success",
          description: "Your email has been updated successfully.",
        });
      } else if (error) {
        let message = "An error occurred.";
        if (error === 'invalid_token') message = "Invalid or expired verification link.";
        else if (error === 'no_token') message = "No verification token provided.";
        else if (error === 'server_error') message = "Server error. Please try again.";

        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      }

      // Clear params
      if (success || error) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }, []);

    const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newPass !== confirmPass) {
        toast({
          title: "Error",
          description: "New passwords do not match",
          variant: "destructive",
        });
        return;
      }
      if (!passwordRegex.test(newPass)) {
        toast({
          title: "Weak Password",
          description: "New password must contain uppercase, lowercase, number, and special character",
          variant: "destructive",
        });
        return;
      }
      try {
        const response = await apiRequest('POST', '/api/auth/change-password', { currentPassword: currentPass, newPassword: newPass, confirmPassword: confirmPass });
        toast({
          title: "Success",
          description: "Password changed successfully",
        });
        setChangePasswordOpen(false);
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to change password",
          variant: "destructive",
        });
      }
    };

    const handleChangeEmail = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const response = await apiRequest('POST', '/api/auth/change-email', { newEmail });
        const data = await response.json();
        toast({
          title: "Email Change Requested",
          description: data.message || "Please check your new email for verification.",
        });
        setChangeEmailOpen(false);
        setNewEmail('');
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to request email change",
          variant: "destructive",
        });
      }
    };

    const handleDeleteAccount = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await apiRequest('POST', '/api/auth/delete-account', { currentPassword: deletePassword });
        toast({
          title: "Account Deleted",
          description: "Your account and all data have been permanently deleted.",
        });
        setDeleteAccountOpen(false);
        setDeletePassword('');
        navigate('/');
        window.location.reload(); // to clear session
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to delete account",
          variant: "destructive",
        });
      }
    };

    const handleDownloadData = async () => {
      setDownloadDataLoading(true);
      try {
        const response = await apiRequest('GET', '/api/auth/download-data');
        const data = await response.json();

        // Create and download JSON file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stack16-data-${data.user.email}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: 'Data Downloaded',
          description: 'Your data has been downloaded successfully.',
        });
      } catch (error: any) {
        toast({
          title: 'Download Failed',
          description: error?.message || 'Please try again.',
          variant: 'destructive',
        });
      } finally {
        setDownloadDataLoading(false);
      }
    };

    const handleLogout = async () => {
      try {
        await apiRequest('POST', '/api/auth/logout');
        navigate('/');
        window.location.reload();
      } catch (error: any) {
        toast({
          title: 'Logout Failed',
          description: error?.message || 'Please try again.',
          variant: 'destructive',
        });
      }
    };

    return (
      <div className="p-6 w-full min-w-0 max-w-full overflow-x-hidden">
        <h1 className="text-3xl font-bold mb-6 break-words">Account</h1>
        <div className="max-w-6xl w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your account details and investment profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Email</div>
                  <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">{user?.email || '—'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex-1">
                  <div className="text-sm font-medium text-green-700 dark:text-green-300">Member Since</div>
                  <div className="text-sm font-semibold text-green-900 dark:text-green-100">{formattedDate}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex-1">
                  <div className="text-sm font-medium text-orange-700 dark:text-orange-300">Risk Tolerance</div>
                  <div className="text-sm font-semibold text-orange-900 dark:text-orange-100">{risk}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex-1">
                  <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Last Login</div>
                  <div className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                    {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Customize your account preferences</CardDescription>
              </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div>
                  <div className="font-medium">Theme</div>
                  <div className="text-sm text-muted-foreground">Choose your preferred color scheme</div>
                </div>
                <ThemeToggle />
              </div>

              <div className="border-t pt-4">
                <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full mb-2">
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input
                          id="current-password"
                          type="password"
                          value={currentPass}
                          onChange={(e) => setCurrentPass(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newPass}
                          onChange={(e) => setNewPass(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmPass}
                          onChange={(e) => setConfirmPass(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Update Password
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="border-t pt-4">
                <Dialog open={changeEmailOpen} onOpenChange={setChangeEmailOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full mb-2">
                      Change Email
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Change Email Address</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleChangeEmail} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-email">New Email Address</Label>
                        <Input
                          id="new-email"
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Send Verification
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="border-t pt-4">
                <Dialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                    >
                      Delete Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Account</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="text-destructive">
                        <p className="font-medium">Warning: This action cannot be undone.</p>
                        <p>Deleting your account will permanently remove all your data including portfolios, assessments, and chat history.</p>
                      </div>
                      <form onSubmit={handleDeleteAccount} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="delete-password">Enter your password to confirm</Label>
                          <Input
                            id="delete-password"
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            required
                          />
                        </div>
                        <Button type="submit" variant="destructive" className="w-full">
                          Permanently Delete My Account
                        </Button>
                      </form>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
              <CardHeader>
                <CardTitle>Privacy & Data</CardTitle>
                <CardDescription>Your data rights and privacy controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div>
                      <div className="font-medium">Download My Data</div>
                      <div className="text-sm text-muted-foreground">Export all your personal data in JSON format</div>
                    </div>
                    <Button
                      onClick={handleDownloadData}
                      disabled={downloadDataLoading}
                      className="flex items-center gap-2"
                    >
                      {downloadDataLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Download
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Dialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Right to be Forgotten (Delete Account)
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Account (Right to be Forgotten)</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="text-destructive">
                          <p className="font-medium">Warning: This action cannot be undone.</p>
                          <p>Deleting your account will permanently remove all your data including portfolios, assessments, and chat history.</p>
                          <p className="mt-2 text-sm">This action complies with GDPR Article 17 - Right to Erasure.</p>
                        </div>
                        <form onSubmit={handleDeleteAccount} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="delete-password">Enter your password to confirm</Label>
                            <Input
                              id="delete-password"
                              type="password"
                              value={deletePassword}
                              onChange={(e) => setDeletePassword(e.target.value)}
                              required
                            />
                          </div>
                          <Button type="submit" variant="destructive" className="w-full">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Permanently Delete My Account
                          </Button>
                        </form>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

function AuthenticatedRouter() {
  const [location, navigate] = useLocation(); // Add useLocation
  const { data: assessment, isLoading: assessmentLoading } = useQuery({ // Add useQuery for assessment
    queryKey: ['assessment'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/risk-assessment');
      if (!res.ok) throw new Error('Failed to fetch assessment');
      const data = await res.json();
      return data;
    },
  });

  useEffect(() => { // Add useEffect for redirect
    if (!assessmentLoading) {
      // Allow access to account page even without assessment
      const allowedPagesWithoutAssessment = ['/account', '/assessment'];

      if (!assessment && !allowedPagesWithoutAssessment.includes(location)) {
        // Only redirect to assessment if user doesn't have assessment and isn't on allowed pages
        navigate('/assessment', { replace: true });
      } else if (assessment && location === '/') {
        // If user has assessment and is at root, redirect to dashboard
        navigate('/dashboard', { replace: true });
      }
    }
  }, [assessmentLoading, assessment, location, navigate]);

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Start closed for mobile
  const sidebarToggledByUserRef = useRef(false);
  const [isCompactSidebar, setIsCompactSidebar] = useState(true); // Assume mobile by default

  useEffect(() => {
    const updateCompactState = () => {
      try {
        if (typeof window === 'undefined') return;
        const width = window.innerWidth;
        // Force sidebar closed on mobile (< 768px) and tablet (768-1024px)
        const shouldBeCompact = width < 1024;
        console.log('Screen width:', width, 'Compact sidebar:', shouldBeCompact, 'User agent:', navigator.userAgent);
        setIsCompactSidebar(shouldBeCompact);
      } catch (error) {
        console.error('Error updating compact sidebar state:', error);
      }
    };

    updateCompactState();
    window.addEventListener('resize', updateCompactState);
    return () => window.removeEventListener('resize', updateCompactState);
  }, []);

  useEffect(() => {
    if (isCompactSidebar) {
      sidebarToggledByUserRef.current = false;
      setIsSidebarOpen(false);
    } else if (!sidebarToggledByUserRef.current) {
      setIsSidebarOpen(true);
    }
  }, [isCompactSidebar]);

  const handleSidebarOpenChange = useCallback((open: boolean) => {
    try {
      sidebarToggledByUserRef.current = true;
      setIsSidebarOpen(open);
    } catch (error) {
      console.error('Error changing sidebar state:', error);
    }
  }, []);

  return (
    <SidebarProvider
      style={style}
      open={isSidebarOpen}
      onOpenChange={handleSidebarOpenChange}
    >
      <div className="flex min-h-screen w-full max-w-full overflow-x-hidden">
        {/* Force sidebar to be hidden on mobile/tablet */}
        <div className={`${isCompactSidebar ? 'hidden' : ''}`}>
          <AppSidebar />
        </div>
        <div className="flex flex-col flex-1 min-w-0 max-w-full overflow-x-hidden">
          <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full max-w-full">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger className={`${isCompactSidebar ? 'block' : 'md:hidden'} mr-2 flex-shrink-0`} />
              <img
                src={stack16Logo}
                alt="Stack16 Logo"
                className="w-8 h-8 rounded-lg flex-shrink-0"
              />
              <span className="font-semibold text-lg truncate">Stack16</span>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto w-full max-w-full min-h-0">
            <ErrorBoundary>
              <Switch>
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/assessment" component={Assessment} />
                <Route path="/etf-catalog" component={ETFCatalogPage} />
                <Route path="/account" component={Account} />
                <Route path="/" component={Dashboard} />
              </Switch>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  const openLoginModal = () => {
    setAuthModalTab('login');
    setIsAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    console.log('Opening register modal');
    setAuthModalTab('register');
    setIsAuthModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <AuthenticatedRouter />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSignInClick={openLoginModal} onGetStartedClick={openRegisterModal} showMenuButton={false} />
      <main className="flex-1">
        <Switch>
          <Route path="/">
            <LandingPage onGetStarted={openRegisterModal} />
          </Route>
          <Route path="/reset-password" component={ResetPassword} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          // Refresh auth state
          window.location.reload();
        }}
        defaultTab={authModalTab}
      />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="investai-ui-theme">
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;