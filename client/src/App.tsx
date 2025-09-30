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
import { TrendingUp, Clock, Heart, MapPin, Target, LogOut } from "lucide-react";

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
import AuthModal from "./components/AuthModal";
import ErrorBoundary from "./components/ErrorBoundary";
import ResetPassword from "./pages/reset-password";

function Dashboard() {
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
  const { data: combined } = useQuery<{ points: { date: string; value: number }[] } | null>({
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
    const pts = combined?.points || [];
    if (pts.length < 2) return null;

    const firstVal = pts[0].value;
    const lastVal = pts[pts.length - 1].value;
    const totalGainPct = ((lastVal / firstVal) - 1) * 100;

    // Daily simple returns
    const dailyReturns: number[] = [];
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1].value;
      const cur = pts[i].value;
      if (prev > 0 && cur > 0) {
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
      const y = new Date(p.date).getFullYear();
      const entry = yearMap.get(y) || {};
      if (entry.first == null) entry.first = p.value;
      entry.last = p.value;
      yearMap.set(y, entry);
    }
    const years = Array.from(yearMap.keys()).sort((a, b) => a - b);
    const lastThreeYears = years.slice(-3);
    const gainsPerYear = lastThreeYears.map((y) => {
      const e = yearMap.get(y)!;
      const gain = (e.first && e.last) ? ((e.last / e.first) - 1) * 100 : 0;
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
      await refetchPortfolio();
      toast({
        title: "Portfolio Generated!",
        description: "Your recommendations are now available.",
      });
    } catch (error) {
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

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">InvestoPilot Dashboard</h1>
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
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
                    <div className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">Time Horizon</div>
                    <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">{assessmentData.timeHorizon?.replace(/-/g, ' ') || '—'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <Heart className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wide">Life Stage</div>
                    <div className="text-sm font-semibold text-purple-900 dark:text-purple-100">{assessmentData.lifeStage?.replace(/-/g, ' ') || '—'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <MapPin className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wide">Geographic Focus</div>
                    <div className="text-sm font-semibold text-green-900 dark:text-green-100">{assessmentData.usOnly ? 'US Only' : 'Global'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">ESG Preference</div>
                    <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">{assessmentData.esgOnly ? 'ESG Focused' : 'Standard'}</div>
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
            <CardTitle>Recommended Portfolio</CardTitle>
            <CardDescription>Your personalized investment allocations</CardDescription>
          </CardHeader>
          <CardContent>
            {portfolioData ? (
              <div className="flex flex-col items-center gap-6">
                {/* Donut Chart */}
                <div className="flex-shrink-0">
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie
                        data={portfolioData.allocations?.map((a: any) => ({
                          name: a.ticker || a.name,
                          value: a.percentage,
                          color: a.color
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {portfolioData.allocations?.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${value}%`, 'Allocation']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Allocation List */}
                <div className="w-full space-y-3">
                  {portfolioData.allocations?.map((a: any) => (
                    <div key={`${a.ticker || a.name}`} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: a.color || '#8884d8' }}
                        />
                        <div>
                          <div className="font-semibold text-sm">{a.ticker || a.name}</div>
                          <div className="text-xs text-muted-foreground">{a.assetType || 'ETF'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm">{a.percentage}%</div>
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
              <CardTitle>3-Year Performance</CardTitle>
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
      {/* Performance Chart and Chat - Only show if portfolio exists */}
      {portfolioData && (
        <div className="mt-6 space-y-6">
          {/* Performance History Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Performance (3Y, Daily)</CardTitle>
              <CardDescription>
                Normalized index (100 = start)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={combined?.points || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey={'date'}
                    tickFormatter={(dateStr) => {
                      const date = new Date(dateStr);
                      return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`;
                    }}
                    interval="preserveStartEnd"
                    minTickGap={50}
                  />
                  <YAxis domain={['auto', 'auto']} />
                  <Tooltip
                    labelFormatter={(dateStr) => {
                      const date = new Date(dateStr);
                      return date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      });
                    }}
                  />
                  <Line type="monotone" dataKey={'value'} stroke="#8884d8" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Portfolio Chat */}
          <PortfolioChat />
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
  const [, navigate] = useLocation(); // Add useLocation
  
  const handleAssessmentComplete = async () => {
    try {
      // Generate portfolio based on assessment
      const res = await apiRequest('POST', '/api/portfolio/generate');
      if (!res.ok) {
        throw new Error(`Failed to generate portfolio: ${res.statusText}`);
      }
      const portfolio = await res.json();

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
    }
  };

  return (
    <div className="p-6">
      <RiskAssessment 
        onComplete={handleAssessmentComplete}
      />
    </div>
  );
}

// Remove Chat function and route

  function Account() {
    const [, navigate] = useLocation();
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

    const handleLogout = async () => {
      try {
        const res = await apiRequest('POST', '/api/auth/logout');
        if (!res.ok) throw new Error('Logout failed');

        toast({
          title: "Logged Out",
          description: "You have been successfully logged out.",
        });

        // Redirect to home page
        navigate('/');
        // Refresh to clear auth state
        window.location.reload();
      } catch (error) {
        console.error('Logout error:', error);
        toast({
          title: "Error",
          description: "Failed to log out. Please try again.",
          variant: "destructive",
        });
      }
    };

    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Account</h1>
        <div className="max-w-2xl space-y-6">
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

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const sidebarToggledByUserRef = useRef(false);
  const [isCompactSidebar, setIsCompactSidebar] = useState(false);

  useEffect(() => {
    const updateCompactState = () => {
      if (typeof window === 'undefined') return;
      const width = window.innerWidth;
      setIsCompactSidebar(width >= 768 && width < 1024);
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
    sidebarToggledByUserRef.current = true;
    setIsSidebarOpen(open);
  }, []);

  return (
    <SidebarProvider
      style={style}
      open={isSidebarOpen}
      onOpenChange={handleSidebarOpenChange}
    >
      <div className="flex h-screen w-full">
        {/* Update AppSidebar call - remove props */}
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <ErrorBoundary>
              <Switch>
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/assessment" component={Assessment} />
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
    <div className="min-h-screen">
      <Header onAuthClick={openLoginModal} showMenuButton={false} />
      <Switch>
        <Route path="/">
          <LandingPage onGetStarted={openRegisterModal} />
        </Route>
        <Route path="/reset-password" component={ResetPassword} />
        <Route component={NotFound} />
      </Switch>
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